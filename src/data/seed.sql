CREATE TABLE employees (id INTEGER PRIMARY KEY, full_name TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE systems (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE accounts (id INTEGER PRIMARY KEY, employee_id INTEGER, system_id INTEGER NOT NULL, login TEXT NOT NULL, is_active INTEGER NOT NULL);
CREATE TABLE roles (id INTEGER PRIMARY KEY, name TEXT NOT NULL, is_privileged INTEGER NOT NULL);
CREATE TABLE account_roles (account_id INTEGER NOT NULL, role_id INTEGER NOT NULL);
CREATE TABLE assets (id INTEGER PRIMARY KEY, asset_tag TEXT NOT NULL, owner_employee_id INTEGER, system_id INTEGER NOT NULL);
CREATE TABLE journal_entries (id INTEGER PRIMARY KEY, entry_date TEXT NOT NULL, amount INTEGER NOT NULL, created_by_account_id INTEGER NOT NULL);
CREATE TABLE approvals (id INTEGER PRIMARY KEY, entry_id INTEGER NOT NULL, decision TEXT NOT NULL, approver_account_id INTEGER NOT NULL);

INSERT INTO employees VALUES
  (1, 'Анна Смирнова', 'active'),
  (2, 'Иван Петров', 'terminated'),
  (3, 'Мария Ким', 'terminated'),
  (4, 'Олег Соколов', 'active');
INSERT INTO systems VALUES
  (1, 'ERP'), (2, 'Кадровая система'), (3, 'Архив');
INSERT INTO accounts VALUES
  (1, 1, 1, 'asmirnova', 1),
  (2, 2, 1, 'ipetrov', 1),
  (3, 3, 1, 'mkim', 0),
  (4, 4, 2, 'osokolov', 1),
  (5, NULL, 1, 'svc_erp', 1),
  (6, 99, 2, 'unknown_owner', 0),
  (7, 1, 2, 'asmirnova_kadry', 1),
  (8, 1, 1, 'asmirnova_erp', 1),
  (9, 2, 1, 'ipetrov', 1),
  (10, 4, 1, 'osokolov_erp', 0),
  (11, 3, 2, 'mkim', 0),
  (12, 4, 2, 'osokolov', 0);
INSERT INTO assets VALUES
  (1, 'LAP-001', 1, 1),
  (2, 'LAP-002', NULL, 1),
  (3, 'SRV-003', 4, 2),
  (4, 'MON-004', NULL, 2),
  (5, 'LAP-005', 2, 1),
  (6, 'KEY-006', 3, 2);

INSERT INTO roles VALUES
  (1, 'Администратор', 1),
  (2, 'Читатель', 0),
  (3, 'Аудитор', 1);
INSERT INTO account_roles VALUES
  (1, 2),
  (2, 1),
  (3, 1),
  (4, 3),
  (5, 1);

INSERT INTO journal_entries VALUES
  (1, '2026-04-01', 99999, 1),
  (2, '2026-04-02', 180000, 5),
  (3, '2026-04-03', 240000, 4),
  (4, '2026-04-04', 100000, 2),
  (5, '2026-04-05', 125000, 7),
  (6, '2026-04-06', 180000, 8);
INSERT INTO approvals VALUES
  (1, 2, 'rejected', 4),
  (2, 2, 'rejected', 1),
  (3, 3, 'rejected', 1),
  (4, 3, 'approved', 2),
  (5, 5, 'approved', 4);
