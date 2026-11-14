import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Calendar, Clock, Paperclip } from 'lucide-react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import { dueLabel } from '../../utils/date'

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
  const due = task.dueDate ? dueLabel(task.dueDate, new Date()) : null

  return (
    <Flex gap="8px" flexWrap="wrap" align="center" ml="auto">
      {due && task.status !== 'done' && (
        due.tone === 'overdue' ? (
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
          <Box
            display="inline-flex" alignItems="center" gap="3px" fontSize="0.68rem"
            color={due.tone === 'soon' ? c.doing : c.textMuted}
            fontWeight={due.tone === 'soon' ? 500 : undefined}
          >
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
