import React from 'react'
import { Flex, Box, Button, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import TagChip from '../shared/TagChip'

// Values are what selectors.ts understands; null is "no age filter".
const AGE_OPTIONS: [value: string | null, label: string][] = [
  [null, 'Any time'],
  ['1d', '1 day'],
  ['3d', '3 days'],
  ['1w', '1 week'],
  ['2w', '2 weeks'],
  ['1m', '1 month'],
]

const groupLabel = { fontSize: '12px', fontWeight: 500, color: c.textSecondary, whiteSpace: 'nowrap' as const }

export default function FilterBar() {
  const { state, dispatch } = useApp()
  const { tags, activeFilters } = state

  const toggleTag = (tagId: string) => {
    const next = activeFilters.tags.includes(tagId)
      ? activeFilters.tags.filter(id => id !== tagId)
      : [...activeFilters.tags, tagId]
    dispatch({ type: 'SET_FILTERS', filters: { tags: next } })
  }
  const hasFilters = activeFilters.tags.length > 0 || activeFilters.age !== null

  return (
    <Flex
      role="region" aria-label="Filters" align="flex-start" columnGap={6} rowGap={2} flexWrap="wrap" flexShrink={0}
      px="20px" py="8px" bg={c.surface} borderBottom={`1px solid ${c.border}`}
    >
      {/* Two groups on one row when the window is wide enough; otherwise each gets its own row */}
      {tags.length > 0 && (
        <Flex role="group" aria-label="Tags" align="center" gap="6px" flexWrap="wrap" minW={0} minH="28px">
          <Text {...groupLabel} mr="4px">Tags</Text>
          {tags.map(tag => (
            <TagChip
              key={tag.id} name={tag.name} color={tag.color}
              selected={activeFilters.tags.includes(tag.id)}
              onClick={() => toggleTag(tag.id)}
            />
          ))}
        </Flex>
      )}

      <Flex align="center" gap="10px">
        <Text {...groupLabel}>Created within</Text>
        {/* One choice of several: the same segmented control as the Status / Tags switch in the header */}
        <Flex role="group" aria-label="Created within" bg={c.card} borderRadius="8px" p="2px">
          {AGE_OPTIONS.map(([value, label]) => {
            const isActive = activeFilters.age === value
            return (
              <Box
                key={label} as="button" type="button" aria-pressed={isActive}
                h="24px" px="8px" borderRadius="6px" fontSize="12px" fontWeight={500} whiteSpace="nowrap"
                bg={isActive ? c.surface : 'transparent'}
                color={isActive ? c.text : c.textSecondary}
                boxShadow={isActive ? `0 0 0 1px ${c.border}` : 'none'}
                cursor="pointer"
                _hover={{ color: c.text }}
                onClick={() => dispatch({ type: 'SET_FILTERS', filters: { age: value } })}
              >
                {label}
              </Box>
            )
          })}
        </Flex>
        {/* Always takes its place, so the bar does not jump when the first filter goes on */}
        <Button
          variant="secondary" size="sm" h="28px" px={3} visibility={hasFilters ? 'visible' : 'hidden'}
          onClick={() => dispatch({ type: 'SET_FILTERS', filters: { tags: [], age: null } })}
        >
          Clear
        </Button>
      </Flex>
    </Flex>
  )
}
