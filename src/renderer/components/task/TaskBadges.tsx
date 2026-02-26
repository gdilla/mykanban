import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Calendar, Clock, Paperclip } from 'lucide-react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

function formatDue(dueDate: string): { label: string; isOverdue: boolean; isSoon: boolean } {
  const diff = new Date(dueDate + 'T23:59:59').getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, isOverdue: true, isSoon: false }
  if (days === 0) return { label: 'today', isOverdue: false, isSoon: true }
  if (days === 1) return { label: 'tomorrow', isOverdue: false, isSoon: true }
  if (days <= 3) return { label: `in ${days}d`, isOverdue: false, isSoon: true }
  const d = new Date(dueDate)
  return {
    label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase(),
    isOverdue: false,
    isSoon: false,
  }
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

  return (
    <Flex gap="8px" flexWrap="wrap" align="center" ml="auto">
      {due && task.status !== 'done' && (
        due.isOverdue ? (
          <Box
            display="inline-flex" alignItems="center" gap="3px"
            fontFamily="body" fontSize="0.68rem" fontWeight={500}
            px="6px" py="2px" borderRadius="5px"
            bg="rgba(239,68,68,0.1)" color="#ef4444"
            border="1px solid rgba(239,68,68,0.2)"
          >
            <Calendar size={11} />
            {due.label}
          </Box>
        ) : (
          <Box display="inline-flex" alignItems="center" gap="3px" fontSize="0.68rem" color={c.textMuted}>
            <Calendar size={11} />
            {due.label}
          </Box>
        )
      )}

      {task.timeSpent > 0 && (
        <Box display="inline-flex" alignItems="center" gap="3px" fontSize="0.68rem" color={c.textMuted}>
          <Clock size={11} />
          {formatTime(task.timeSpent)}
        </Box>
      )}

      {isTimerActive && (
        <Box display="inline-flex" alignItems="center" gap="3px" fontSize="0.68rem" color={c.doing} className="timer-badge">
          <Clock size={11} />
          tracking
        </Box>
      )}

      {task.attachments.length > 0 && (
        <Box display="inline-flex" alignItems="center" gap="3px" fontSize="0.68rem" color={c.textMuted}>
          <Paperclip size={11} />
          {task.attachments.length}
        </Box>
      )}
    </Flex>
  )
}
