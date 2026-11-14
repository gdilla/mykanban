import React, { memo, useMemo } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Tag, Task } from '../../state/types'
import { useAppDispatch } from '../../state/AppContext'
import { colors as c } from '../../theme'
import TaskCard from '../task/TaskCard'
import AddTaskForm from './AddTaskForm'

// Done is a log ordered by completion time, so cards there do not make room for a dragged one.
// ponytail: a drop in Done still renumbers sortOrder there (resolveDrop), which nothing displays;
// skip the reorder in Board.handleDragEnd if the extra save ever matters.
const noSorting = () => null

interface ColumnProps {
  columnId: string
  title: string
  color: string
  /** The cards drawn. */
  tasks: Task[]
  /** Every task in the column, including the ones a collapsed Done column leaves out. */
  count: number
  /** The Done column is showing all of its tasks: offer "Show less". */
  expanded?: boolean
  tags: Tag[]
  /** Set only on the column whose copy of the focused card is the highlighted one. */
  focusedTaskId: string | null
  /** Local midnight today (ms): what due labels are counted from. */
  today: number
  emptyText: string
  showAddForm?: boolean
}

// memo: a column is re-rendered only when its own cards, focus or the tag list change.
function Column({ columnId, title, color, tasks, count, expanded, tags, focusedTaskId, today, emptyText, showAddForm }: ColumnProps) {
  const dispatch = useAppDispatch()
  const { setNodeRef } = useDroppable({ id: `column-${columnId}`, data: { columnId } })
  // A task can sit in several tag columns at once, so a card's drag id is unique per column (Board.tsx parses it).
  // Memoised: a new array would re-render every card in the column through the sortable context.
  const sortableIds = useMemo(() => tasks.map(task => `${columnId}:${task.id}`), [tasks, columnId])

  return (
    <Box ref={setNodeRef} data-column={columnId} flex="1" minW="280px" display="flex" flexDir="column" minH={0}>
      <Flex align="center" gap="8px" px="4px" pt="12px" pb="8px">
        <Box w="8px" h="8px" borderRadius="50%" bg={color} flexShrink={0} />
        <Text fontFamily="heading" fontWeight={600} fontSize="13px" color={c.text} noOfLines={1}>{title}</Text>
        <Text fontFamily="body" fontSize="12px" color={c.textMuted}>{count}</Text>
      </Flex>

      {/* The 4px padding (pulled back by the margin) leaves room for card shadows and the focus ring;
          the scroll padding keeps that ring in view when a card is scrolled to */}
      <SortableContext id={columnId} items={sortableIds} strategy={columnId === 'done' ? noSorting : verticalListSortingStrategy}>
        <Box flex="1" minH={0} overflowY="auto" display="flex" flexDir="column" gap="6px" p="4px" m="-4px" sx={{ scrollPaddingBlock: '6px' }}>
          {tasks.length === 0 && (
            <Text py="20px" px="12px" textAlign="center" fontFamily="body" fontSize="12px" color={c.textMuted}>
              {emptyText}
            </Text>
          )}
          {tasks.map((task, i) => (
            <TaskCard
              key={task.id} task={task} tags={tags} today={today} sortableId={sortableIds[i]}
              isFocused={task.id === focusedTaskId}
            />
          ))}
          {(count > tasks.length || expanded) && (
            <Box
              as="button" type="button" flexShrink={0} alignSelf="center" px="10px" py="4px" borderRadius="8px"
              fontFamily="body" fontSize="12px" color={c.textSecondary} cursor="pointer"
              _hover={{ color: c.text, bg: c.surface }}
              onClick={() => dispatch({ type: 'SET_SHOW_ALL_DONE', show: !expanded })}
            >
              {expanded ? 'Show less' : `Show all (${count})`}
            </Box>
          )}
        </Box>
      </SortableContext>

      {showAddForm && <Box flexShrink={0} pt="8px"><AddTaskForm columnId={columnId} /></Box>}
    </Box>
  )
}

export default memo(Column)
