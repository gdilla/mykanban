import React from 'react'
import { flushSync } from 'react-dom'
import { Box } from '@chakra-ui/react'
import {
  Active, CollisionDetection, DndContext, DragEndEvent, DragOverlay, DragStartEvent, DroppableContainer,
  KeyboardCoordinateGetter, KeyboardSensor, Over, PointerSensor, closestCenter, getClientRect, pointerWithin,
  rectIntersection, useSensor, useSensors,
} from '@dnd-kit/core'
import { useApp } from '../../state/AppContext'
import { keyboardMove, landsAfter, resolveDrop } from '../../state/drop'
import { focusTaken } from '../../state/nav'
import BoardColumns from '../board/BoardColumns'
import DragOverlayCard from '../task/DragOverlay'

// Column.tsx registers each card as a sortable with id `${columnId}:${taskId}` inside a SortableContext whose
// id is the column id, and each column as a droppable carrying `data.columnId`.
function parse({ id, data }: Active | Over): { columnId: string; taskId: string | null } {
  const containerId = data.current?.sortable?.containerId
  return containerId === undefined
    ? { columnId: data.current?.columnId, taskId: null }
    : { columnId: containerId, taskId: String(id).slice(String(containerId).length + 1) }
}

const isColumn = (d: DroppableContainer) => !d.data.current?.sortable
const cardsOf = (column: DroppableContainer, all: DroppableContainer[]) =>
  all.filter(d => d.data.current?.sortable?.containerId === column.data.current?.columnId)

// The column under the pointer (or, for keyboard drags, under the dragged card), then one card inside it:
// the nearest by centre for a pointer, the one the dragged card was snapped onto (same top edge) for the keyboard.
const collisionDetection: CollisionDetection = args => {
  const columns = args.droppableContainers.filter(isColumn)
  const column: DroppableContainer | undefined = (pointerWithin({ ...args, droppableContainers: columns })[0]
    ?? rectIntersection({ ...args, droppableContainers: columns })[0])?.data?.droppableContainer
  if (!column) return []
  const cards = cardsOf(column, args.droppableContainers)
  const gap = (d: DroppableContainer) =>
    Math.abs((args.droppableRects.get(d.id)?.top ?? Infinity) - args.collisionRect.top)
  const card = args.pointerCoordinates
    ? closestCenter({ ...args, droppableContainers: cards })[0]?.data?.droppableContainer
    : cards.reduce<DroppableContainer | undefined>((best, d) => (best && gap(best) <= gap(d) ? best : d), undefined)
  const hit = card ?? column
  return [{ id: hit.id, data: { droppableContainer: hit } }]
}

// Arrow keys while a card is picked up with the keyboard: snap it onto the next card or column (keyboardMove).
// dnd-kit's sortableKeyboardCoordinates picks targets by distance, which skips cards when heights differ.
// ponytail: a target hidden in another column's scrolled list is not scrolled into view; scroll it here if needed.
const keyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const { over, collisionRect, droppableRects } = context
  if (!over || !collisionRect || !event.code.startsWith('Arrow')) return
  event.preventDefault()
  const all = context.droppableContainers.getEnabled().filter(d => droppableRects.has(d.id))
  const rect = (d: DroppableContainer) => droppableRects.get(d.id)!
  const columns = all.filter(isColumn).sort((a, b) => rect(a).left - rect(b).left)
  const { columnId, taskId } = parse(over)
  const index: number = taskId === null ? -1 : over.data.current?.sortable.index
  const to = keyboardMove(
    event.code,
    columns.map(column => ({
      ...rect(column),
      cards: cardsOf(column, all)
        .sort((a, b) => a.data.current?.sortable.index - b.data.current?.sortable.index).map(rect),
    })),
    {
      column: columns.findIndex(d => d.data.current?.columnId === columnId),
      // resting on the column top, above the first card, the card under it is not the one it is snapped onto
      slot: index !== -1 && collisionRect.top < over.rect.top - 1 ? index - 1 : index,
      top: collisionRect.top,
    },
  )
  return to && { x: to.left, y: to.top }
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

