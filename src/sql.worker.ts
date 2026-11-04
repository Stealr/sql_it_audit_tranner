import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import seed from './data/seed.sql?raw'
import { sameResult } from './data/compare.js'

type Request = { id: number; sql: string; referenceSql?: string; orderMatters?: boolean }

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, sql, referenceSql, orderMatters = false } = event.data
  try {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl })
    const db = new SQL.Database()
    try {
      db.run(seed)
      db.run('PRAGMA query_only = ON')
      const expected = referenceSql ? db.exec(referenceSql).at(-1) : undefined
      const result = db.exec(sql).at(-1) ?? { columns: [], values: [] }
      const correct = expected ? sameResult(result, expected, orderMatters) : undefined
      self.postMessage({ id, columns: result.columns, rows: result.values, correct })
    } finally {
      db.close()
    }
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) })
  }
}
