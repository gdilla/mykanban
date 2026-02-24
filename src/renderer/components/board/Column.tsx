import React from 'react'
import { Box, Flex, Heading, Badge } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Task } from '../../state/types'
import TaskCard from '../task/TaskCard'
import AddTaskForm from './AddTaskForm'

interface ColumnProps {
  columnId: string
  title: string
  color: string
  tasks: Task[]
  showAddForm?: boolean
}

export default function Column({ columnId, title, color, tasks, showAddForm }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: `column-${columnId}` })

  return (
    <Box
      className="column-area"
      flex="1"
      minW="300px"
      maxW="400px"
    >
      <Flex align="center" gap={2} mb={3}>
        <Heading
          size="sm"
          fontFamily="heading"
          textTransform="uppercase"
          letterSpacing="0.1em"
        >
          {title}
        </Heading>
        <Badge
          bg={color}
          color="white"
          px={2}
          py={0.5}
          fontSize="0.7rem"
          border="2px solid"
          borderColor="brand.shadow"
        >
          {tasks.length}
        </Badge>
      </Flex>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <Box
          ref={setNodeRef}
          minH="100px"
          display="flex"
          flexDir="column"
          gap={2}
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
