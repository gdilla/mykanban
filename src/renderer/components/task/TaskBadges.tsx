import React from 'react'
import { Flex, Badge } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'

function formatAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime()
  const days = Math.floor(ms / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1d'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  return `${Math.floor(days / 30)}mo`
}

function formatDue(dueDate: string): { label: string; isOverdue: boolean; isSoon: boolean } {
  const now = new Date()
  const due = new Date(dueDate + 'T23:59:59')
  const diff = due.getTime() - now.getTime()
  const days = Math.ceil(diff / 86400000)

  if (days < 0) return { label: `${Math.abs(days)}d overdue`, isOverdue: true, isSoon: false }
  if (days === 0) return { label: 'today', isOverdue: false, isSoon: true }
  if (days === 1) return { label: 'tomorrow', isOverdue: false, isSoon: true }
  if (days <= 3) return { label: `${days}d`, isOverdue: false, isSoon: true }
  return { label: dueDate, isOverdue: false, isSoon: false }
}

function formatTime(ms: number): string {
  if (!ms || ms < 0) return '< 1m'
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

interface TaskBadgesProps {
  task: Task
}

export default function TaskBadges({ task }: TaskBadgesProps) {
  const { state } = useApp()
  const isTimerActive = state.activeTimerTaskId === task.id

  const age = formatAge(task.createdAt)
  const due = task.dueDate ? formatDue(task.dueDate) : null
  const hasTime = task.timeSpent > 0

  return (
    <Flex gap={1} flexWrap="wrap" mt={1}>
      {task.status !== 'done' && (
        <Badge
          variant="subtle"
          colorScheme="gray"
          fontSize="0.6rem"
        >
          {age}
        </Badge>
      )}

      {due && task.status !== 'done' && (
        <Badge
          bg={due.isOverdue ? 'brand.accent' : due.isSoon ? 'brand.warning' : 'transparent'}
          color={due.isOverdue || due.isSoon ? 'white' : 'brand.textSecondary'}
          border="1px solid"
          borderColor={due.isOverdue ? 'brand.accent' : due.isSoon ? 'brand.warning' : 'brand.border'}
          fontSize="0.6rem"
          cursor="pointer"
        >
          📅 {due.label}
        </Badge>
      )}

      {hasTime && (
        <Badge
          variant="subtle"
          colorScheme="blue"
          fontSize="0.6rem"
        >
          ⏱ {formatTime(task.timeSpent)}
        </Badge>
      )}

      {isTimerActive && (
        <Badge
          bg="brand.success"
          color="white"
          fontSize="0.6rem"
          animation="pulse 2s infinite"
        >
          ● tracking
        </Badge>
      )}

      {task.attachments.length > 0 && (
        <Badge
          variant="subtle"
          colorScheme="gray"
          fontSize="0.6rem"
        >
          📎 {task.attachments.length}
        </Badge>
      )}
    </Flex>
  )
}
