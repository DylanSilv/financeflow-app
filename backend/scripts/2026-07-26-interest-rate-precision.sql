-- Aplicado el 2026-07-26 en el proyecto Supabase eumfumpvgwskpuyeoccq.
--
-- interestRate era numeric(6,4), que topea en 99.9999 %. En plaza uruguaya hay
-- creditos al consumo con TEA de tres digitos, asi que ese tipo se quedaba
-- corto. numeric(9,4) admite hasta 99999.9999 %.

alter table "Loan" alter column "interestRate" type numeric(9,4);

-- Correccion de dato: 'Alquiler (Brou)' (cuenta de pruebas) tenia 13.9024 %,
-- inconsistente con su cronograma: con esa tasa el saldo en la cuota 24 daba
-- $6.321,48 en vez de cero. La tasa real implicita en capital 148000, cuota
-- 6869.10 y 24 plazos es 10.5795 % nominal anual.
--
-- update "Loan" set "interestRate" = 10.5795 where name = 'Alquiler (Brou)';

-- Rollback:
-- alter table "Loan" alter column "interestRate" type numeric(6,4);
