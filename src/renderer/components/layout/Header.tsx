import React from 'react'
import { Flex, Button, Text, Box, Menu, MenuButton, MenuList, MenuOptionGroup, MenuItemOption, MenuDivider } from '@chakra-ui/react'
import { SlidersHorizontal, Tag, BarChart3, Palette } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import { usePalette } from '../../theme/usePalette'

// The header doubles as the window title bar (see .app-header in global.css).
// On macOS the first 80px belong to the traffic lights.
const isMac = navigator.userAgent.includes('Mac')

export default function Header({ showFilters, onToggleFilters }: { showFilters: boolean; onToggleFilters: () => void }) {
  const { state, dispatch } = useApp()
  const { palette, followsSystem, setPalette, palettes } = usePalette()

  return (
    <Flex as="header" className="app-header" align="center" gap={3} h="52px" pl={isMac ? '80px' : 3} pr={3} borderBottom={`1px solid ${c.border}`} bg={c.surface} flexShrink={0}>
      <Flex align="center" gap={4} flex="1" minW={0}>
        <Flex role="group" aria-label="Group tasks by" bg={c.card} borderRadius="8px" p="2px" flexShrink={0}>
          {(['status', 'tags'] as const).map(view => (
            <Button
              key={view}
              size="xs"
              aria-pressed={state.currentView === view}
              bg={state.currentView === view ? c.surface : 'transparent'}
              color={state.currentView === view ? c.text : c.textSecondary}
              borderRadius="6px"
              border="none"
              fontSize="13px"
              px={3}
              boxShadow={state.currentView === view ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'}
              onClick={() => dispatch({ type: 'SET_VIEW', view })}
              _hover={{ color: c.text }}
            >
              {view === 'status' ? 'Status' : 'Tags'}
            </Button>
          ))}
        </Flex>

        {/* Keyboard hints: one row; any hint that does not fit wraps to a second row, which is clipped. */}
        <Flex columnGap="6px" rowGap="24px" align="center" alignContent="flex-start" flexWrap="wrap" h="24px" overflow="hidden" flex="1" minW={0} display={{ base: 'none', lg: 'flex' }}>
          {[
            ['↑↓←→', 'nav'],
            ['Enter', 'edit'],
            ['d', 'done'],
            ['⌘K', 'search'],
          ].map(([key, label], i) => (
            <Flex key={key} align="center" gap={1}>
              {i > 0 && <Text color={c.border} mx="2px" fontSize="11px">·</Text>}
              <Text as="kbd" bg={c.card} border={`1px solid ${c.border}`} borderRadius="4px" px={1.5} py={0.5} fontSize="11px" color={c.textSecondary} fontFamily="mono">
                {key}
              </Text>
              <Text fontSize="11px" color={c.textSecondary}>{label}</Text>
            </Flex>
          ))}
        </Flex>
      </Flex>

      <Flex gap={1} align="center" flexShrink={0}>
        <HeaderBtn icon={<SlidersHorizontal size={14} />} label="Filters" isActive={showFilters} onClick={onToggleFilters} />
        <HeaderBtn icon={<Tag size={14} />} label="Manage tags" onClick={() => window.dispatchEvent(new CustomEvent('open-tag-manager'))} />
        <HeaderBtn icon={<BarChart3 size={14} />} label="Summaries" onClick={() => window.dispatchEvent(new CustomEvent('open-summary-viewer'))} />

        <Box w="1px" h="20px" bg={c.border} mx={1} />

        <Menu placement="bottom-end" isLazy>
          {({ isOpen }) => (
            <>
              <MenuButton
                aria-label="Palette"
                title="Palette"
                p="7px"
                borderRadius="8px"
                color={isOpen ? c.text : c.textSecondary}
                bg={isOpen ? c.card : 'transparent'}
                transition="all 0.15s"
                _hover={{ color: c.text, bg: c.card }}
              >
                <Palette size={15} />
              </MenuButton>
              {/* Keys pressed in the menu must not reach the board shortcuts (x deletes the focused card). */}
              <MenuList zIndex="popover" onKeyDown={e => e.stopPropagation()}>
                <MenuOptionGroup
                  type="radio"
                  value={followsSystem ? 'system' : palette.id}
                  onChange={id => setPalette(id === 'system' ? null : (id as string))}
                >
                  <MenuItemOption value="system">Match system</MenuItemOption>
                  <MenuDivider borderColor={c.border} my="4px" />
                  {palettes.map(p => (
                    <MenuItemOption key={p.id} value={p.id}>
                      <Flex align="center" gap={2}>
                        <Box w="10px" h="10px" borderRadius="50%" flexShrink={0} bg={p.preview} border={`1px solid ${c.borderStrong}`} />
                        {p.name}
                      </Flex>
                    </MenuItemOption>
                  ))}
                </MenuOptionGroup>
              </MenuList>
            </>
          )}
        </Menu>
      </Flex>
    </Flex>
  )
}

// Icon plus label; the label is dropped on narrow windows so the header never overflows.
function HeaderBtn({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive?: boolean; onClick: () => void }) {
  return (
    <Box
      as="button"
      display="flex"
      alignItems="center"
      gap="5px"
      px="10px" py="6px"
      fontSize="13px"
      fontWeight={500}
      color={isActive ? c.text : c.textSecondary}
      bg={isActive ? c.card : 'transparent'}
      borderRadius="8px"
      cursor="pointer"
      transition="all 0.15s"
      _hover={{ color: c.text, bg: c.card }}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
    >
      {icon}
      <Box as="span" display={{ base: 'none', md: 'inline' }}>{label}</Box>
    </Box>
  )
}
