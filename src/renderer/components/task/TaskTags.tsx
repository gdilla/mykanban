import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#fff'
}

export default function TaskTags({ task }: { task: Task }) {
  const { state } = useApp()

  if (!task.tags || task.tags.length === 0) return null

  return (
    <Flex gap="6px" flexWrap="wrap" mb="10px" position="relative" zIndex={1} mt={2}>
      {task.tags.map(tagId => {
        const tag = state.tags.find(t => t.id === tagId)
        if (!tag) return null
        return (
          <Box
            key={tagId}
            fontFamily="heading"
            fontSize="0.65rem"
            fontWeight={500}
            px="10px"
            py="3px"
            textTransform="uppercase"
            letterSpacing="0.05em"
            bg={tag.color}
            color={getContrastColor(tag.color)}
            border={`1px solid ${c.borderStrong}`}
            boxShadow={`1px 1px 0 ${c.shadow}`}
          >
            {tag.name}
          </Box>
        )
      })}
    </Flex>
  )
}
