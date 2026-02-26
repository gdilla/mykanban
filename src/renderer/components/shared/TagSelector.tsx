import React from 'react'
import { Flex, Box, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import { getContrastColor } from '../../utils/color'

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export default function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const { state } = useApp()

  const toggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId))
    } else {
      onChange([...selectedTags, tagId])
    }
  }

  return (
    <Flex gap={2} flexWrap="wrap">
      {state.tags.map(tag => {
        const isSelected = selectedTags.includes(tag.id)
        return (
          <Box
            key={tag.id}
            as="button"
            bg={isSelected ? tag.color : 'transparent'}
            color={isSelected ? getContrastColor(tag.color) : c.textSecondary}
            border={`2px solid ${tag.color}`}
            cursor="pointer"
            px={3}
            py={1}
            fontFamily="heading"
            fontSize="0.75rem"
            fontWeight={500}
            textTransform="uppercase"
            letterSpacing="0.05em"
            onClick={() => toggle(tag.id)}
            _hover={{ opacity: 0.8 }}
            transition="all 0.15s"
          >
            {tag.name}
          </Box>
        )
      })}
      {state.tags.length === 0 && (
        <Text fontSize="0.7rem" color={c.textMuted}>
          No tags yet — create some in Tag Manager
        </Text>
      )}
    </Flex>
  )
}
