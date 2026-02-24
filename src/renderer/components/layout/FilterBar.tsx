import React from 'react'
import { Flex, Badge, Button, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'

const AGE_OPTIONS = [
  { label: '1d', value: '1d' },
  { label: '3d', value: '3d' },
  { label: '1w', value: '1w' },
  { label: '2w', value: '2w' },
  { label: '1m', value: '1m' },
]

export default function FilterBar() {
  const { state, dispatch } = useApp()
  const { tags, activeFilters } = state

  const toggleTag = (tagId: string) => {
    const current = activeFilters.tags
    const next = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId]
    dispatch({ type: 'SET_FILTERS', filters: { tags: next } })
  }

  const setAge = (age: string | null) => {
    dispatch({ type: 'SET_FILTERS', filters: { age: activeFilters.age === age ? null : age } })
  }

  const hasFilters = activeFilters.tags.length > 0 || activeFilters.age !== null

  return (
    <Flex align="center" gap={2} mb={4} flexWrap="wrap">
      <Text fontSize="xs" fontFamily="heading" textTransform="uppercase" color="brand.textSecondary" mr={1}>
        Filter:
      </Text>
      {tags.map(tag => (
        <Badge
          key={tag.id}
          bg={activeFilters.tags.includes(tag.id) ? tag.color : 'transparent'}
          color={activeFilters.tags.includes(tag.id) ? 'white' : 'brand.text'}
          border="2px solid"
          borderColor={tag.color}
          cursor="pointer"
          px={2}
          py={0.5}
          onClick={() => toggleTag(tag.id)}
          _hover={{ opacity: 0.8 }}
        >
          {tag.name}
        </Badge>
      ))}

      {tags.length > 0 && (
        <Text color="brand.border" mx={1}>|</Text>
      )}

      {AGE_OPTIONS.map(opt => (
        <Badge
          key={opt.value}
          bg={activeFilters.age === opt.value ? 'brand.text' : 'transparent'}
          color={activeFilters.age === opt.value ? 'white' : 'brand.textSecondary'}
          border="1px solid"
          borderColor="brand.border"
          cursor="pointer"
          px={2}
          py={0.5}
          onClick={() => setAge(opt.value)}
          _hover={{ opacity: 0.8 }}
        >
          {opt.label}
        </Badge>
      ))}

      {hasFilters && (
        <Button
          size="xs"
          variant="ghost"
          ml={2}
          onClick={() => dispatch({ type: 'SET_FILTERS', filters: { tags: [], age: null } })}
          color="brand.accent"
          fontFamily="heading"
        >
          Clear
        </Button>
      )}
    </Flex>
  )
}
