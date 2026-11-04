import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

const seed = `
CREATE TABLE employees (id INTEGER PRIMARY KEY, full_name TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE accounts (id INTEGER PRIMARY KEY, employee_id INTEGER, login TEXT NOT NULL, is_active INTEGER NOT NULL);
INSERT INTO employees VALUES (1, 'Анна Смирнова', 'active'), (2, 'Иван Петров', 'terminated'), (3, 'Мария Ким', 'terminated');
INSERT INTO accounts VALUES (1, 1, 'asmirnova', 1), (2, 2, 'ipetrov', 1), (3, 3, 'mkim', 0);
`

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
