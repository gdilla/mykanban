import React, { useState } from 'react'
import { Flex, Box, Input, Button } from '@chakra-ui/react'
import { Plus } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { Task } from '../../state/types'
import { colors as c } from '../../theme'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
}

export default function AddTaskForm({ columnId }: { columnId: string }) {
  const { state, dispatch } = useApp()
  const [title, setTitle] = useState('')
  const [isFocused, setIsFocused] = useState(false)

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
    <Box mt={2}>
      <Flex
        align="center" gap={2}
        borderRadius="8px"
        border={`1px solid ${isFocused ? c.accentAlpha40 : c.border}`}
        bg={isFocused ? c.card : c.cardAlpha80}
        transition="all 0.15s ease"
        boxShadow={isFocused ? `0 0 0 3px ${c.accentAlpha10}` : undefined}
        _hover={!isFocused ? { bg: c.card, borderColor: c.borderStrong } : undefined}
      >
        <Box pl={3} color={c.textMuted} display="flex" alignItems="center">
          <Plus size={14} />
        </Box>
        <Input
          size="sm"
          variant="unstyled"
          placeholder="Add a task..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          py={2}
          pr={2}
          fontSize="0.82rem"
          fontFamily="body"
          color={c.text}
          _placeholder={{ color: c.textMutedAlpha60 }}
        />
        {title.trim() && (
          <Button
            size="xs"
            mr="6px"
            px={3}
            fontSize="0.7rem"
            fontWeight={500}
            bg={c.primaryBg}
            color={c.primaryText}
            borderRadius="6px"
            flexShrink={0}
            _hover={{ bg: c.primaryHover }}
            onClick={handleSubmit}
          >
            Add
          </Button>
        )}
      </Flex>
    </Box>
  )
}
