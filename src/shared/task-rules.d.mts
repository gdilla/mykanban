// Types for task-rules.mjs, so the TypeScript renderer can import it.
type Status = 'todo' | 'doing' | 'done'

interface Movable {
  status: Status
  startedAt: string | null
  completedAt: string | null
  timeSpent: number
  sortOrder: number
}

export function applyStatusChange<T extends Movable>(task: T, status: Status, tasks: readonly Movable[], now?: number): T

export function newTask(
  fields: { title: string; description?: string; status?: Status; dueDate?: string; tags?: string[] },
  tasks: readonly Movable[],
  now?: number,
): Movable & {
  id: string
  title: string
  description: string
  dueDate: string
  tags: string[]
  attachments: never[]
  createdAt: string
  tagSortOrders: Record<string, number>
}
