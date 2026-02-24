import React from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Task } from '../../state/types'
import { colors as c } from '../../theme'
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
  const borderColor = color || STATUS_COLORS[columnId] || c.textMuted

  return (
    <Box
      className={`column-status-${columnId}`}
      flex="1"
      minW="300px"
      display="flex"
      flexDir="column"
      minH="calc(100vh - 300px)"
    >
      <Flex
        justify="space-between"
        align="center"
        mb={5}
        p="16px 20px"
        bg={c.surface}
        border={`2px solid ${c.borderStrong}`}
        boxShadow={`4px 4px 0 ${c.shadow}`}
        borderLeft={`6px solid ${borderColor}`}
      >
        <Text
          fontFamily="heading"
          fontWeight={700}
          fontSize="1rem"
          textTransform="uppercase"
          letterSpacing="0.1em"
          color={c.text}
        >
          {title}
        </Text>
        <Text
          fontFamily="heading"
          fontWeight={700}
          bg={borderColor}
          color={borderColor === c.doing ? '#1a1a2e' : '#fff'}
          px={3}
          py="4px"
          fontSize="0.85rem"
        >
          {tasks.length}
        </Text>
      </Flex>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <Box
          ref={setNodeRef}
          flex="1"
          minH="100px"
          maxH="calc(100vh - 380px)"
          overflowY="auto"
          display="flex"
          flexDir="column"
          gap={4}
          p={2}
          pb="80px"
        >
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Box>
      </SortableContext>

      {showAddForm && <AddTaskForm columnId={columnId} />}
    </Box>
  )
}
