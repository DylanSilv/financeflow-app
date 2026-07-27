-- Aplicado el 2026-07-27 en el proyecto Supabase eumfumpvgwskpuyeoccq.
--
-- Card.balanceUsed solo se mantenia en dos de los tres caminos:
--
--   crear movimiento -> create_transaction sumaba
--   borrar movimiento -> delete_transaction restaba
--   EDITAR movimiento -> nadie hacia nada
--
-- Editar el monto de un gasto con tarjeta dejaba el contador desalineado para
-- siempre. Con el control de saldo activo eso pasa de ser un numero feo a un
-- problema real: un balanceUsed inflado bloquea compras que si entrarian, y uno
-- subestimado deja gastar de mas.
--
-- Se pasa a un trigger AFTER que mantiene el contador en alta, edicion y
-- borrado, y se quitan los updates manuales de create_transaction y
-- delete_transaction. Dejarlos habria duplicado el conteo.
--
-- El trigger es AFTER a proposito: trg_transaction_funds es BEFORE y lee
-- balanceUsed para decidir si hay saldo. Al correr antes, ve el valor previo al
-- movimiento, que es justo lo que su ajuste por el monto viejo asume.

create or replace function public.sync_card_balance_used()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
DECLARE
  v_old numeric := 0;
  v_new numeric := 0;
BEGIN
  IF TG_OP IN ('UPDATE','DELETE')
     AND OLD."paymentMethod" = 'CREDIT_CARD' AND OLD."cardId" IS NOT NULL
     AND OLD.type = 'EXPENSE' THEN
    v_old := OLD.amount;
  END IF;

  IF TG_OP IN ('INSERT','UPDATE')
     AND NEW."paymentMethod" = 'CREDIT_CARD' AND NEW."cardId" IS NOT NULL
     AND NEW.type = 'EXPENSE' THEN
    v_new := NEW.amount;
  END IF;

  IF v_old > 0 AND v_new > 0 AND OLD."cardId" = NEW."cardId" THEN
    UPDATE "Card" SET "balanceUsed" = GREATEST("balanceUsed" + (v_new - v_old), 0)
    WHERE id = NEW."cardId";
  ELSE
    IF v_old > 0 THEN
      UPDATE "Card" SET "balanceUsed" = GREATEST("balanceUsed" - v_old, 0)
      WHERE id = OLD."cardId";
    END IF;
    IF v_new > 0 THEN
      UPDATE "Card" SET "balanceUsed" = "balanceUsed" + v_new
      WHERE id = NEW."cardId";
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

drop trigger if exists trg_card_balance_used on "Transaction";
create trigger trg_card_balance_used
  after insert or delete or update of amount, type, "cardId", "paymentMethod"
  on "Transaction" for each row execute function public.sync_card_balance_used();

-- create_transaction y delete_transaction dejan de tocar Card. Ver el cuerpo
-- vigente en la base.

-- PENDIENTE, requiere decision del usuario: los contadores actuales arrastran
-- desvio de antes de este cambio. Para recalcular uno desde sus movimientos:
--
--   update "Card" c set "balanceUsed" = coalesce((
--     select sum(t.amount) from "Transaction" t
--     where t."cardId" = c.id and t."paymentMethod" = 'CREDIT_CARD'
--       and t.type = 'EXPENSE' and t."userId" = c."userId"), 0)
--   where c.id = '<id>';
--
-- Ojo: eso asume que balanceUsed es el acumulado historico de consumos. Si el
-- usuario pago la tarjeta en algun momento, el saldo real es menor y recalcular
-- asi lo inflaria. La app no modela pagos de tarjeta.

-- Rollback:
--   drop trigger if exists trg_card_balance_used on "Transaction";
--   drop function if exists public.sync_card_balance_used();
--   y devolver los UPDATE "Card" a create_transaction y delete_transaction.
