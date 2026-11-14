import React, { memo, useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Play, RotateCcw, Trash2, Undo2 } from 'lucide-react'
import { Tag, Task } from '../../state/types'
import { useAppDispatch } from '../../state/AppContext'
import { colors as c } from '../../theme'
import TaskTitle from './TaskTitle'
import TaskBadges, { hasBadges } from './TaskBadges'
import TaskTags from './TaskTags'

interface TaskCardProps {
  task: Task
  /** Every tag on the board, not just this task's: that array only changes when tags do, so memo holds. */
  tags: Tag[]
  isFocused: boolean
  isTimerActive: boolean
  sortableId: string
}

// Everything the card needs arrives as props and it reads only the dispatch context,
// so memo skips it unless its own task, focus or the tag list changed.
function TaskCardInner({ task, tags, isFocused, isTimerActive, sortableId }: TaskCardProps) {
  const dispatch = useAppDispatch()
  const [editingTitle, setEditingTitle] = useState(false)
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // A press that starts while the title is being edited belongs to the edit (selecting text, or clicking
  // away to save): the click it ends in must not open the edit window.
  const pressedWhileEditing = useRef(false)
  useEffect(() => () => clearTimeout(openTimer.current), [])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId })
  const isDone = task.status === 'done'
  const description = !isDone && task.description
  const hasMeta = task.tags.length > 0 || hasBadges(task, isTimerActive)

  const open = () => dispatch({ type: 'SET_EDITING_TASK', id: task.id })
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (pressedWhileEditing.current) return
    clearTimeout(openTimer.current)
    // ponytail: a click on the title waits 250 ms in case it is the first half of a double-click (rename in
    // place); a click anywhere else on the card opens at once. A slower double-click opens the edit window.
    if ((e.target as Element).closest('.task-title')) openTimer.current = setTimeout(open, 250)
    else open()
  }
  const startTitleEdit = () => {
    clearTimeout(openTimer.current)
    setEditingTitle(true)
  }
  const endTitleEdit = (value: string | null) => {
    setEditingTitle(false)
    const title = value?.replace(/\s*\n\s*/g, ' ').trim()
    if (title && title !== task.title) dispatch({ type: 'UPDATE_TASK', id: task.id, updates: { title } })
  }
  const moveTo = (status: Task['status']) => () => dispatch({ type: 'MOVE_TASK', id: task.id, status })

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : undefined }}
      {...attributes}
      {...listeners}
      className={`task-card${isFocused ? ' focused' : ''}`}
      data-task-id={task.id}
      bg={c.card} borderRadius="10px" boxShadow="var(--c-card-shadow)"
      px="12px" py="10px" flexShrink={0} cursor="grab"
      onPointerDownCapture={() => { pressedWhileEditing.current = editingTitle }}
      onClick={handleClick}
      _hover={{ bg: c.cardHover }}
    >
      <Flex align="flex-start" gap="8px">
        {/* Status mark, centred on the first line of the title */}
        <Flex w="14px" h="1.215rem" flexShrink={0} align="center" justify="center" color={c[task.status]}>
          {isDone ? <Check size={14} strokeWidth={3} /> : <Box w="8px" h="8px" borderRadius="50%" bg="currentColor" />}
        </Flex>
        <Box flex="1" minW={0}>
          {/* With nothing below it the title is the last row, where the quick actions sit: keep them clear of it */}
          <Box pr={!description && !hasMeta && !editingTitle ? '88px' : undefined}>
            <TaskTitle
              title={task.title} muted={isDone} editing={editingTitle}
              onStartEdit={startTitleEdit} onEndEdit={endTitleEdit}
            />
          </Box>
          {description && (
            <Text fontFamily="body" fontSize="0.8rem" lineHeight="1.4" color={c.textSecondary} mt="2px" noOfLines={2}>
              {description}
            </Text>
          )}
          {hasMeta && (
            <Flex align="center" gap="8px" mt="4px" minH="20px">
              <TaskTags task={task} tags={tags} />
              <TaskBadges task={task} isTimerActive={isTimerActive} />
            </Flex>
          )}
        </Box>
      </Flex>

      {/* Quick actions: bottom-right, over the end of the last row (meta, else description), never the title.
          Hidden with `visibility`, so they cannot take keyboard focus while invisible. */}
      <Flex
        className="task-quick-actions"
        position="absolute" right="6px" bottom="9px" pl="16px"
        bg={`linear-gradient(to right, transparent, ${c.cardHover} 14px)`}
        onClick={e => e.stopPropagation()}
      >
        {task.status === 'todo' && <QuickAction icon={Play} label="Start" onClick={moveTo('doing')} />}
        {task.status === 'doing' && <QuickAction icon={Undo2} label="Back to To do" onClick={moveTo('todo')} />}
        {isDone
          ? <QuickAction icon={RotateCcw} label="Reopen" onClick={moveTo('todo')} />
          : <QuickAction icon={Check} label="Done" hoverColor={c.done} onClick={moveTo('done')} />}
        {/* undoable: see the toast in useKeyboardNav */}
        <QuickAction icon={Trash2} label="Delete" hoverColor={c.dangerText} onClick={() => dispatch({ type: 'DELETE_TASK', id: task.id })} />
      </Flex>
    </Box>
  )
}

function QuickAction({ icon: Icon, label, hoverColor = c.text, onClick }: {
  icon: typeof Check; label: string; hoverColor?: string; onClick: () => void
}) {
  return (
    <Box
      as="button" type="button" title={label} aria-label={label}
      display="flex" alignItems="center" justifyContent="center"
      w="24px" h="22px" borderRadius="6px" color={c.textSecondary} cursor="pointer"
      _hover={{ color: hoverColor, bg: c.card }}
      onClick={onClick}
    >
      <Icon size={13} />
    </Box>
  )
}

const TaskCard = memo(TaskCardInner)
export default TaskCard
