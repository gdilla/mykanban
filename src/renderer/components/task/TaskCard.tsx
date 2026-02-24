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

function TaskCardInner({ task }: { task: Task }) {
  const { state, dispatch } = useApp()
  const isFocused = state.focusedTaskId === task.id
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; return }
    clickTimerRef.current = setTimeout(() => { clickTimerRef.current = null; dispatch({ type: 'SET_EDITING_TASK', id: task.id }) }, 250)
  }, [task.id, dispatch])

  const handleDoubleClick = useCallback(() => {
    if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null }
  }, [])

  const handleQuickMove = (e: React.MouseEvent, status: Task['status']) => {
    e.stopPropagation()
    dispatch({ type: 'MOVE_TASK', id: task.id, status })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete "${task.title}"?`)) dispatch({ type: 'DELETE_TASK', id: task.id })
  }

  // Left accent bar color based on status or due
  let accentColor = c.border
  if (task.status === 'todo') accentColor = c.todo
  else if (task.status === 'doing') accentColor = c.doing
  else if (task.status === 'done') accentColor = c.done

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isFocused ? 'focused' : ''}`}
      bg={c.card}
      border={`1px solid ${c.borderStrong}`}
      borderLeft={`3px solid ${accentColor}`}
      borderRadius="8px"
      p="14px 16px"
      cursor="grab"
      boxShadow={`0 2px 8px rgba(0,0,0,0.3)`}
      position="relative"
      onClick={handleClick}
    >
      {/* Quick action buttons */}
      <Flex className="task-quick-actions" position="absolute" top="8px" right="8px" gap="3px" zIndex={2}>
        {task.status !== 'todo' && (
          <ActionBtn label="To Do" bg={c.todoSoft} color={c.todo} hoverBg={c.todo} onClick={(e) => handleQuickMove(e, 'todo')} />
        )}
        {task.status !== 'doing' && (
          <ActionBtn label="WIP" bg={c.doingSoft} color={c.doing} hoverBg={c.doing} onClick={(e) => handleQuickMove(e, 'doing')} />
        )}
        {task.status !== 'done' && (
          <ActionBtn label="Done" bg={c.doneSoft} color={c.done} hoverBg={c.done} onClick={(e) => handleQuickMove(e, 'done')} />
        )}
        <ActionBtn label="✕" bg="rgba(239,68,68,0.1)" color={c.danger} hoverBg={c.danger} onClick={handleDelete} />
      </Flex>

      <Box position="relative" zIndex={1}>
        <TaskTitle task={task} onDoubleClick={handleDoubleClick} />
        {task.description && (
          <Text fontSize="0.78rem" lineHeight="1.4" color={c.textSecondary} mt={1} noOfLines={2} fontFamily="body">
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

function ActionBtn({ label, bg, color, hoverBg, onClick }: {
  label: string; bg: string; color: string; hoverBg: string; onClick: (e: React.MouseEvent) => void
}) {
  return (
    <Box
      as="button"
      fontFamily="heading" fontSize="0.6rem" fontWeight={600}
      px="7px" py="3px" borderRadius="4px"
      bg={bg} color={color}
      cursor="pointer" transition="all 0.1s ease"
      _hover={{ bg: hoverBg, color: '#fff' }}
      onClick={onClick}
    >
      {label}
    </Box>
  )
}

const TaskCard = memo(TaskCardInner)
export default TaskCard
