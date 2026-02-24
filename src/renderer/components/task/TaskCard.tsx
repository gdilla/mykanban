import React, { memo, useRef, useCallback } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import TaskTitle from './TaskTitle'
import TaskBadges from './TaskBadges'
import TaskTags from './TaskTags'

interface TaskCardProps {
  task: Task
}

function TaskCardInner({ task }: TaskCardProps) {
  const { state, dispatch } = useApp()
  const isFocused = state.focusedTaskId === task.id
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      return
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      dispatch({ type: 'SET_EDITING_TASK', id: task.id })
    }, 250)
  }, [task.id, dispatch])

  const handleDoubleClick = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }
  }, [])

  const handleQuickMove = (e: React.MouseEvent, status: Task['status']) => {
    e.stopPropagation()
    dispatch({ type: 'MOVE_TASK', id: task.id, status })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete "${task.title}"?`)) {
      dispatch({ type: 'DELETE_TASK', id: task.id })
    }
  }

  // Due status for card glow
  let shadowColor = c.shadow
  if (task.dueDate && task.status !== 'done') {
    const diff = new Date(task.dueDate + 'T23:59:59').getTime() - Date.now()
    const days = Math.ceil(diff / 86400000)
    if (days < 0) shadowColor = c.todo
    else if (days <= 3) shadowColor = c.doing
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isFocused ? 'focused' : ''}`}
      bg={c.card}
      borderRadius="2px"
      p="16px 18px"
      cursor="grab"
      boxShadow={`4px 4px 0 ${shadowColor}`}
      position="relative"
      onClick={handleClick}
    >
      {/* Quick action buttons — readable labels, high contrast */}
      <Flex
        className="task-quick-actions"
        position="absolute"
        top="8px"
        right="8px"
        gap="4px"
        zIndex={2}
      >
        {task.status !== 'todo' && (
          <ActionBtn
            label="TODO"
            color={c.todo}
            onClick={(e) => handleQuickMove(e, 'todo')}
          />
        )}
        {task.status !== 'doing' && (
          <ActionBtn
            label="WIP"
            color={c.doing}
            onClick={(e) => handleQuickMove(e, 'doing')}
          />
        )}
        {task.status !== 'done' && (
          <ActionBtn
            label="DONE"
            color={c.done}
            onClick={(e) => handleQuickMove(e, 'done')}
          />
        )}
        <ActionBtn
          label="DEL"
          color={c.danger}
          onClick={handleDelete}
        />
      </Flex>

      {/* Card content */}
      <Box position="relative" zIndex={1}>
        <TaskTitle task={task} onDoubleClick={handleDoubleClick} />

        {task.description && (
          <Text
            fontSize="0.8rem"
            lineHeight="1.4"
            color={c.textSecondary}
            mt={1.5}
            noOfLines={2}
            fontFamily="body"
          >
            {task.description}
          </Text>
        )}

        <TaskTags task={task} />

        <Box className="task-meta-bar">
          <TaskBadges task={task} />
        </Box>
      </Box>
    </Box>
  )
}

function ActionBtn({ label, color, onClick }: {
  label: string
  color: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <Box
      as="button"
      fontFamily="heading"
      fontSize="0.55rem"
      fontWeight={700}
      letterSpacing="0.05em"
      px="6px"
      py="3px"
      bg={color}
      color="#fff"
      border={`1px solid ${color}`}
      cursor="pointer"
      transition="all 0.1s ease"
      _hover={{ transform: 'scale(1.1)', boxShadow: `0 0 8px ${color}66` }}
      onClick={onClick}
    >
      {label}
    </Box>
  )
}

const TaskCard = memo(TaskCardInner)
export default TaskCard
