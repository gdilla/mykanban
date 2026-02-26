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
  const diff = new Date(dueDate + 'T23:59:59').getTime() - Date.now()
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

export default function TaskBadges({ task }: { task: Task }) {
  const { state } = useApp()
  const isTimerActive = state.activeTimerTaskId === task.id
  const due = task.dueDate ? formatDue(task.dueDate) : null

  const badge = (bg: string, color: string, text: string, className?: string) => (
    <Box fontFamily="mono" fontSize="0.68rem" px="7px" py="3px" borderRadius="4px"
      bg={bg} color={color} className={className}>
      {text}
    </Box>
  )

  return (
    <Flex gap={2} flexWrap="wrap">
      {task.status !== 'done' && badge(c.surface, c.textMuted, formatAge(task.createdAt))}
      {due && task.status !== 'done' && badge(
        due.isOverdue ? c.todoSoft : due.isSoon ? c.doingSoft : c.surface,
        due.isOverdue ? c.todo : due.isSoon ? c.doing : c.textMuted,
        due.label
      )}
      {task.timeSpent > 0 && badge(c.doneSoft, c.done, formatTime(task.timeSpent))}
      {isTimerActive && badge(c.doingSoft, c.doing, '● tracking', 'timer-badge')}
      {task.attachments.length > 0 && badge(c.surface, c.textMuted, `${task.attachments.length} file${task.attachments.length > 1 ? 's' : ''}`)}
    </Flex>
  )
}
