import React from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Task } from '../../state/types'
import { colors as c } from '../../theme'
import TaskCard from '../task/TaskCard'
import AddTaskForm from './AddTaskForm'

const STATUS_COLORS: Record<string, string> = {
  todo: '#3b82f6',
  doing: '#f59e0b',
  done: '#10b981',
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  doing: 'In Progress',
  done: 'Done',
}

interface ColumnProps {
  columnId: string
  title: string
  color?: string
  tasks: Task[]
  showAddForm?: boolean
}

export default function Column({ columnId, title, color, tasks, showAddForm }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: `column-${columnId}`, data: { columnId } })
  // A task can sit in several tag columns at once, so a card's drag id is unique per column (Board.tsx parses it).
  const sortableId = (task: Task) => `${columnId}:${task.id}`
  const accentColor = color || STATUS_COLORS[columnId] || c.textMuted
  const displayTitle = STATUS_LABELS[columnId] || title

  return (
    <Box ref={setNodeRef} flex="1" minW="300px" display="flex" flexDir="column" minH={0}>
      {/* Column header */}
      <Flex align="center" gap="8px" px="4px" pt="16px" pb="12px">
        <Box w="9px" h="9px" borderRadius="50%" bg={accentColor} />
        <Text fontFamily="heading" fontWeight={600} fontSize="0.85rem" color={c.text}>
          {displayTitle}
        </Text>
        <Text fontFamily="body" fontWeight={500} fontSize="0.8rem" color={c.textMuted}>
          {tasks.length}
        </Text>
      </Flex>

      {/* Task list */}
      <SortableContext id={columnId} items={tasks.map(sortableId)} strategy={verticalListSortingStrategy}>
        <Box flex="1" minH={0} overflowY="auto"
          display="flex" flexDir="column" gap="8px" pb="8px">
          {tasks.length === 0 ? (
            <Box
              border={`1px dashed ${c.border}`} borderRadius="8px"
              py={8} textAlign="center" color={c.textMuted}
              fontFamily="body" fontSize="0.85rem"
            >
              No tasks
            </Box>
          ) : (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} sortableId={sortableId(task)} />
            ))
          )}
        </Box>
      </SortableContext>

      {showAddForm && <Box flexShrink={0} mt="auto" pt="4px"><AddTaskForm columnId={columnId} /></Box>}
    </Box>
  )
}
