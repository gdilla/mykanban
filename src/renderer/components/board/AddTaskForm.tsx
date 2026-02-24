import React, { useState } from 'react'
import { Flex, Input, Box } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { Task } from '../../state/types'
import { colors as c } from '../../theme'

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
    <Flex mt={4} gap={2} px={2}>
      <Input
        size="sm"
        placeholder="What needs to be done?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        variant="brutalist"
      />
      <Box
        as="button"
        fontFamily="heading"
        fontWeight={700}
        fontSize="0.8rem"
        px={4}
        py={1}
        bg={c.accent}
        color="#fff"
        border={`2px solid ${c.borderStrong}`}
        cursor="pointer"
        textTransform="uppercase"
        letterSpacing="0.05em"
        flexShrink={0}
        transition="all 0.15s ease"
        _hover={{ transform: 'translate(-1px, -1px)', boxShadow: `2px 2px 0 ${c.shadow}` }}
        onClick={handleSubmit}
      >
        Add
      </Box>
    </Flex>
  )
}
