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
