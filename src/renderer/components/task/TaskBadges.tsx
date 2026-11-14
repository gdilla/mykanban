import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Calendar, Clock, Paperclip } from 'lucide-react'
import { Task } from '../../state/types'
import { colors as c } from '../../theme'
import { dueLabel } from '../../utils/date'

function formatTime(ms: number): string {
  if (!ms || ms < 0) return '< 1m'
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

const DUE_COLOR = { overdue: c.dangerText, soon: c.doing, normal: undefined }

function Badge({ icon: Icon, color, strong, className, children }: {
  icon: typeof Clock; color?: string; strong?: boolean; className?: string; children: React.ReactNode
}) {
  return (
    <Box display="inline-flex" alignItems="center" gap="3px" color={color} fontWeight={strong ? 500 : undefined} className={className}>
      <Icon size={11} />
      {children}
    </Box>
  )
}

export function hasBadges(task: Task, isTimerActive: boolean): boolean {
  return (!!task.dueDate && task.status !== 'done') || task.timeSpent > 0 || isTimerActive || task.attachments.length > 0
}

// `today`: local midnight in ms. A prop rather than `new Date()` here, so a memoised card is redrawn when the date changes.
export default function TaskBadges({ task, isTimerActive, today }: { task: Task; isTimerActive: boolean; today: number }) {
  const due = task.dueDate && task.status !== 'done' ? dueLabel(task.dueDate, new Date(today)) : null

  return (
    <Flex gap="8px" align="center" flexShrink={0} whiteSpace="nowrap" fontFamily="body" fontSize="11px" color={c.textMuted}>
      {due && <Badge icon={Calendar} color={DUE_COLOR[due.tone]} strong={due.tone !== 'normal'}>{due.label}</Badge>}
      {task.timeSpent > 0 && <Badge icon={Clock}>{formatTime(task.timeSpent)}</Badge>}
      {isTimerActive && <Badge icon={Clock} color={c.doing} className="timer-badge">tracking</Badge>}
      {task.attachments.length > 0 && <Badge icon={Paperclip}>{task.attachments.length}</Badge>}
    </Flex>
  )
}
