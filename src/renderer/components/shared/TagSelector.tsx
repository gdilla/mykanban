import React from 'react'
import { Flex, Badge } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'

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
          <Badge
            key={tag.id}
            bg={isSelected ? tag.color : 'transparent'}
            color={isSelected ? 'white' : 'brand.text'}
            border="2px solid"
            borderColor={tag.color}
            cursor="pointer"
            px={3}
            py={1}
            onClick={() => toggle(tag.id)}
            _hover={{ opacity: 0.8 }}
            transition="all 0.15s"
          >
            {tag.name}
          </Badge>
        )
      })}
      {state.tags.length === 0 && (
        <Badge variant="subtle" colorScheme="gray" fontSize="0.7rem">
          No tags yet — create some in Tag Manager
        </Badge>
      )}
    </Flex>
  )
}
