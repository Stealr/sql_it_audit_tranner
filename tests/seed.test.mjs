import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import initSqlJs from 'sql.js'

const seed = readFileSync(new URL('../src/data/seed.sql', import.meta.url), 'utf8')
const SQL = await initSqlJs()

function database() {
  const db = new SQL.Database()
  db.run(seed)
  return db
}

function rows(db, query) {
  return db.exec(query)[0]?.values ?? []
}

test('схема содержит все восемь учебных таблиц', () => {
  const db = database()
  assert.deepEqual(rows(db, "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"), [
    ['account_roles'], ['accounts'], ['approvals'], ['assets'], ['employees'],
    ['journal_entries'], ['roles'], ['systems'],
  ])
  db.close()
})

test('данные дают ожидаемые результаты заданий 1–3', () => {
  const db = database()
  assert.deepEqual(rows(db, 'SELECT id, login FROM accounts WHERE is_active = 1 ORDER BY id'), [
    [1, 'asmirnova'], [2, 'ipetrov'], [4, 'osokolov'], [5, 'svc_erp'],
  ])
  assert.deepEqual(rows(db, "SELECT id, full_name FROM employees WHERE status = 'terminated' ORDER BY full_name, id"), [
    [2, 'Иван Петров'], [3, 'Мария Ким'],
  ])
  assert.deepEqual(rows(db, 'SELECT id, asset_tag FROM assets WHERE owner_employee_id IS NULL ORDER BY id'), [
    [2, 'LAP-002'], [4, 'MON-004'],
  ])
  db.close()
})

test('данные покрывают задания 4–6 и исключают ложные находки', () => {
  const db = database()
  assert.deepEqual(rows(db, `SELECT a.id, a.login FROM accounts AS a
    LEFT JOIN employees AS e ON e.id = a.employee_id
    WHERE e.id IS NULL ORDER BY a.id`), [
    [5, 'svc_erp'], [6, 'unknown_owner'],
  ])
  assert.deepEqual(rows(db, `SELECT id, login FROM accounts AS a
    WHERE NOT EXISTS (SELECT 1 FROM employees AS e WHERE e.id = a.employee_id)
    ORDER BY id`), [
    [5, 'svc_erp'], [6, 'unknown_owner'],
  ])
  assert.deepEqual(rows(db, `SELECT e.full_name, a.login FROM employees AS e
    JOIN accounts AS a ON a.employee_id = e.id
    WHERE e.status = 'terminated' AND a.is_active = 1
    ORDER BY e.full_name, a.login`), [
    ['Иван Петров', 'ipetrov'],
  ])
  assert.deepEqual(rows(db, `SELECT a.asset_tag, e.full_name FROM assets AS a
    JOIN employees AS e ON e.id = a.owner_employee_id
    WHERE e.status = 'terminated' ORDER BY a.asset_tag`), [
    ['KEY-006', 'Мария Ким'], ['LAP-005', 'Иван Петров'],
  ])
  db.close()
})

test('просмотр таблицы ограничивает выдачу и не изменяет данные', () => {
  const db = database()
  const preview = db.exec('SELECT * FROM "accounts" ORDER BY rowid LIMIT 8')[0]
  assert.deepEqual(preview.columns, ['id', 'employee_id', 'system_id', 'login', 'is_active'])
  assert.equal(preview.values.length, 6)
  assert.deepEqual(rows(db, 'SELECT COUNT(*) FROM accounts'), [[6]])
  db.close()
})

test('новая база восстанавливает исходные данные', () => {
  const first = database()
  first.run('DELETE FROM accounts')
  assert.deepEqual(rows(first, 'SELECT COUNT(*) FROM accounts'), [[0]])
  first.close()

  const second = database()
  assert.deepEqual(rows(second, 'SELECT COUNT(*) FROM accounts'), [[6]])
  second.close()
})
