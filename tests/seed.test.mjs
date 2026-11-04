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
    [1, 'asmirnova'], [2, 'ipetrov'], [4, 'osokolov'],
  ])
  assert.deepEqual(rows(db, "SELECT id, full_name FROM employees WHERE status = 'terminated' ORDER BY full_name, id"), [
    [2, 'Иван Петров'], [3, 'Мария Ким'],
  ])
  assert.deepEqual(rows(db, 'SELECT id, asset_tag FROM assets WHERE owner_employee_id IS NULL ORDER BY id'), [
    [2, 'LAP-002'], [4, 'MON-004'],
  ])
  db.close()
})

test('новая база восстанавливает исходные данные', () => {
  const first = database()
  first.run('DELETE FROM accounts')
  assert.deepEqual(rows(first, 'SELECT COUNT(*) FROM accounts'), [[0]])
  first.close()

  const second = database()
  assert.deepEqual(rows(second, 'SELECT COUNT(*) FROM accounts'), [[4]])
  second.close()
})
