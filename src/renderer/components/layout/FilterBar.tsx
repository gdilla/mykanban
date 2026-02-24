import React from 'react'
import { Flex, Box, Text, Button } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

const AGE_OPTIONS = [
  { label: '1d', value: '1d' },
  { label: '3d', value: '3d' },
  { label: '1w', value: '1w' },
  { label: '2w', value: '2w' },
  { label: '1m', value: '1m' },
]

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#fff'
}

export default function FilterBar() {
  const { state, dispatch } = useApp()
  const { tags, activeFilters } = state

  if (tags.length === 0) return null

  const toggleTag = (tagId: string) => {
    const next = activeFilters.tags.includes(tagId)
      ? activeFilters.tags.filter(id => id !== tagId)
      : [...activeFilters.tags, tagId]
    dispatch({ type: 'SET_FILTERS', filters: { tags: next } })
  }

  const setAge = (age: string | null) => {
    dispatch({ type: 'SET_FILTERS', filters: { age: activeFilters.age === age ? null : age } })
  }

  const hasFilters = activeFilters.tags.length > 0 || activeFilters.age !== null

  return (
    <Flex
      align="center"
      gap={4}
      mb={6}
      p="16px 20px"
      bg={c.surface}
      border={`2px solid ${c.borderStrong}`}
      boxShadow={`4px 4px 0 ${c.shadow}`}
      flexWrap="wrap"
    >
      <Text fontFamily="heading" fontWeight={700} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.1em" color={c.text}>
        Filter
      </Text>

      <Flex gap={2} flex={1} flexWrap="wrap">
        {tags.map(tag => {
          const isActive = activeFilters.tags.includes(tag.id)
          return (
            <Box
              key={tag.id}
              as="button"
              fontFamily="heading"
              fontSize="0.75rem"
              fontWeight={500}
              px="14px"
              py="6px"
              textTransform="uppercase"
              letterSpacing="0.05em"
              bg={tag.color}
              color={getContrastColor(tag.color)}
              border={isActive ? `2px solid ${c.text}` : '2px solid transparent'}
              boxShadow={isActive ? `2px 2px 0 ${c.shadow}` : 'none'}
              cursor="pointer"
              transition="all 0.15s ease"
              _hover={{ transform: 'translateY(-2px)' }}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Box>
          )
        })}

        <Box w="1px" bg={c.border} mx={1} />

        {AGE_OPTIONS.map(opt => {
          const isActive = activeFilters.age === opt.value
          return (
            <Box
              key={opt.value}
              as="button"
              fontFamily="heading"
              fontSize="0.75rem"
              fontWeight={500}
              px="14px"
              py="6px"
              textTransform="uppercase"
              bg={isActive ? c.accent : c.bg}
              color={isActive ? '#fff' : c.textSecondary}
              border={`1px solid ${c.border}`}
              cursor="pointer"
              transition="all 0.15s ease"
              _hover={{ transform: 'translateY(-2px)' }}
              onClick={() => setAge(opt.value)}
            >
              {opt.label}
            </Box>
          )
        })}
      </Flex>

      {hasFilters && (
        <Box
          as="button"
          fontFamily="heading"
          fontSize="0.75rem"
          fontWeight={700}
          px="14px"
          py="6px"
          bg={c.danger}
          color="white"
          border={`2px solid ${c.borderStrong}`}
          cursor="pointer"
          transition="all 0.15s ease"
          _hover={{ transform: 'translateY(-2px)', boxShadow: `2px 2px 0 ${c.shadow}` }}
          onClick={() => dispatch({ type: 'SET_FILTERS', filters: { tags: [], age: null } })}
        >
          Clear
        </Box>
      )}
    </Flex>
  )
}
