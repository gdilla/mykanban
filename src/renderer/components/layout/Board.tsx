import React from 'react'
import { Box } from '@chakra-ui/react'
import {
  Active, CollisionDetection, DndContext, DragEndEvent, DragOverlay, DragStartEvent, DroppableContainer,
  KeyboardSensor, Over, PointerSensor, closestCenter, getClientRect, pointerWithin, rectIntersection, useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useApp } from '../../state/AppContext'
import { landsAfter, resolveDrop, snapDistance } from '../../state/drop'
import StatusView from '../board/StatusView'
import TagView from '../board/TagView'
import DragOverlayCard from '../task/DragOverlay'

// Column.tsx registers each card as a sortable with id `${columnId}:${taskId}` inside a SortableContext whose
// id is the column id, and each column as a droppable carrying `data.columnId`.
function parse({ id, data }: Active | Over): { columnId: string; taskId: string | null } {
  const containerId = data.current?.sortable?.containerId
  return containerId === undefined
    ? { columnId: data.current?.columnId, taskId: null }
    : { columnId: containerId, taskId: String(id).slice(String(containerId).length + 1) }
}

// The column under the pointer (or, for keyboard drags, under the dragged card), then one card inside it:
// the nearest by centre for a pointer, the one the dragged card was snapped onto for the keyboard.
const collisionDetection: CollisionDetection = args => {
  const columns = args.droppableContainers.filter(d => !d.data.current?.sortable)
  const column: DroppableContainer | undefined = (pointerWithin({ ...args, droppableContainers: columns })[0]
    ?? rectIntersection({ ...args, droppableContainers: columns })[0])?.data?.droppableContainer
  if (!column) return []
  const cards = args.droppableContainers.filter(
    d => d.data.current?.sortable?.containerId === column.data.current?.columnId)
  const snap = (d: DroppableContainer) => {
    const rect = args.droppableRects.get(d.id)
    return rect ? snapDistance(args.collisionRect, rect) : Infinity
  }
  const card = args.pointerCoordinates
    ? closestCenter({ ...args, droppableContainers: cards })[0]?.data?.droppableContainer
    : cards.reduce<DroppableContainer | undefined>((best, d) => (best && snap(best) <= snap(d) ? best : d), undefined)
  const hit = card ?? column
  return [{ id: hit.id, data: { droppableContainer: hit } }]
}

// Collide with the picked-up card's own box (the overlay wrapper), not the smaller, tilted preview drawn inside it.
// The tilt alone shifts the box by under a pixel, enough to send the first ArrowRight to a card in the same column.
const measuring = { dragOverlay: { measure: (node: HTMLElement) => getClientRect(node.parentElement ?? node) } }

// Only the card itself starts a keyboard drag: Space on a button inside the card still presses that button.
class CardKeyboardSensor extends KeyboardSensor {
  static activators: typeof KeyboardSensor.activators = [{
    eventName: 'onKeyDown',
    handler: (event, ...rest) =>
      event.target === event.currentTarget && KeyboardSensor.activators[0].handler(event, ...rest),
  }]
}

export default function Board() {
  const { state, dispatch } = useApp()
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const sensors = useSensors(
    // Require 8px of movement before activating drag — this lets clicks through
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    // Space picks up and drops a focused card; Enter is left to useKeyboardNav (it opens the card).
    useSensor(CardKeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Tab'] },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(parse(event.active).taskId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    const { columnId: fromColumnId, taskId } = parse(active)
    if (!over || !taskId) return

    const { columnId, taskId: overTaskId } = parse(over)
    const dragged = active.rect.current.translated
    resolveDrop(state.tasks, {
      view: state.currentView,
      taskId,
      fromColumnId,
      columnId,
      overTaskId,
      // ponytail: a card from another column shows no gap while hovering, it just lands above or below the card
      // it is dropped on (landsAfter). Move it between columns in onDragOver if a live preview is wanted.
      after: !!dragged && landsAfter(dragged, over.rect, event.activatorEvent instanceof KeyboardEvent),
    }).forEach(dispatch)
  }

  const handleBoardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('board-area') || target.closest('.column-area')) {
      ;(document.activeElement as HTMLElement)?.blur()
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        className="board-area"
        onClick={handleBoardClick}
        display="flex"
        gap={6}
        overflowX="auto"
        flex="1"
        minH={0}
      >
        {state.currentView === 'status' ? <StatusView /> : <TagView />}
      </Box>
      <DragOverlay>
        {activeId ? <DragOverlayCard taskId={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
