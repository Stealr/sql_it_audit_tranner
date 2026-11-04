import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import seed from './data/seed.sql?raw'

type Request = { id: number; sql: string }

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, sql } = event.data
  try {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl })
    const db = new SQL.Database()
    try {
      db.run(seed)
      const result = db.exec(sql)
      self.postMessage({ id, columns: result.at(-1)?.columns ?? [], rows: result.at(-1)?.values ?? [] })
    } finally {
      db.close()
    }
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) })
  }
}
