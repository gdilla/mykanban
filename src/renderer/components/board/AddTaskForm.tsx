import React, { useState } from 'react'
import { Flex, Input, Button } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { Task } from '../../state/types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
}

interface AddTaskFormProps {
  columnId: string
}

export default function AddTaskForm({ columnId }: AddTaskFormProps) {
  const { state, dispatch } = useApp()
  const [title, setTitle] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return

    const now = new Date().toISOString()
    const isStatus = ['todo', 'doing', 'done'].includes(columnId)

    const task: Task = {
      id: generateId(),
      title: title.trim(),
      description: '',
      status: isStatus ? (columnId as Task['status']) : 'todo',
      dueDate: '',
      tags: isStatus ? [] : [columnId],
      attachments: [],
      createdAt: now,
      startedAt: columnId === 'doing' ? now : null,
      completedAt: columnId === 'done' ? now : null,
      timeSpent: 0,
      sortOrder: state.tasks.length,
      tagSortOrders: {},
    }

    dispatch({ type: 'ADD_TASK', task })
    setTitle('')
  }

  return (
    <Flex mt={3} gap={2}>
      <Input
        size="sm"
        placeholder="What needs to be done?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        bg="brand.bg"
        border="2px solid"
        borderColor="brand.shadow"
        borderRadius="0"
        fontFamily="body"
        _focus={{ boxShadow: '3px 3px 0 var(--chakra-colors-brand-shadow)' }}
      />
      <Button
        size="sm"
        variant="brutalist"
        onClick={handleSubmit}
        flexShrink={0}
      >
        Add
      </Button>
    </Flex>
  )
}
