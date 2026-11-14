import React, { memo, useCallback } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import TaskTitle from './TaskTitle'
import TaskBadges from './TaskBadges'
import TaskTags from './TaskTags'

const STATUS_COLOR: Record<string, string> = {
  todo: '#7c8aff',
  doing: '#f59e0b',
  done: '#10b981',
}

function TaskCardInner({ task }: { task: Task }) {
  const { state, dispatch } = useApp()
  const isFocused = state.focusedTaskId === task.id
  const isDone = task.status === 'done'

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'SET_EDITING_TASK', id: task.id })
  }, [task.id, dispatch])

  const handleQuickMove = (e: React.MouseEvent, status: Task['status']) => {
    e.stopPropagation()
    dispatch({ type: 'MOVE_TASK', id: task.id, status })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'DELETE_TASK', id: task.id }) // undoable: see the toast in useKeyboardNav
  }

  const statusColor = STATUS_COLOR[task.status] || c.textMuted

  return (
    <>
      <Box
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`task-card ${isFocused ? 'focused' : ''} ${isDone ? 'done' : ''}`}
        bg={c.card}
        border={`1px solid ${c.border}`}
        borderRadius="6px"
        cursor="grab"
        boxShadow="var(--c-card-shadow)"
        position="relative"
        onClick={handleClick}
        _hover={{ bg: c.cardHover }}
      >
        {/* Quick actions */}
        <Flex
          className="task-quick-actions"
          gap="1px"
          position="absolute"
          top="6px" right="6px"
          zIndex={10}
          bg={c.surface}
          border={`1px solid ${c.borderStrong}`}
          borderRadius="6px"
          p="2px"
          boxShadow="0 2px 8px rgba(0,0,0,0.15)"
        >
          {task.status === 'doing' && (
            <IconBtn icon={<ArrowLeft size={12} />} title="Back to To Do" hoverColor={c.text} hoverBorder={c.borderStrong} onClick={(e) => handleQuickMove(e, 'todo')} />
          )}
          {task.status !== 'done' && (
            <IconBtn icon={<Check size={12} />} title="Done" hoverColor="#10b981" hoverBorder="#6ee7b7" onClick={(e) => handleQuickMove(e, 'done')} />
          )}
          <IconBtn icon={<X size={12} />} title="Delete" hoverColor="#ef4444" hoverBorder="#fca5a5" onClick={handleDelete} />
        </Flex>

        <Box px="12px" py="10px">
          {/* Title row with status indicator */}
          <Flex align="flex-start" gap="8px">
            <Box
              w="16px" h="16px" minW="16px"
              borderRadius="4px"
              border={`1.5px solid ${statusColor}`}
              bg={isDone ? statusColor : 'transparent'}
              mt="2px"
              display="flex" alignItems="center" justifyContent="center"
            >
              {isDone && <Check size={10} color={c.card} strokeWidth={3} />}
            </Box>
            <Box flex="1" minW={0}>
              <TaskTitle task={task} />
            </Box>
          </Flex>

          {/* Description */}
          {task.description && !isDone && (
            <Box
              fontSize="0.76rem" lineHeight="1.5" color={c.textSecondary}
              mt="4px" pl="24px" noOfLines={2} fontFamily="body"
            >
              {task.description}
            </Box>
          )}

          {/* Meta row: tags + badges */}
          {(task.tags.length > 0 || task.dueDate || task.timeSpent > 0 || task.attachments.length > 0) && (
            <Flex flexWrap="wrap" align="center" gap="6px" mt="8px" pl="24px">
              <TaskTags task={task} />
              <TaskBadges task={task} />
            </Flex>
          )}
        </Box>
      </Box>
    </>
  )
}

function IconBtn({ icon, title, hoverColor, hoverBorder, onClick }: {
  icon: React.ReactNode; title: string; hoverColor: string; hoverBorder: string; onClick: (e: React.MouseEvent) => void
}) {
  return (
    <Box
      as="button"
      p="5px"
      bg="transparent"
      border="none"
      borderRadius="4px"
      color={c.textSecondary}
      cursor="pointer"
      transition="all 0.1s ease"
      title={title}
      _hover={{ color: hoverColor, bg: c.card }}
      onClick={onClick}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {icon}
    </Box>
  )
}

const TaskCard = memo(TaskCardInner)
export default TaskCard
