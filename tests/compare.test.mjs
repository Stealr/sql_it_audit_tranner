import assert from 'node:assert/strict'
import test from 'node:test'
import { sameResult } from '../src/data/compare.js'

const result = (values, columnCount = 1) => ({ columns: Array(columnCount).fill('x'), values })

test('проверка принимает разные имена столбцов и порядок, когда он не важен', () => {
  const expected = { columns: ['original'], values: [[1], [2], [2]] }
  assert.equal(sameResult(result([[2], [1], [2]]), expected, false), true)
  assert.equal(sameResult(result([[2], [1], [2]]), expected, true), false)
})

test('проверка учитывает повторы, число столбцов и NULL', () => {
  const expected = result([[null], [2], [2]])
  assert.equal(sameResult(result([[null], [2]]), expected, false), false)
  assert.equal(sameResult(result([[null], [2], [3]]), expected, false), false)
  assert.equal(sameResult(result([[null, 2]], 2), expected, false), false)
  assert.equal(sameResult(result([['null'], [2], [2]]), expected, false), false)
})
