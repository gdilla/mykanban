import React, { useMemo } from 'react'
import { useAppState } from '../../state/AppContext'
import { UNTAGGED } from '../../state/drop'
import { focusedColumn } from '../../state/nav'
import { DONE_LIMIT, getBoardColumns, getTasksByStatus } from '../../state/selectors'
import { colors as c } from '../../theme'
import Column from './Column'

const STATUS_COLUMNS = [
  { id: 'todo', title: 'To do', color: c.todo, emptyText: 'Nothing to do. Add a task below.' },
  { id: 'doing', title: 'In progress', color: c.doing, emptyText: 'Nothing in progress. Start a task, or drag one here.' },
  { id: 'done', title: 'Done', color: c.done, emptyText: 'Nothing done yet.' },
]

// The columns of the current view. Each column gets stable props (its own task array, the tag list, and the
// focused id only if the focus is in it), so a keypress re-renders one or two columns, not the board.
export default function BoardColumns() {
  const state = useAppState()
  const { tags, activeFilters, currentView, showAllDone } = state

  const columns = getBoardColumns(state) // the same arrays until tasks, tags, filters or the view change
  const doneCount = useMemo(() => getTasksByStatus(state, 'done').length, [columns])
  const focusCol = focusedColumn(state, columns.map(column => column.map(t => t.id)))
  const filtered = activeFilters.tags.length > 0 || !!activeFilters.age

  const defs = currentView === 'status'
    ? STATUS_COLUMNS
    : [
      ...tags.map(tag => ({ id: tag.id, title: tag.name, color: tag.color, emptyText: 'No tasks with this tag yet.' })),
      { id: UNTAGGED, title: 'Untagged', color: c.textMuted, emptyText: 'Every task has a tag.' },
    ]

  return (
    <>
      {defs.map((def, i) => {
        const isDone = def.id === 'done' && currentView === 'status'
        return (
          <Column
            key={def.id}
            columnId={def.id}
            title={def.title}
            color={def.color}
            tasks={columns[i]}
            count={isDone ? doneCount : columns[i].length}
            expanded={isDone && showAllDone && doneCount > DONE_LIMIT}
            tags={tags}
            focusedTaskId={i === focusCol ? state.focusedTaskId : null}
            activeTimerTaskId={state.activeTimerTaskId}
            emptyText={filtered ? 'No tasks match the filters.' : def.emptyText}
            showAddForm={def.id !== UNTAGGED}
          />
        )
      })}
    </>
  )
}
