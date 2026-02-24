import React, { memo, useState, useCallback } from 'react'
import { Card, CardBody, Flex, Box, IconButton, Text, Badge } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'
import TaskTitle from './TaskTitle'
import TaskBadges from './TaskBadges'
import TaskTags from './TaskTags'

interface TaskCardProps {
  task: Task
}

function TaskCardInner({ task }: TaskCardProps) {
  const { state, dispatch } = useApp()
  const [isHovered, setIsHovered] = useState(false)
  const isFocused = state.focusedTaskId === task.id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  let clickTimer: ReturnType<typeof setTimeout> | null = null

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
      return
    }
    clickTimer = setTimeout(() => {
      clickTimer = null
      dispatch({ type: 'SET_EDITING_TASK', id: task.id })
    }, 250)
  }, [task.id, dispatch])

  const handleDoubleClick = useCallback(() => {
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
    }
  }, [])

  const handleQuickMove = (status: Task['status']) => {
    dispatch({ type: 'MOVE_TASK', id: task.id, status })
  }

  const handleDelete = () => {
    if (confirm(`Delete "${task.title}"?`)) {
      dispatch({ type: 'DELETE_TASK', id: task.id })
    }
  }

  const rotation = task.id.charCodeAt(0) % 2 === 0 ? '0.5deg' : '-0.5deg'

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      cursor="grab"
      transform={`rotate(${rotation})`}
      outline={isFocused ? '3px solid' : 'none'}
      outlineColor="brand.doing"
      outlineOffset="2px"
      size="sm"
    >
      <CardBody p={3}>
        <TaskTitle task={task} onDoubleClick={handleDoubleClick} />
        <TaskTags task={task} />
        <TaskBadges task={task} />

        {/* Quick action buttons on hover */}
        {isHovered && (
          <Flex
            position="absolute"
            top={1}
            right={1}
            gap={1}
          >
            {task.status !== 'todo' && (
              <IconButton
                aria-label="Move to todo"
                size="xs"
                variant="ghost"
                fontSize="10px"
                onClick={(e) => { e.stopPropagation(); handleQuickMove('todo') }}
                icon={<Text>📋</Text>}
              />
            )}
            {task.status !== 'doing' && (
              <IconButton
                aria-label="Move to in progress"
                size="xs"
                variant="ghost"
                fontSize="10px"
                onClick={(e) => { e.stopPropagation(); handleQuickMove('doing') }}
                icon={<Text>🔄</Text>}
              />
            )}
            {task.status !== 'done' && (
              <IconButton
                aria-label="Move to done"
                size="xs"
                variant="ghost"
                fontSize="10px"
                onClick={(e) => { e.stopPropagation(); handleQuickMove('done') }}
                icon={<Text>✅</Text>}
              />
            )}
            <IconButton
              aria-label="Delete task"
              size="xs"
              variant="ghost"
              fontSize="10px"
              onClick={(e) => { e.stopPropagation(); handleDelete() }}
              icon={<Text>🗑</Text>}
            />
          </Flex>
        )}
      </CardBody>
    </Card>
  )
}

const TaskCard = memo(TaskCardInner)
export default TaskCard
