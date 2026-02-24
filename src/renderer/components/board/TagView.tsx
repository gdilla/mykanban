import React from 'react'
import { useApp } from '../../state/AppContext'
import { getTasksByTag, getUntaggedTasks } from '../../state/selectors'
import Column from './Column'

export default function TagView() {
  const { state } = useApp()

  return (
    <>
      {state.tags.map(tag => {
        const tasks = getTasksByTag(state, tag.id)
        return (
          <Column
            key={tag.id}
            columnId={tag.id}
            title={tag.name}
            color={tag.color}
            tasks={tasks}
            showAddForm
          />
        )
      })}
      <Column
        columnId="__untagged__"
        title="Untagged"
        color="brand.textSecondary"
        tasks={getUntaggedTasks(state)}
      />
    </>
  )
}
