import React, { useState, useRef, useEffect } from 'react'
import { Flex, Heading, Button, Text, Box } from '@chakra-ui/react'
import { SlidersHorizontal, Tag, BarChart3, Palette, Check } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import { usePalette } from '../../theme/usePalette'

export default function Header({ showFilters, onToggleFilters }: { showFilters: boolean; onToggleFilters: () => void }) {
  const { state, dispatch } = useApp()
  const { palette, setPalette, palettes } = usePalette()
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  return (
    <Flex as="header" align="center" justify="space-between" h="56px" px={6} borderBottom={`1px solid ${c.border}`} bg={c.surface} flexShrink={0}>
      <Flex align="center" gap={5}>
        <Heading as="h1" fontFamily="heading" fontWeight={600} fontSize="1rem" letterSpacing="-0.01em" color={c.text}>
          Kanban
        </Heading>
        <Flex gap="6px" align="center" flexWrap="wrap" display={{ base: 'none', lg: 'flex' }}>
          {[
            ['↑↓←→', 'nav'],
            ['Enter', 'edit'],
            ['d', 'done'],
            ['⌘K', 'search'],
          ].map(([key, label], i) => (
            <Flex key={key} align="center" gap={1}>
              {i > 0 && <Text color={c.border} mx="2px" fontSize="0.6rem">·</Text>}
              <Text as="kbd" bg={c.card} border={`1px solid ${c.border}`} borderRadius="4px" px={1.5} py={0.5} fontSize="0.62rem" color={c.textSecondary} fontFamily="mono">
                {key}
              </Text>
              <Text fontSize="0.62rem" color={c.textSecondary}>{label}</Text>
            </Flex>
          ))}
        </Flex>
      </Flex>

      <Flex gap={1} align="center">
        <Flex bg={c.card} borderRadius="6px" overflow="hidden" mr={2} p="2px">
          {(['status', 'tags'] as const).map(view => (
            <Button
              key={view}
              size="xs"
              bg={state.currentView === view ? c.surface : 'transparent'}
              color={state.currentView === view ? c.text : c.textMuted}
              borderRadius="5px"
              border="none"
              fontFamily="body"
              fontWeight={500}
              fontSize="0.78rem"
              px={3}
              boxShadow={state.currentView === view ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'}
              onClick={() => dispatch({ type: 'SET_VIEW', view })}
              _hover={{ color: c.text }}
            >
              {view === 'status' ? 'Status' : 'Tags'}
            </Button>
          ))}
        </Flex>

        <HeaderBtn icon={<SlidersHorizontal size={14} />} label="Filters" isActive={showFilters} onClick={onToggleFilters} />
        <HeaderBtn icon={<Tag size={14} />} label="Tags" onClick={() => window.dispatchEvent(new CustomEvent('open-tag-manager'))} />
        <HeaderBtn icon={<BarChart3 size={14} />} label="Summaries" onClick={() => window.dispatchEvent(new CustomEvent('open-summary-viewer'))} />

        <Box w="1px" h="20px" bg={c.border} mx={1} />

        {/* Palette picker */}
        <Box position="relative" ref={pickerRef}>
          <Box
            as="button"
            p="6px"
            borderRadius="6px"
            color={pickerOpen ? c.text : c.textMuted}
            bg={pickerOpen ? c.card : 'transparent'}
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ color: c.text, bg: c.card }}
            onClick={() => setPickerOpen(!pickerOpen)}
            display="flex"
            alignItems="center"
            title="Switch palette"
          >
            <Palette size={15} />
          </Box>

          {pickerOpen && (
            <div className="palette-picker-menu">
              {palettes.map(p => (
                <button
                  key={p.id}
                  className={`palette-picker-item ${p.id === palette.id ? 'active' : ''}`}
                  onClick={() => { setPalette(p.id); setPickerOpen(false) }}
                >
                  <span className="palette-dot" style={{ background: p.preview }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{p.name}</span>
                  {p.id === palette.id && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </Box>
      </Flex>
    </Flex>
  )
}

function HeaderBtn({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive?: boolean; onClick: () => void }) {
  return (
    <Box
      as="button"
      display="flex"
      alignItems="center"
      gap="5px"
      px="10px" py="6px"
      fontSize="0.78rem"
      fontWeight={500}
      fontFamily="body"
      color={isActive ? c.text : c.textMuted}
      bg={isActive ? c.card : 'transparent'}
      borderRadius="6px"
      cursor="pointer"
      transition="all 0.15s"
      _hover={{ color: c.text, bg: c.card }}
      onClick={onClick}
    >
      {icon}
      {label}
    </Box>
  )
}
