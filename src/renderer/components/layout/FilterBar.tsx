import React from 'react'
import { Flex, Box, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import { getContrastColor } from '../../utils/color'

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
    <Flex align="center" gap={3} mb={5} p="12px 16px" bg={c.surface} border={`1px solid ${c.borderStrong}`} borderRadius="10px" flexWrap="wrap">
      <Text fontFamily="heading" fontWeight={700} fontSize="0.75rem" textTransform="uppercase" letterSpacing="0.1em" color={c.textSecondary}>
        Filter
      </Text>

      <Flex gap={2} flex={1} flexWrap="wrap" align="center">
        {tags.length > 0 && (
          <>
            {tags.map(tag => {
              const isActive = activeFilters.tags.includes(tag.id)
              return (
                <Box
                  key={tag.id} as="button" fontFamily="heading" fontSize="0.7rem" fontWeight={600}
                  px={3} py="5px" borderRadius="6px" textTransform="uppercase" letterSpacing="0.05em"
                  bg={isActive ? tag.color : `${tag.color}22`}
                  color={isActive ? getContrastColor(tag.color) : tag.color}
                  border={`1px solid ${isActive ? tag.color : `${tag.color}44`}`}
                  cursor="pointer" transition="all 0.15s ease"
                  _hover={{ bg: isActive ? tag.color : `${tag.color}33` }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Box>
              )
            })}
            <Box w="1px" h="20px" bg={c.border} mx={1} />
          </>
        )}

        {AGE_OPTIONS.map(age => {
          const isActive = activeFilters.age === age
          return (
            <Box
              key={age} as="button" fontFamily="mono" fontSize="0.7rem" fontWeight={500}
              px={3} py="5px" borderRadius="6px" textTransform="uppercase"
              bg={isActive ? c.accent : 'transparent'}
              color={isActive ? '#fff' : c.textMuted}
              border={`1px solid ${isActive ? c.accent : c.border}`}
              cursor="pointer" transition="all 0.15s ease"
              _hover={{ bg: isActive ? c.accent : c.card }}
              onClick={() => setAge(age)}
            >
              {age}
            </Box>
          )
        })}
      </Flex>

      {hasFilters && (
        <Box as="button" fontFamily="heading" fontSize="0.7rem" fontWeight={700} px={3} py="5px"
          borderRadius="6px" bg="transparent" color={c.textSecondary} cursor="pointer"
          border={`1px solid ${c.border}`}
          _hover={{ color: c.text, borderColor: c.borderStrong }}
          onClick={() => dispatch({ type: 'SET_FILTERS', filters: { tags: [], age: null } })}
        >
          × Clear
        </Box>
      )}
    </Flex>
  )
}
