import React from 'react'
import { Flex, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import TagChip from './TagChip'

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
    <Flex gap="6px" flexWrap="wrap" role="group" aria-label="Tags">
      {state.tags.map(tag => (
        <TagChip
          key={tag.id}
          name={tag.name}
          color={tag.color}
          selected={selectedTags.includes(tag.id)}
          onClick={() => toggle(tag.id)}
        />
      ))}
      {state.tags.length === 0 && (
        <Text fontSize="12px" color={c.textMuted}>No tags yet. Create one in Manage tags.</Text>
      )}
    </Flex>
  )
}
