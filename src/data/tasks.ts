export type Task = {
  id: number
  title: string
  skill: string
  description: string
  availableTables: string[]
  starterSql: string
  hint: string
  expectedColumns: string[]
  sortRule: string
}

export const tasks: Task[] = [
  {
    id: 1,
    title: 'Активные учётные записи',
    skill: 'SELECT · WHERE',
    description: 'Выведите все активные учётные записи.',
    availableTables: ['accounts'],
    starterSql: 'SELECT id, login\nFROM accounts;',
    hint: 'Признак активности находится в accounts.is_active.',
    expectedColumns: ['id', 'login'],
    sortRule: 'По id по возрастанию.',
  },
  {
    id: 2,
    title: 'Уволенные сотрудники',
    skill: 'WHERE · ORDER BY',
    description: 'Выведите уволенных сотрудников.',
    availableTables: ['employees'],
    starterSql: 'SELECT id, full_name\nFROM employees;',
    hint: "Сравните status со значением 'terminated'.",
    expectedColumns: ['id', 'full_name'],
    sortRule: 'По full_name, затем по id, оба по возрастанию.',
  },
  {
    id: 3,
    title: 'Активы без владельца',
    skill: 'IS NULL · ORDER BY',
    description: 'Найдите активы, для которых не назначен владелец.',
    availableTables: ['assets'],
    starterSql: 'SELECT id, asset_tag\nFROM assets;',
    hint: 'Отсутствие владельца проверяется через IS NULL.',
    expectedColumns: ['id', 'asset_tag'],
    sortRule: 'По id по возрастанию.',
  },
  {
    id: 4,
    title: 'Учётные записи без сотрудника',
    skill: 'LEFT JOIN · IS NULL',
    description: 'Найдите учётные записи без соответствующей строки в employees. Учитывайте как employee_id = NULL, так и ссылку на несуществующего сотрудника.',
    availableTables: ['accounts', 'employees'],
    starterSql: 'SELECT a.id, a.login\nFROM accounts AS a;',
    hint: 'При соединении сохраните все строки из accounts.',
    expectedColumns: ['id', 'login'],
    sortRule: 'По id по возрастанию.',
  },
  {
    id: 5,
    title: 'Активный доступ уволенных сотрудников',
    skill: 'JOIN · WHERE',
    description: 'Найдите активные учётные записи уволенных сотрудников.',
    availableTables: ['employees', 'accounts'],
    starterSql: 'SELECT e.full_name, a.login\nFROM employees AS e\nJOIN accounts AS a ON a.employee_id = e.id;',
    hint: 'Одновременно проверьте статус сотрудника и активность записи.',
    expectedColumns: ['full_name', 'login'],
    sortRule: 'По имени сотрудника, затем по логину, по возрастанию.',
  },
  {
    id: 6,
    title: 'Активы уволенных сотрудников',
    skill: 'JOIN · WHERE',
    description: 'Найдите активы, владельцами которых всё ещё указаны уволенные сотрудники.',
    availableTables: ['assets', 'employees'],
    starterSql: 'SELECT a.asset_tag, e.full_name\nFROM assets AS a\nJOIN employees AS e ON e.id = a.owner_employee_id;',
    hint: 'Соедините актив с назначенным владельцем и проверьте его статус.',
    expectedColumns: ['asset_tag', 'full_name'],
    sortRule: 'По asset_tag по возрастанию.',
  },
]

export const tableColumns: Record<string, string[]> = {
  employees: ['id INTEGER', 'full_name TEXT', 'status TEXT'],
  systems: ['id INTEGER', 'name TEXT'],
  accounts: ['id INTEGER', 'employee_id INTEGER', 'system_id INTEGER', 'login TEXT', 'is_active INTEGER'],
  roles: ['id INTEGER', 'name TEXT', 'is_privileged INTEGER'],
  account_roles: ['account_id INTEGER', 'role_id INTEGER'],
  assets: ['id INTEGER', 'asset_tag TEXT', 'owner_employee_id INTEGER', 'system_id INTEGER'],
  journal_entries: ['id INTEGER', 'entry_date TEXT', 'amount INTEGER', 'created_by_account_id INTEGER'],
  approvals: ['id INTEGER', 'entry_id INTEGER', 'decision TEXT', 'approver_account_id INTEGER'],
}
