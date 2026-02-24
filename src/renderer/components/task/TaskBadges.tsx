import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

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
  if (days <= 3) return { label: `in ${days}d`, isOverdue: false, isSoon: true }
  return { label: dueDate, isOverdue: false, isSoon: false }
}

function formatTime(ms: number): string {
  if (!ms || ms < 0) return '< 1m'
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

const badgeBase = {
  fontFamily: `'JetBrains Mono', monospace`,
  fontSize: '0.7rem',
  px: '8px',
  py: '4px',
}

export default function TaskBadges({ task }: { task: Task }) {
  const { state } = useApp()
  const isTimerActive = state.activeTimerTaskId === task.id

  const age = formatAge(task.createdAt)
  const due = task.dueDate ? formatDue(task.dueDate) : null

  return (
    <Flex gap={2} flexWrap="wrap">
      {task.status !== 'done' && (
        <Box {...badgeBase} bg={c.bg} border={`1px solid ${c.border}`} color={c.textSecondary}>
          {age}
        </Box>
      )}

      {due && task.status !== 'done' && (
        <Box
          {...badgeBase}
          bg={due.isOverdue ? c.todo : due.isSoon ? c.doing : c.bg}
          color={due.isOverdue ? '#fff' : due.isSoon ? '#1a1a2e' : c.textSecondary}
          border={`1px solid ${due.isOverdue ? c.todo : due.isSoon ? c.doing : c.border}`}
          cursor="pointer"
        >
          {due.label}
        </Box>
      )}

      {task.timeSpent > 0 && (
        <Box
          {...badgeBase}
          bg={c.doneSoft}
          border={`1px solid ${c.done}`}
          color={c.done}
        >
          {formatTime(task.timeSpent)}
        </Box>
      )}

      {isTimerActive && (
        <Box
          {...badgeBase}
          className="timer-badge"
          bg={c.done}
          border={`1px solid ${c.done}`}
          color="#fff"
        >
          tracking
        </Box>
      )}

      {task.attachments.length > 0 && (
        <Box {...badgeBase} bg={c.bg} border={`1px solid ${c.border}`} color={c.textSecondary}>
          {task.attachments.length} file{task.attachments.length > 1 ? 's' : ''}
        </Box>
      )}
    </Flex>
  )
}
