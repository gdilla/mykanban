import React, { useState } from 'react'
import { Flex, Input, Button } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { Task } from '../../state/types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
}

export default function AddTaskForm({ columnId }: { columnId: string }) {
  const { state, dispatch } = useApp()
  const [title, setTitle] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    const isStatus = ['todo', 'doing', 'done'].includes(columnId)
    dispatch({
      type: 'ADD_TASK',
      task: {
        id: generateId(), title: title.trim(), description: '',
        status: isStatus ? (columnId as Task['status']) : 'todo',
        dueDate: '', tags: isStatus ? [] : [columnId], attachments: [],
        createdAt: now, startedAt: columnId === 'doing' ? now : null,
        completedAt: columnId === 'done' ? now : null,
        timeSpent: 0, sortOrder: state.tasks.length, tagSortOrders: {},
      },
    })
    setTitle('')
  }

  return (
    <Flex mt={3} gap={2} px={1}>
      <Input size="sm" placeholder="What needs to be done?" value={title}
        onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        variant="brutalist" borderRadius="6px" />
      <Button size="sm" variant="brutalist" onClick={handleSubmit} flexShrink={0} borderRadius="6px">
        Add
      </Button>
    </Flex>
  )
}
