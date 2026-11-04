import { useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLanguage, SQLite } from '@codemirror/lang-sql'
import { tableColumns, tasks } from './data/tasks'

const sqlExtensions = [sqlLanguage({ dialect: SQLite })]
const plannedTaskCount = 12
type QueryResult = { id: number; columns: string[]; rows: (string | number | null)[][]; error?: string; correct?: boolean }

function routeTaskId(): number | null {
  const match = window.location.hash.match(/^#task\/(\d+)$/)
  const id = match ? Number(match[1]) : null
  return tasks.some((task) => task.id === id) ? id : null
}

function savedQuery(id: number): string {
  return localStorage.getItem(`sql-trainer:query:${id}`) ?? tasks.find((task) => task.id === id)!.starterSql
}

function App() {
  const [taskId, setTaskId] = useState<number | null>(routeTaskId)
  const [query, setQuery] = useState(() => taskId === null ? '' : savedQuery(taskId))
  const [result, setResult] = useState<QueryResult | null>(null)
  const [running, setRunning] = useState(false)
  const [assessment, setAssessment] = useState<'correct' | 'incorrect' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [previewTable, setPreviewTable] = useState<string | null>(null)
  const [preview, setPreview] = useState<QueryResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const worker = useRef<Worker | null>(null)
  const previewWorker = useRef<Worker | null>(null)
  const requestId = useRef(0)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const task = tasks.find((item) => item.id === taskId)

  useEffect(() => {
    const onHashChange = () => setTaskId(routeTaskId())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    worker.current?.terminate()
    worker.current = null
    previewWorker.current?.terminate()
    previewWorker.current = null
    if (timeout.current) clearTimeout(timeout.current)
    if (previewTimeout.current) clearTimeout(previewTimeout.current)
    requestId.current++
    setRunning(false)
    setResult(null)
    setAssessment(null)
    setShowHint(false)
    setPreviewLoading(false)
    setPreview(null)
    setPreviewTable(null)
    setQuery(taskId === null ? '' : savedQuery(taskId))
  }, [taskId])

  useEffect(() => () => {
    worker.current?.terminate()
    previewWorker.current?.terminate()
    if (timeout.current) clearTimeout(timeout.current)
    if (previewTimeout.current) clearTimeout(previewTimeout.current)
  }, [])

  function openTask(id: number | null) {
    window.location.hash = id === null ? 'tasks' : `task/${id}`
    setTaskId(id)
  }

  function changeQuery(value: string) {
    if (value === query) return
    setQuery(value)
    setResult(null)
    setAssessment(null)
    if (taskId !== null) localStorage.setItem(`sql-trainer:query:${taskId}`, value)
  }

  function runQuery(check: boolean) {
    if (!task || !query.trim()) return
    if (timeout.current) clearTimeout(timeout.current)
    worker.current?.terminate()
    const nextWorker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' })
    worker.current = nextWorker
    const id = ++requestId.current
    setRunning(true)
    setResult(null)
    setAssessment(null)
    nextWorker.onmessage = (event: MessageEvent<QueryResult>) => {
      if (event.data.id !== id || worker.current !== nextWorker) return
      if (timeout.current) clearTimeout(timeout.current)
      setResult(event.data)
      if (check && !event.data.error) setAssessment(event.data.correct ? 'correct' : 'incorrect')
      setRunning(false)
      nextWorker.terminate()
      worker.current = null
    }
    nextWorker.onerror = () => {
      if (worker.current !== nextWorker) return
      if (timeout.current) clearTimeout(timeout.current)
      setResult({ id, columns: [], rows: [], error: 'Не удалось запустить базу данных.' })
      setRunning(false)
      nextWorker.terminate()
      worker.current = null
    }
    nextWorker.postMessage({ id, sql: query, referenceSql: check ? task.referenceSql : undefined, orderMatters: task.orderMatters })
    timeout.current = setTimeout(() => {
      if (worker.current !== nextWorker) return
      nextWorker.terminate()
      worker.current = null
      setRunning(false)
      setResult({ id, columns: [], rows: [], error: 'Запрос выполнялся слишком долго. Попробуйте упростить его.' })
    }, 5000)
  }

  function showTableRows(name: string) {
    if (!Object.hasOwn(tableColumns, name)) return
    previewWorker.current?.terminate()
    if (previewTimeout.current) clearTimeout(previewTimeout.current)
    const nextWorker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' })
    previewWorker.current = nextWorker
    const id = ++requestId.current
    setPreviewTable(name)
    setPreview(null)
    setPreviewLoading(true)
    nextWorker.onmessage = (event: MessageEvent<QueryResult>) => {
      if (event.data.id !== id || previewWorker.current !== nextWorker) return
      if (previewTimeout.current) clearTimeout(previewTimeout.current)
      setPreview(event.data)
      setPreviewLoading(false)
      nextWorker.terminate()
      previewWorker.current = null
    }
    nextWorker.onerror = () => {
      if (previewWorker.current !== nextWorker) return
      if (previewTimeout.current) clearTimeout(previewTimeout.current)
      setPreview({ id, columns: [], rows: [], error: 'Не удалось открыть таблицу.' })
      setPreviewLoading(false)
      nextWorker.terminate()
      previewWorker.current = null
    }
    nextWorker.postMessage({ id, sql: `SELECT * FROM "${name}" ORDER BY rowid LIMIT 8` })
    previewTimeout.current = setTimeout(() => {
      if (previewWorker.current !== nextWorker) return
      nextWorker.terminate()
      previewWorker.current = null
      setPreviewLoading(false)
      setPreview({ id, columns: [], rows: [], error: 'Таблица открывалась слишком долго.' })
    }, 5000)
  }

  function hideTableRows() {
    previewWorker.current?.terminate()
    previewWorker.current = null
    if (previewTimeout.current) clearTimeout(previewTimeout.current)
    setPreviewTable(null)
    setPreview(null)
    setPreviewLoading(false)
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => openTask(null)}>SQL / АУДИТ</button>
        <span>{task ? `Задание ${task.id} / ${plannedTaskCount}` : 'Все задания'}</span>
        <span className="topbar-note">Учебная база · SQLite</span>
      </header>

      {task ? (
        <main className="workspace">
          <aside key={`task:${task.id}`} className="panel task-panel" aria-label="Условие задания">
            <span className="eyebrow">ЗАДАНИЕ {task.id} / {plannedTaskCount}</span>
            <h1>{task.title}</h1>
            <p>{task.description}</p>
            <h2>Поля результата</h2>
            <ul className="field-list">{task.expectedColumns.map((column) => <li key={column}><code>{column}</code></li>)}</ul>
            <h2>Сортировка</h2>
            <p>{task.sortRule}</p>
            <p className="task-skill">{task.skill}</p>
            <div className="hint-block">
              <button className="secondary" onClick={() => setShowHint((visible) => !visible)}>{showHint ? 'Скрыть подсказку' : 'Показать подсказку'}</button>
              {showHint && <p>{task.hint}</p>}
            </div>
            <div className="task-navigation">
              <button className="secondary" onClick={() => openTask(null)}>Все задания</button>
              <div className="navigation-row">
                <button className="secondary" disabled={task.id === 1} onClick={() => openTask(task.id - 1)}>← Назад</button>
                <button className="secondary" disabled={task.id === tasks.length} onClick={() => openTask(task.id + 1)}>Далее →</button>
              </div>
            </div>
          </aside>

          <section className="panel editor-panel" aria-label="Редактор SQL">
            <div className="panel-heading"><h2>SQL-редактор</h2><span>SQLite · учебная база</span></div>
            <CodeMirror key={task.id} value={query} height="290px" extensions={sqlExtensions} onChange={changeQuery} />
            <p className="editor-note">Каждый запуск использует исходные данные. Изменения в запросе сохраняются для этого задания.</p>
            <div className="actions">
              <button onClick={() => runQuery(false)} disabled={running || !query.trim()}>{running ? 'Выполняется…' : '▶ Выполнить'}</button>
              <button className="secondary" onClick={() => runQuery(true)} disabled={running || !query.trim()}>✓ Проверить</button>
              <button className="secondary" onClick={() => changeQuery(task.starterSql)}>Сбросить запрос</button>
            </div>
            <section className="result" aria-live="polite">
              <h2>Результат запроса</h2>
              {assessment === 'correct' && <p className="feedback correct" role="status">Верно! Результат совпал с ожидаемым.</p>}
              {assessment === 'incorrect' && <p className="feedback incorrect" role="status">Результат не совпал. Проверьте строки, повторы и сортировку; при необходимости откройте подсказку.</p>}
              {!result && <p className="muted">Запустите запрос, чтобы увидеть строки.</p>}
              {result?.error && <p role="alert" className="error">{result.error}</p>}
              {result && !result.error && result.columns.length === 0 && <p>Запрос не вернул таблицу.</p>}
              {result && !result.error && result.columns.length > 0 && (
                <div className="table-wrap"><table><thead><tr>{result.columns.map((column, index) => <th key={index}>{column}</th>)}</tr></thead>
                  <tbody>{result.rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}>{value === null ? 'NULL' : String(value)}</td>)}</tr>)}</tbody></table>
                  {result.rows.length === 0 && <p className="muted empty-result">Строк не найдено.</p>}</div>
              )}
            </section>
          </section>

          <aside key={`tables:${task.id}`} className="panel tables-panel" aria-label="Доступные таблицы">
            <h2>Доступные таблицы</h2>
            <p className="muted">Основные для этого задания: {task.availableTables.join(', ')}.</p>
            <div className="tables-list">{Object.entries(tableColumns).map(([name, columns]) => (
              <details key={`${task.id}:${name}`} open={task.availableTables.includes(name)}>
                <summary>{name}</summary>
                <ul>{columns.map((column) => <li key={column}><code>{column}</code></li>)}</ul>
                <button className="table-preview-button" onClick={() => showTableRows(name)}>Посмотреть строки →</button>
              </details>
            ))}</div>
            {previewTable && <section className="preview" aria-label={`Просмотр таблицы ${previewTable}`}>
              <div className="preview-heading"><h3>{previewTable} · строки</h3><button onClick={hideTableRows} aria-label="Скрыть строки">×</button></div>
              <p className="muted">Первые 8 строк из исходной базы.</p>
              {previewLoading && <p>Загрузка…</p>}
              {preview?.error && <p role="alert" className="error">{preview.error}</p>}
              {preview && !preview.error && <div className="table-wrap preview-table"><table><thead><tr>{preview.columns.map((column, index) => <th key={index}>{column}</th>)}</tr></thead>
                <tbody>{preview.rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}>{value === null ? 'NULL' : String(value)}</td>)}</tr>)}</tbody></table>
                {preview.rows.length === 0 && <p className="muted empty-result">В таблице пока нет строк.</p>}</div>}
            </section>}
          </aside>
        </main>
      ) : (
        <main className="catalog">
          <div className="catalog-heading"><span className="eyebrow">ПРАКТИКА SQL</span><h1>Задания для ИТ-аудита</h1><p>Выберите задание. Начните с фильтрации строк и постепенно переходите к соединениям и группировке.</p></div>
          <div className="task-grid">{tasks.map((item) => (
            <button className="task-card" key={item.id} onClick={() => openTask(item.id)}>
              <span className="task-number">{String(item.id).padStart(2, '0')}</span>
              <strong>{item.title}</strong>
              <small>{item.skill}</small>
              <span className="card-arrow">Открыть →</span>
            </button>
          ))}</div>
          <p className="muted">Следующие задания будут добавлены в последующих итерациях.</p>
        </main>
      )}
    </div>
  )
}

export default App
