import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Calendar, Clock, Paperclip } from 'lucide-react'
import { Task } from '../../state/types'
import { colors as c } from '../../theme'
import { dueLabel, formatTime, timeSpentAt } from '../../utils/date'
import useNow from '../../hooks/useNow'

const DUE_COLOR = { overdue: c.dangerText, soon: c.doing, normal: undefined }

function Badge({ icon: Icon, color, strong, children }: {
  icon: typeof Clock; color?: string; strong?: boolean; children: React.ReactNode
}) {
  return (
    <Box display="inline-flex" alignItems="center" gap="3px" color={color} fontWeight={strong ? 500 : undefined}>
      <Icon size={11} />
      {children}
    </Box>
  )
}

// In progress with a start time: its time badge counts up.
const isRunning = (task: Task) => task.status === 'doing' && !!task.startedAt

export function hasBadges(task: Task): boolean {
  return (!!task.dueDate && task.status !== 'done') || task.timeSpent > 0 || isRunning(task) || task.attachments.length > 0
}

// Its own component, so the shared clock's tick re-renders this badge and not the card around it.
function RunningTime({ task }: { task: Task }) {
  const now = useNow()
  return <Badge icon={Clock} color={c.doing} strong>{formatTime(timeSpentAt(task, now))}</Badge>
}

// `today`: local midnight in ms. A prop rather than `new Date()` here, so a memoised card is redrawn when the date changes.
export default function TaskBadges({ task, today }: { task: Task; today: number }) {
  const due = task.dueDate && task.status !== 'done' ? dueLabel(task.dueDate, new Date(today)) : null

  return (
    <Flex gap="8px" align="center" flexShrink={0} whiteSpace="nowrap" fontFamily="body" fontSize="11px" color={c.textMuted}>
      {due && <Badge icon={Calendar} color={DUE_COLOR[due.tone]} strong={due.tone !== 'normal'}>{due.label}</Badge>}
      {isRunning(task)
        ? <RunningTime task={task} />
        : task.timeSpent > 0 && <Badge icon={Clock}>{formatTime(task.timeSpent)}</Badge>}
      {task.attachments.length > 0 && <Badge icon={Paperclip}>{task.attachments.length}</Badge>}
    </Flex>
  )
}
