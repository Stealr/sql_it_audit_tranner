import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import initSqlJs from 'sql.js'
import { sameResult } from '../src/data/compare.js'
import { tasks } from '../src/data/tasks.js'

const seed = readFileSync(new URL('../src/data/seed.sql', import.meta.url), 'utf8')
const SQL = await initSqlJs()

const alternatives = [
  'SELECT id AS account, login AS username FROM accounts WHERE is_active IN (1) ORDER BY 1',
  "SELECT id, full_name FROM employees WHERE status IN ('terminated') ORDER BY 2, 1",
  'SELECT id, asset_tag FROM assets WHERE owner_employee_id ISNULL ORDER BY 1',
  'SELECT id, login FROM accounts a WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = a.employee_id) ORDER BY id',
  "SELECT e.full_name, a.login FROM accounts a JOIN (SELECT id, full_name FROM employees WHERE status = 'terminated') e ON e.id = a.employee_id WHERE a.is_active = 1 ORDER BY 1, 2",
  "SELECT asset_tag, (SELECT full_name FROM employees e WHERE e.id = a.owner_employee_id) FROM assets a WHERE owner_employee_id IN (SELECT id FROM employees WHERE status = 'terminated') ORDER BY 1",
  'SELECT a.login, r.name FROM account_roles ar JOIN (SELECT id, login FROM accounts WHERE is_active = 1) a ON a.id = ar.account_id JOIN (SELECT id, name FROM roles WHERE is_privileged = 1) r ON r.id = ar.role_id ORDER BY 1, 2',
  'SELECT s.name, (SELECT COUNT(*) FROM accounts a WHERE a.system_id = s.id AND a.is_active = 1) FROM systems s ORDER BY 1',
  'WITH counts AS (SELECT system_id, login, COUNT(*) AS n FROM accounts GROUP BY system_id, login) SELECT s.name, c.login, c.n FROM counts c JOIN systems s ON s.id = c.system_id WHERE c.n > 1 ORDER BY 1, 2',
  'WITH counts AS (SELECT employee_id, COUNT(*) AS n FROM accounts WHERE is_active = 1 GROUP BY employee_id HAVING COUNT(*) > 1) SELECT e.full_name, c.n FROM counts c JOIN employees e ON e.id = c.employee_id ORDER BY c.n DESC, e.full_name',
  "SELECT j.id, j.entry_date, j.amount FROM journal_entries j LEFT JOIN approvals p ON p.entry_id = j.id AND p.decision = 'approved' WHERE p.id IS NULL ORDER BY j.id",
  "SELECT j.id, a.login, j.amount FROM journal_entries j JOIN accounts a ON a.id = j.created_by_account_id LEFT JOIN approvals p ON p.entry_id = j.id AND p.decision = 'approved' WHERE j.amount >= 100000 AND p.id IS NULL ORDER BY j.amount DESC, j.id",
]

assert.deepEqual(tasks.map(({ id }) => id), alternatives.map((_, i) => i + 1))

for (const task of tasks) {
  test(`задание ${task.id}: альтернативное решение принято, заготовка отклонена`, () => {
    const db = new SQL.Database()
    try {
      db.run(seed)
      const [expected] = db.exec(task.referenceSql)
      assert.ok(expected.values.length > 0)
      assert.equal(expected.columns.length, task.expectedColumns.length)
      assert.ok(sameResult(db.exec(alternatives[task.id - 1])[0], expected, task.orderMatters))
      assert.ok(!sameResult(db.exec(task.starterSql)[0], expected, task.orderMatters))
    } finally {
      db.close()
    }
  })
}

test('проводки: отказы, смешанные решения, порог и порядок при равных суммах', () => {
  const db = new SQL.Database()
  try {
    db.run(seed)
    assert.deepEqual(db.exec(tasks[10].referenceSql)[0].values, [
      [1, '2026-04-01', 99999], [2, '2026-04-02', 180000],
      [4, '2026-04-04', 100000], [6, '2026-04-06', 180000],
    ])
    assert.deepEqual(db.exec(tasks[11].referenceSql)[0].values, [
      [2, 'svc_erp', 180000], [6, 'asmirnova_erp', 180000], [4, 'ipetrov', 100000],
    ])
  } finally {
    db.close()
  }
})
