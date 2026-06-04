-- FinanceFlow — Database & User Setup
-- Run as root: mysql -u root < scripts/setup-db.sql

CREATE DATABASE IF NOT EXISTS financeflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'financeflow_user'@'localhost'
  IDENTIFIED BY 'FinFlow_Dev2024!';

-- Minimum permissions needed for Prisma migrations + runtime
GRANT SELECT, INSERT, UPDATE, DELETE,
      CREATE, ALTER, DROP, INDEX,
      REFERENCES, CREATE TEMPORARY TABLES
  ON financeflow.*
  TO 'financeflow_user'@'localhost';

FLUSH PRIVILEGES;

SELECT 'Database and user configured successfully.' AS status;
