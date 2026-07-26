-- Rollback de los overloads viejos eliminados el 2026-07-25.
--
-- Contexto: tras la migracion a Supabase quedaron dos versiones de estas dos
-- funciones. Como en ambos pares los parametros extra tienen DEFAULT NULL, las
-- llamadas del frontend encajaban en las dos y PostgREST no podia elegir
-- candidato, devolviendo PGRST203. Eso rompia el alta de movimientos y el pago
-- de cuotas de prestamo.
--
-- Se conservaron las versiones alineadas con el esquema actual:
--   * create_transaction    -> la de 10 params (incluye p_iva_amount / Transaction.ivaAmount)
--   * pay_loan_installment  -> la de 3 params  (mantiene Loan.currentBalance y aplica interestRate)
--
-- Este archivo restaura EXACTAMENTE las versiones borradas. Solo correr si hace
-- falta volver atras; al recrearlas vuelve la ambiguedad y con ella el PGRST203.

CREATE OR REPLACE FUNCTION public.pay_loan_installment(p_loan_id text, p_account_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid   text := current_app_user_id();
  l       record;
  new_paid int;
  cat_id  text;
  cat_name text;
  now_ts  timestamp := now();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO l FROM "Loan" WHERE id=p_loan_id AND "userId"=v_uid;
  IF NOT FOUND      THEN RAISE EXCEPTION 'Not found'; END IF;
  IF l.status='PAID' THEN RAISE EXCEPTION 'Already paid'; END IF;
  IF l."paidInstallments" >= l."totalInstallments" THEN RAISE EXCEPTION 'All installments paid'; END IF;

  new_paid := l."paidInstallments" + 1;
  UPDATE "Loan" SET
    "paidInstallments" = new_paid,
    status = CASE WHEN new_paid >= l."totalInstallments" THEN 'PAID'::"LoanStatus" ELSE status END
  WHERE id=p_loan_id;

  IF p_account_id IS NOT NULL THEN
    cat_name := CASE WHEN l."loanType"='PERSONAL' THEN 'Préstamos' ELSE 'Cuentas Fijas' END;
    INSERT INTO "Category"(id, name, color, "userId")
    VALUES (gen_random_uuid()::text, cat_name, '#6366f1', v_uid)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_id FROM "Category" WHERE name=cat_name AND "userId"=v_uid LIMIT 1;

    INSERT INTO "Transaction"(id, title, amount, date, type, "paymentMethod", "categoryId", "accountId", "loanId", "userId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text,
      l.name||' — cuota '||new_paid||'/'||l."totalInstallments",
      l."installmentAmount", now_ts, 'EXPENSE', 'BANK_TRANSFER', cat_id, p_account_id, p_loan_id, v_uid, now_ts, now_ts);

    UPDATE "FixedExpense" SET status='PAID' WHERE "loanId"=p_loan_id AND "userId"=v_uid;
  END IF;

  RETURN jsonb_build_object(
    'id',p_loan_id,'paidInstallments',new_paid,
    'status', CASE WHEN new_paid >= l."totalInstallments" THEN 'PAID' ELSE 'ACTIVE' END,
    'remainingAmount', GREATEST(l."originalAmount" - l."installmentAmount"*new_paid, 0),
    'progress', CASE WHEN l."totalInstallments">0 THEN ROUND((new_paid::numeric/l."totalInstallments")*100) ELSE 0 END
  );
END; $function$;

CREATE OR REPLACE FUNCTION public.create_transaction(p_title text, p_amount numeric, p_date timestamp with time zone, p_type text, p_payment_method text, p_category_id text DEFAULT NULL::text, p_card_id text DEFAULT NULL::text, p_account_id text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid  text := current_app_user_id();
  v_id   text := gen_random_uuid()::text;
  now_ts timestamp := now();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  INSERT INTO "Transaction"(id, title, description, amount, date, type, "paymentMethod",
    "categoryId", "cardId", "accountId", "userId", "createdAt", "updatedAt")
  VALUES (v_id, p_title, p_description, p_amount, p_date,
    p_type::"TransactionType", p_payment_method::"PaymentMethod",
    p_category_id, p_card_id, p_account_id, v_uid, now_ts, now_ts);

  IF p_payment_method = 'CREDIT_CARD' AND p_card_id IS NOT NULL AND p_type = 'EXPENSE' THEN
    UPDATE "Card" SET "balanceUsed" = "balanceUsed" + p_amount
    WHERE id = p_card_id AND "userId" = v_uid;
  END IF;

  RETURN jsonb_build_object('id', v_id);
END;
$function$;
