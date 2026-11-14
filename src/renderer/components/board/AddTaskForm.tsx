import React, { useState } from 'react'
import { flushSync } from 'react-dom'
import { Flex, Box, Button } from '@chakra-ui/react'
import { Plus } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { isStatus } from '../../state/drop'
import { newTask } from '../../../shared/task-rules.mjs'
import { colors as c } from '../../theme'

export default function AddTaskForm({ columnId }: { columnId: string }) {
  const { state, dispatch } = useApp()
  const [title, setTitle] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    // Same defaults as a task the MCP server adds: the bottom of its status column.
    // Added from a tag column it carries that tag and goes to the bottom of that column too (the reducer).
    const task = newTask({ title: title.trim(), ...(isStatus(columnId) ? { status: columnId } : { tags: [columnId] }) }, state.tasks)
    flushSync(() => dispatch({ type: 'ADD_TASK', task })) // draw the card now, so it can be scrolled to
    setTitle('')
    // Not there when the active filters hide the new task.
    const card = document.querySelector(`[data-column="${columnId}"] [data-task-id="${task.id}"]`)
    card?.scrollIntoView({ block: 'nearest' })
    // The global reduced-motion rule covers CSS animations only, so this one asks for itself.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    card?.animate({ boxShadow: [`0 0 0 2px ${c.accent}`, '0 0 0 2px transparent'] }, { duration: 1200, easing: 'ease-in' })
  }

  return (
    <Flex
      align="center" gap="6px" pl="10px" pr="6px" h="34px" borderRadius="8px"
      color={c.textMuted} border="1px solid transparent" transition="background-color 0.15s ease, border-color 0.15s ease"
      _hover={{ bg: c.card }}
      _focusWithin={{ bg: c.card, borderColor: c.accent, color: c.textSecondary }}
    >
      <Plus size={14} />
      <Box
        as="input" flex="1" minW={0} h="100%" bg="transparent" border="none" outline="none"
        fontFamily="body" fontSize="13px" color={c.text}
        aria-label="Add a task" placeholder="Add a task"
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSubmit()}
      />
      {title.trim() && <Button size="xs" variant="primary" flexShrink={0} onClick={handleSubmit}>Add</Button>}
    </Flex>
  )
}
