import React, { useState, useEffect, useRef } from 'react'
import { Box, Input, Flex, Text } from '@chakra-ui/react'
import { Search, Plus, Columns3, Tag, BarChart3, SlidersHorizontal, Check } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import { usePalette } from '../../theme/usePalette'
import Dialog from './Dialog'
import { paletteSections, PaletteItem, ActionId } from './paletteItems'

const STATUS = {
  todo: { label: 'To do', color: c.todo },
  doing: { label: 'In progress', color: c.doing },
  done: { label: 'Done', color: c.done },
}

const ACTION_ICONS: Record<ActionId, React.ReactNode> = {
  'new-task': <Plus size={14} />,
  'switch-view': <Columns3 size={14} />,
  'manage-tags': <Tag size={14} />,
  summaries: <BarChart3 size={14} />,
  'toggle-filters': <SlidersHorizontal size={14} />,
}

const dot = (color: string, border?: string) => <Box w="8px" h="8px" borderRadius="full" bg={color} border={border} />

export default function CommandPalette() {
  const { state, dispatch } = useApp()
  const { palette, followsSystem, setPalette, palettes } = usePalette()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setIsOpen(prev => !prev); setQuery(''); setSelectedIndex(0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sections = isOpen
    ? paletteSections(query, {
        tasks: state.tasks,
        tags: state.tags,
        activeTagIds: state.activeFilters.tags,
        currentView: state.currentView,
        palettes,
        paletteId: followsSystem ? null : palette.id,
      })
    : []
  const items = sections.flatMap(s => s.items)

  // Keep the highlighted row on screen while arrowing through a long list
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const run = (item: PaletteItem) => {
    setIsOpen(false)
    const emit = (event: string, detail?: boolean) => window.dispatchEvent(new CustomEvent(event, { detail }))
    switch (item.kind) {
      case 'task':
        return dispatch({ type: 'SET_EDITING_TASK', id: item.task.id })
      case 'filter': {
        const active = state.activeFilters.tags
        dispatch({ type: 'SET_FILTERS', filters: { tags: item.active ? active.filter(id => id !== item.tag.id) : [...active, item.tag.id] } })
        return emit('toggle-filters', true) // show the bar, so a filtered board always says why
      }
      case 'palette':
        return setPalette(item.paletteId)
      case 'action':
        switch (item.action) {
          case 'new-task': return dispatch({ type: 'SET_EDITING_TASK', id: '__quick_add__' })
          case 'switch-view': return dispatch({ type: 'SET_VIEW', view: state.currentView === 'status' ? 'tags' : 'status' })
          case 'manage-tags': return emit('open-tag-manager')
          case 'summaries': return emit('open-summary-viewer')
          case 'toggle-filters': return emit('toggle-filters')
        }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && !e.nativeEvent.isComposing && items[selectedIndex]) { e.preventDefault(); run(items[selectedIndex]) }
  }

  const leading = (item: PaletteItem) => {
    switch (item.kind) {
      case 'task': return dot(STATUS[item.task.status].color)
      case 'action': return ACTION_ICONS[item.action]
      case 'filter': return dot(item.tag.color)
      case 'palette': return item.preview ? dot(item.preview, `1px solid ${c.borderStrong}`) : dot('transparent', `1px solid ${c.textMuted}`)
    }
  }

  const trailing = (item: PaletteItem) => {
    if (item.kind === 'task') return STATUS[item.task.status].label
    if (item.kind === 'action') return item.hint
    return item.active ? <Check size={14} aria-label="On" /> : null
  }

  return (
    <Dialog
      isOpen={isOpen} onClose={() => setIsOpen(false)} width={560} initialFocusRef={inputRef}
      contentProps={{ 'aria-label': 'Command palette' }}
    >
      <Flex align="center" gap="10px" px={4} borderBottom={`1px solid ${c.border}`} color={c.textMuted} flexShrink={0}>
        <Search size={16} />
        <Input
          ref={inputRef} value={query} aria-label="Search tasks and commands"
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks or run a command"
          variant="unstyled" h="48px" fontSize="15px" color={c.text}
          _placeholder={{ color: c.textMuted }}
        />
      </Flex>

      <Box ref={listRef} role="listbox" aria-label="Results" flex="1" minH={0} maxH="380px" overflowY="auto" p="6px" pb="8px">
        {sections.map(section => (
          <Box key={section.heading} role="group" aria-label={section.heading}>
            <Text px="10px" pt="8px" pb="4px" fontSize="11px" fontWeight={500} color={c.textMuted}>
              {section.heading}
            </Text>
            {section.items.map(item => {
              const index = items.indexOf(item)
              const isSelected = index === selectedIndex
              return (
                <Flex
                  key={item.key} role="option" aria-selected={isSelected}
                  align="center" gap="10px" h="32px" px="10px" borderRadius="6px" cursor="pointer"
                  bg={isSelected ? c.card : 'transparent'}
                  boxShadow={isSelected ? `inset 0 0 0 1px ${c.border}` : undefined}
                  color={isSelected ? c.text : c.textSecondary}
                  onMouseMove={() => setSelectedIndex(index)}
                  onClick={() => run(item)}
                >
                  <Flex w="16px" justify="center" flexShrink={0}>{leading(item)}</Flex>
                  <Text flex={1} fontSize="13px" noOfLines={1} color={c.text}>{item.label}</Text>
                  <Flex fontSize="11px" color={c.textMuted} flexShrink={0} align="center">{trailing(item)}</Flex>
                </Flex>
              )
            })}
          </Box>
        ))}
        {items.length === 0 && (
          <Text px="10px" py="18px" fontSize="13px" color={c.textMuted} textAlign="center">
            Nothing matches “{query.trim()}”. Try a task title, a tag or a command such as “new task”.
          </Text>
        )}
      </Box>

      <Flex gap={4} px={4} h="32px" align="center" flexShrink={0} borderTop={`1px solid ${c.border}`} fontSize="11px" color={c.textMuted}>
        <Text>↑↓ to move</Text>
        <Text>↵ to choose</Text>
        <Text>esc to close</Text>
      </Flex>
    </Dialog>
  )
}
