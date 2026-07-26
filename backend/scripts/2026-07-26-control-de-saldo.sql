-- Aplicado el 2026-07-26 en el proyecto Supabase eumfumpvgwskpuyeoccq.
--
-- Impide que un gasto supere el disponible del medio de pago.
--
-- Disponible segun el caso:
--   * Tarjeta de credito -> limit - balanceUsed. Si no tiene limite cargado no
--     hay tope y no se valida nada.
--   * Cuenta             -> mismo calculo que get_balance_por_cuenta:
--                           initialBalance + ingresos - gastos
--                           + transferencias recibidas - enviadas.
--   * Efectivo sin cuenta -> sin tope.
--
-- La validacion vive en la base y no solo en el frontend por dos razones: es el
-- unico punto que no se puede saltear, y entre que la pantalla lee el saldo y
-- el usuario guarda, el saldo pudo haber cambiado desde otra pestana o
-- dispositivo.
--
-- El error se emite como 'SALDO_INSUFICIENTE' con DETAIL en json, para que el
-- frontend lo distinga de un fallo generico y muestre el mensaje correcto.

create or replace function public.available_funds(
  p_payment_method text,
  p_card_id        text,
  p_account_id     text
) returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
DECLARE
  v_uid text := current_app_user_id();
  v_res numeric;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;

  IF p_payment_method = 'CREDIT_CARD' AND p_card_id IS NOT NULL THEN
    SELECT CASE WHEN c."limit" IS NULL OR c."limit" <= 0
                THEN NULL
                ELSE c."limit" - c."balanceUsed" END
      INTO v_res
      FROM "Card" c WHERE c.id = p_card_id AND c."userId" = v_uid;
    RETURN v_res;
  END IF;

  IF p_account_id IS NOT NULL THEN
    SELECT a."initialBalance"
         + COALESCE((SELECT SUM(t.amount) FROM "Transaction" t
                      WHERE t."accountId"=a.id AND t."userId"=v_uid AND t.type='INCOME'), 0)
         - COALESCE((SELECT SUM(t.amount) FROM "Transaction" t
                      WHERE t."accountId"=a.id AND t."userId"=v_uid AND t.type='EXPENSE'), 0)
         + COALESCE((SELECT SUM(tf.amount) FROM "Transfer" tf
                      WHERE tf."toAccountId"=a.id AND tf."userId"=v_uid), 0)
         - COALESCE((SELECT SUM(tf.amount) FROM "Transfer" tf
                      WHERE tf."fromAccountId"=a.id AND tf."userId"=v_uid), 0)
      INTO v_res
      FROM "Account" a WHERE a.id = p_account_id AND a."userId" = v_uid;
    RETURN v_res;
  END IF;

  RETURN NULL;
END;
$$;

-- create_transaction suma el bloque de validacion antes del INSERT. El resto de
-- la funcion queda igual que antes.

-- Rollback: quitar el bloque `IF p_type = 'EXPENSE' THEN ... END IF;` de
-- create_transaction y, si se quiere, `drop function public.available_funds(text, text, text);`
