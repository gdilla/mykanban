import React from 'react'
import { useApp } from '../../state/AppContext'
import { getTasksByStatus } from '../../state/selectors'
import { colors as c } from '../../theme'
import Column from './Column'

const STATUSES = [
  { id: 'todo', label: 'To Do', color: c.todo },
  { id: 'doing', label: 'In Progress', color: c.doing },
  { id: 'done', label: 'Done', color: c.done },
] as const

export default function StatusView() {
  const { state } = useApp()

  return (
    <>
      {STATUSES.map(status => {
        const tasks = getTasksByStatus(state, status.id)
        return (
          <Column
            key={status.id}
            columnId={status.id}
            title={status.label}
            color={status.color}
            tasks={tasks}
            showAddForm
          />
        )
      })}
    </>
  )
}
