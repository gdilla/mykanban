import React from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Task } from '../../state/types'
import { colors as c } from '../../theme'
import { getContrastColor } from '../../utils/color'
import TaskCard from '../task/TaskCard'
import AddTaskForm from './AddTaskForm'

const STATUS_COLORS: Record<string, string> = {
  todo: c.todo,
  doing: c.doing,
  done: c.done,
}

interface ColumnProps {
  columnId: string
  title: string
  color?: string
  tasks: Task[]
  showAddForm?: boolean
}

export default function Column({ columnId, title, color, tasks, showAddForm }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: `column-${columnId}` })
  const accentColor = color || STATUS_COLORS[columnId] || c.textMuted

  return (
    <Box flex="1" minW="300px" display="flex" flexDir="column" minH="calc(100vh - 280px)">
      {/* Column header */}
      <Flex
        justify="space-between" align="center" mb={4} p="14px 18px"
        bg={c.surface} border={`1px solid ${c.borderStrong}`} borderRadius="10px"
        borderLeft={`4px solid ${accentColor}`}
      >
        <Text fontFamily="heading" fontWeight={700} fontSize="0.9rem" textTransform="uppercase" letterSpacing="0.08em" color={c.text}>
          {title}
        </Text>
        <Text
          fontFamily="heading" fontWeight={700} fontSize="0.75rem"
          bg={accentColor} color={getContrastColor(accentColor)}
          px={2.5} py="3px" borderRadius="4px"
        >
          {tasks.length}
        </Text>
      </Flex>

      {/* Task list */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <Box ref={setNodeRef} flex="1" minH="80px" maxH="calc(100vh - 360px)" overflowY="auto"
          display="flex" flexDir="column" gap={3} px={1} pb="60px">
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
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </Box>
      </SortableContext>

      {showAddForm && <AddTaskForm columnId={columnId} />}
    </Box>
  )
}
