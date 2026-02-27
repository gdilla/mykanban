import React from 'react'
import { Flex, Box, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

const AGE_OPTIONS = ['1d', '3d', '1w', '2w', '1m']

export default function FilterBar() {
  const { state, dispatch } = useApp()
  const { tags, activeFilters } = state

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
    <Flex align="center" gap={3} mb={5} p="10px 16px" bg={c.surface} borderRadius="10px" flexWrap="wrap">
      <Text fontFamily="body" fontWeight={500} fontSize="0.75rem" color={c.textSecondary}>
        Filter
      </Text>

      <Flex gap={2} flex={1} flexWrap="wrap" align="center">
        {tags.length > 0 && (
          <>
            {tags.map(tag => {
              const isActive = activeFilters.tags.includes(tag.id)
              return (
                <Box
                  key={tag.id} as="button" fontFamily="body" fontSize="0.7rem" fontWeight={500}
                  px={3} py="4px" borderRadius="8px"
                  bg={isActive ? `${tag.color}30` : 'transparent'}
                  color={isActive ? tag.color : c.textSecondary}
                  border={`1px solid ${isActive ? `${tag.color}44` : c.border}`}
                  cursor="pointer" transition="all 0.15s ease"
                  _hover={{ bg: `${tag.color}20`, color: tag.color }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Box>
              )
            })}
            <Box w="1px" h="16px" bg={c.border} mx={1} />
          </>
        )}

        {AGE_OPTIONS.map(age => {
          const isActive = activeFilters.age === age
          return (
            <Box
              key={age} as="button" fontFamily="body" fontSize="0.7rem" fontWeight={500}
              px={3} py="4px" borderRadius="8px"
              bg={isActive ? c.accentSoft : 'transparent'}
              color={isActive ? c.accent : c.textSecondary}
              border={`1px solid ${isActive ? c.accentAlpha40 : c.border}`}
              cursor="pointer" transition="all 0.15s ease"
              _hover={{ bg: isActive ? c.accentSoft : c.card }}
              onClick={() => setAge(age)}
            >
              {age}
            </Box>
          )
        })}
      </Flex>

      {hasFilters && (
        <Box as="button" fontFamily="body" fontSize="0.7rem" fontWeight={500} px={3} py="4px"
          borderRadius="8px" bg="transparent" color={c.textMuted} cursor="pointer"
          border={`1px solid ${c.border}`}
          _hover={{ color: c.text, borderColor: c.borderStrong }}
          onClick={() => dispatch({ type: 'SET_FILTERS', filters: { tags: [], age: null } })}
        >
          Clear
        </Box>
      )}
    </Flex>
  )
}
