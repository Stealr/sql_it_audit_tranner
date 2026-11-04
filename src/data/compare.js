/**
 * Сравнивает таблицы результата по значениям и количеству столбцов.
 * Имена столбцов не влияют на оценку. Сортировка копий сохраняет повторы строк.
 * @param {{columns: string[], values: unknown[][]}} actual
 * @param {{columns: string[], values: unknown[][]}} expected
 * @param {boolean} orderMatters
 */
export function sameResult(actual, expected, orderMatters) {
  if (actual.columns.length !== expected.columns.length || actual.values.length !== expected.values.length) return false
  const actualRows = actual.values.map((row) => JSON.stringify(row))
  const expectedRows = expected.values.map((row) => JSON.stringify(row))
  if (!orderMatters) {
    actualRows.sort()
    expectedRows.sort()
  }
  return actualRows.every((row, index) => row === expectedRows[index])
}
