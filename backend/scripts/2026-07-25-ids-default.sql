-- Aplicado el 2026-07-25 en el proyecto Supabase eumfumpvgwskpuyeoccq.
--
-- Problema: el `@default(uuid())` de Prisma se genera en el cliente de Prisma,
-- nunca llega a la base como DEFAULT. Mientras el backend Express usaba Prisma
-- eso alcanzaba. Tras migrar a supabase-js, el frontend inserta directo contra
-- PostgREST y nadie genera el id, asi que todo `.insert()` sin id explicito
-- fallaba con:
--
--   23502: null value in column "id" violates not-null constraint
--
-- Eso rompia seis flujos de creacion: tarjeta, cuenta, categoria, meta de
-- ahorro, transferencia y prestamo. Los flujos que van por RPC no estaban
-- afectados porque esas funciones hacen gen_random_uuid()::text a mano.
--
-- MonthlyHistory ya tenia el default; estas nueve tablas no.
--
-- El cambio es aditivo: no toca las filas existentes y Prisma sigue mandando su
-- propio id cuando se lo usa, con lo cual el default queda solo como respaldo.

alter table "Account"      alter column id set default (gen_random_uuid())::text;
alter table "Card"         alter column id set default (gen_random_uuid())::text;
alter table "Category"     alter column id set default (gen_random_uuid())::text;
alter table "FixedExpense" alter column id set default (gen_random_uuid())::text;
alter table "Loan"         alter column id set default (gen_random_uuid())::text;
alter table "SavingsGoal"  alter column id set default (gen_random_uuid())::text;
alter table "Transaction"  alter column id set default (gen_random_uuid())::text;
alter table "Transfer"     alter column id set default (gen_random_uuid())::text;
alter table "User"         alter column id set default (gen_random_uuid())::text;

-- Rollback (volveria a romper los seis flujos de creacion):
--
-- alter table "Account"      alter column id drop default;
-- alter table "Card"         alter column id drop default;
-- alter table "Category"     alter column id drop default;
-- alter table "FixedExpense" alter column id drop default;
-- alter table "Loan"         alter column id drop default;
-- alter table "SavingsGoal"  alter column id drop default;
-- alter table "Transaction"  alter column id drop default;
-- alter table "Transfer"     alter column id drop default;
-- alter table "User"         alter column id drop default;
