import { useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLanguage, SQLite } from '@codemirror/lang-sql'

const starterQuery = `SELECT e.full_name, a.login
FROM employees e
JOIN accounts a ON a.employee_id = e.id
WHERE e.status = 'terminated' AND a.is_active = 1;`

type QueryResult = { id: number; columns: string[]; rows: (string | number | null)[][]; error?: string }

function App() {
  const [query, setQuery] = useState(() => localStorage.getItem('sql-trainer:query') ?? starterQuery)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [running, setRunning] = useState(false)
  const worker = useRef<Worker | null>(null)
  const requestId = useRef(0)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    localStorage.setItem('sql-trainer:query', query)
  }, [query])

  useEffect(() => () => {
    worker.current?.terminate()
    if (timeout.current) clearTimeout(timeout.current)
  }, [])

  function runQuery() {
    if (timeout.current) clearTimeout(timeout.current)
    worker.current?.terminate()
    const nextWorker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' })
    worker.current = nextWorker
    const id = ++requestId.current
    setRunning(true)
    setResult(null)
    nextWorker.onmessage = (event: MessageEvent<QueryResult>) => {
      if (event.data.id !== id) return
      if (timeout.current) clearTimeout(timeout.current)
      setResult(event.data)
      setRunning(false)
      nextWorker.terminate()
      worker.current = null
    }
    nextWorker.onerror = () => {
      if (timeout.current) clearTimeout(timeout.current)
      setResult({ id, columns: [], rows: [], error: 'Не удалось запустить базу данных.' })
      setRunning(false)
      nextWorker.terminate()
      worker.current = null
    }
    nextWorker.postMessage({ id, sql: query })
    timeout.current = setTimeout(() => {
      nextWorker.terminate()
      worker.current = null
      setRunning(false)
      setResult({ id, columns: [], rows: [], error: 'Запрос выполнялся слишком долго. Попробуйте упростить его.' })
    }, 5000)
  }

  return (
    <main className="app">
      <header>
        <span className="eyebrow">SQL-тренажёр · ИТ-аудит</span>
        <h1>Активные учётные записи уволенных сотрудников</h1>
        <p>Найдите имя сотрудника и логин для каждой активной учётной записи, связанной с уволенным сотрудником.</p>
      </header>

      <section className="schema" aria-label="Доступные таблицы">
        <div><strong>employees</strong><code>id · full_name · status</code></div>
        <div><strong>accounts</strong><code>id · employee_id · login · is_active</code></div>
        <p><code>status = 'terminated'</code> означает увольнение; <code>is_active = 1</code> означает активную учётную запись.</p>
      </section>

      <section aria-label="Редактор SQL">
        <CodeMirror value={query} height="220px" extensions={[sqlLanguage({ dialect: SQLite })]} onChange={setQuery} />
        <button onClick={runQuery} disabled={running}>{running ? 'Выполняется…' : 'Выполнить запрос'}</button>
      </section>

      <section className="result" aria-live="polite">
        <h2>Результат</h2>
        {result?.error && <p role="alert" className="error">{result.error}</p>}
        {result && !result.error && result.columns.length === 0 && <p>Запрос не вернул таблицу.</p>}
        {result && !result.error && result.columns.length > 0 && (
          <div className="table-wrap"><table><thead><tr>{result.columns.map((column, index) => <th key={index}>{column}</th>)}</tr></thead>
            <tbody>{result.rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}>{value === null ? 'NULL' : String(value)}</td>)}</tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  )
}

export default App
