-- Aplicado el 2026-07-26 en el proyecto Supabase eumfumpvgwskpuyeoccq.
-- Reemplaza al enfoque de 2026-07-26-control-de-saldo.sql, que solo cubria el
-- alta de movimientos.
--
-- POR QUE TRIGGERS Y NO VALIDAR EN CADA FUNCION
--
-- De los cuatro caminos que pueden dejar una cuenta en negativo, dos escriben
-- directo a la tabla desde el cliente y no pasan por ningun RPC:
--
--   1. Alta de movimiento      -> RPC create_transaction
--   2. Edicion de movimiento   -> supabase.from('Transaction').update(...)
--   3. Transferencia           -> supabase.from('Transfer').insert(...)
--   4. Autopago de gastos fijos-> RPC run_autopay
--
-- Validar dentro de las funciones dejaba 2 y 3 sin cubrir. Los triggers son el
-- unico punto por el que pasan todos, incluidos caminos futuros.
--
-- available_funds() pasa a recibir el usuario explicito (antes lo tomaba de la
-- sesion) porque un trigger no deberia depender del contexto de sesion. La
-- version de 3 argumentos se dropeo para no dejar overloads ambiguos, que ya
-- fueron fuente de bugs en este proyecto.
--
-- EL AJUSTE POR EL MONTO VIEJO EN UN UPDATE
--
-- El saldo de una cuenta se deriva de sus movimientos, asi que en un UPDATE el
-- gasto viejo ya esta restado. Si no se lo devuelve antes de comparar, no se
-- podria ni bajar el monto de un gasto ya cargado: con saldo 0 y un gasto de
-- 1000, corregirlo a 900 daria "saldo insuficiente". Lo mismo aplica a la
-- tarjeta, donde el monto viejo ya esta sumado en balanceUsed.
--
-- AUTOPAGO
--
-- run_autopay saltea los gastos que no puede pagar en lugar de fallar, y los
-- informa en `skipped`. Si dejara propagar la excepcion del trigger, se
-- abortaria toda la corrida y se revertirian los gastos ya pagados en el mismo
-- lote. El chequeo va antes de marcar el gasto como PAID.
--
-- El error viaja como 'SALDO_INSUFICIENTE' con DETAIL en json
-- ({disponible, solicitado}); lo interpreta frontend/src/lib/fundsError.ts.

-- 1) available_funds con usuario explicito -----------------------------------

drop function if exists public.available_funds(text, text, text);

create or replace function public.available_funds(
  p_user_id text, p_payment_method text, p_card_id text, p_account_id text
) returns numeric
language plpgsql stable security definer set search_path to 'public'
as $$
DECLARE v_res numeric;
BEGIN
  IF p_user_id IS NULL THEN RETURN NULL; END IF;

  IF p_payment_method = 'CREDIT_CARD' AND p_card_id IS NOT NULL THEN
    SELECT CASE WHEN c."limit" IS NULL OR c."limit" <= 0
                THEN NULL ELSE c."limit" - c."balanceUsed" END
      INTO v_res FROM "Card" c WHERE c.id = p_card_id AND c."userId" = p_user_id;
    RETURN v_res;
  END IF;

  IF p_account_id IS NOT NULL THEN
    SELECT a."initialBalance"
         + COALESCE((SELECT SUM(t.amount) FROM "Transaction" t
                      WHERE t."accountId"=a.id AND t."userId"=p_user_id AND t.type='INCOME'), 0)
         - COALESCE((SELECT SUM(t.amount) FROM "Transaction" t
                      WHERE t."accountId"=a.id AND t."userId"=p_user_id AND t.type='EXPENSE'), 0)
         + COALESCE((SELECT SUM(tf.amount) FROM "Transfer" tf
                      WHERE tf."toAccountId"=a.id AND tf."userId"=p_user_id), 0)
         - COALESCE((SELECT SUM(tf.amount) FROM "Transfer" tf
                      WHERE tf."fromAccountId"=a.id AND tf."userId"=p_user_id), 0)
      INTO v_res FROM "Account" a WHERE a.id = p_account_id AND a."userId" = p_user_id;
    RETURN v_res;
  END IF;

  RETURN NULL;   -- efectivo sin cuenta, o tarjeta sin limite: no hay tope
END;
$$;

-- 2) Trigger sobre Transaction ----------------------------------------------

create or replace function public.check_transaction_funds()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
DECLARE v_available numeric;
BEGIN
  IF NEW.type <> 'EXPENSE' THEN RETURN NEW; END IF;

  v_available := public.available_funds(
    NEW."userId", NEW."paymentMethod"::text, NEW."cardId", NEW."accountId");
  IF v_available IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND OLD.type = 'EXPENSE' THEN
    IF NEW."paymentMethod" = 'CREDIT_CARD' THEN
      IF OLD."cardId" IS NOT DISTINCT FROM NEW."cardId" THEN
        v_available := v_available + OLD.amount;
      END IF;
    ELSE
      IF OLD."accountId" IS NOT DISTINCT FROM NEW."accountId" THEN
        v_available := v_available + OLD.amount;
      END IF;
    END IF;
  END IF;

  IF NEW.amount > v_available THEN
    RAISE EXCEPTION 'SALDO_INSUFICIENTE'
      USING DETAIL = json_build_object('disponible', v_available, 'solicitado', NEW.amount)::text,
            HINT   = 'El gasto supera el saldo disponible del medio de pago.';
  END IF;

  RETURN NEW;
END;
$$;

drop trigger if exists trg_transaction_funds on "Transaction";
create trigger trg_transaction_funds
  before insert or update of amount, type, "accountId", "cardId", "paymentMethod"
  on "Transaction" for each row execute function public.check_transaction_funds();

-- 3) Trigger sobre Transfer -------------------------------------------------

create or replace function public.check_transfer_funds()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
DECLARE v_available numeric;
BEGIN
  v_available := public.available_funds(NEW."userId", 'BANK_TRANSFER', NULL, NEW."fromAccountId");
  IF v_available IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND OLD."fromAccountId" IS NOT DISTINCT FROM NEW."fromAccountId" THEN
    v_available := v_available + OLD.amount;
  END IF;

  IF NEW.amount > v_available THEN
    RAISE EXCEPTION 'SALDO_INSUFICIENTE'
      USING DETAIL = json_build_object('disponible', v_available, 'solicitado', NEW.amount)::text,
            HINT   = 'La transferencia supera el saldo de la cuenta de origen.';
  END IF;

  RETURN NEW;
END;
$$;

drop trigger if exists trg_transfer_funds on "Transfer";
create trigger trg_transfer_funds
  before insert or update of amount, "fromAccountId"
  on "Transfer" for each row execute function public.check_transfer_funds();

-- 4) create_transaction ya no valida (lo hace el trigger) y run_autopay
--    saltea lo que no puede pagar. Ver el cuerpo vigente en la base.

-- Rollback:
--   drop trigger if exists trg_transaction_funds on "Transaction";
--   drop trigger if exists trg_transfer_funds on "Transfer";
--   drop function if exists public.check_transaction_funds();
--   drop function if exists public.check_transfer_funds();
--   drop function if exists public.available_funds(text, text, text, text);