// Sensor options live out here so they are the same objects on every render: new ones give dnd-kit new
// sensors, which re-renders every card on the board each time Board renders (on every action).
// Require 8px of movement before activating drag — this lets clicks through
const pointerOptions = { activationConstraint: { distance: 8 } }
// Space picks up and drops a focused card; Enter is left to useKeyboardNav (it opens the card).
const keyboardOptions = {
  coordinateGetter: keyboardCoordinates,
  // scroll at once: the next key press reads card positions, which a smooth scroll would still be changing
  scrollBehavior: 'auto' as const,
  keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Tab'] },
}

export default function Board() {
  const { state, dispatch } = useApp()
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, pointerOptions), useSensor(CardKeyboardSensor, keyboardOptions))

  // While a card is being moved with the keyboard, its keys (arrows, Space, Escape) must not also reach
  // useKeyboardNav's window listener, which would move the board focus or act on another card.
  const keyboardDrag = React.useRef(false)
  React.useEffect(() => {
    const swallow = (e: KeyboardEvent) => { if (keyboardDrag.current) e.stopPropagation() }
    document.addEventListener('keydown', swallow)
    return () => document.removeEventListener('keydown', swallow)
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    keyboardDrag.current = event.activatorEvent instanceof KeyboardEvent
    setActiveId(parse(event.active).taskId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    keyboardDrag.current = false
    setActiveId(null)
    const { active, over } = event
    const { columnId: fromColumnId, taskId } = parse(active)
    if (!over || !taskId) return

    const { columnId, taskId: overTaskId } = parse(over)
    const dragged = active.rect.current.translated
    const keyboard = event.activatorEvent instanceof KeyboardEvent
    const actions = resolveDrop(state.tasks, {
      view: state.currentView,
      taskId,
      fromColumnId,
      columnId,
      overTaskId,
      // ponytail: a card from another column shows no gap while hovering, it just lands above or below the card
      // it is dropped on (landsAfter). Move it between columns in onDragOver if a live preview is wanted.
      after: !!dragged && landsAfter(dragged, over.rect, keyboard),
    })
    if (!keyboard) return actions.forEach(dispatch)
    // A keyboard drop into another column draws the card anew there (in tag view: when it left the column it
    // was picked up in), and the element that had native focus is gone. Focus the new one, so the keyboard
    // still has the card: the focusin listener below highlights it, and Space picks it up again.
    flushSync(() => actions.forEach(dispatch))
    if (!(event.activatorEvent.target as Node).isConnected) {
      document.querySelector<HTMLElement>(`[data-column="${columnId}"] [data-task-id="${taskId}"]`)?.focus()
    }
  }

  // A card took native focus: make it the highlighted card as well (see focusTaken).
  // A native listener, not onFocus: React drops events that fire while it is committing, which is exactly
  // when a closing dialog hands focus back to a card.
  const boardRef = React.useRef<HTMLDivElement>(null)
  const stateRef = React.useRef(state)
  stateRef.current = state
  React.useEffect(() => {
    const board = boardRef.current!
    const onFocusIn = (e: FocusEvent) => {
      const card = e.target as HTMLElement
      if (!card.classList.contains('task-card')) return // a button or the title field inside a card
      const column = card.closest('[data-column]')
      const focus = focusTaken(stateRef.current, card.dataset.taskId!, Array.from(board.children).indexOf(column!))
      if (focus) dispatch({ type: 'SET_FOCUSED_TASK', ...focus })
    }
    board.addEventListener('focusin', onFocusIn)
    return () => board.removeEventListener('focusin', onFocusIn)
  }, [dispatch])

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
      onDragCancel={() => { keyboardDrag.current = false }}
    >
      <Box
        ref={boardRef}
        className="board-area"
        onClick={handleBoardClick}
        display="flex"
        gap="16px"
        overflowX="auto"
        flex="1"
        minH={0}
      >
        {/* Nothing until the data is in: empty columns would flash "nothing to do" on every launch */}
        {state.loaded && <BoardColumns />}
      </Box>
      <DragOverlay>
        {activeId ? <DragOverlayCard taskId={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
