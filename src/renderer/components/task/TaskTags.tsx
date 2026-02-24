import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#0c0c0c' : '#fff'
}

export default function TaskTags({ task }: { task: Task }) {
  const { state } = useApp()
  if (!task.tags || task.tags.length === 0) return null

  return (
    <Flex gap="5px" flexWrap="wrap" mt={2} mb={1}>
      {task.tags.map(tagId => {
        const tag = state.tags.find(t => t.id === tagId)
        if (!tag) return null
        return (
          <Box key={tagId} fontFamily="heading" fontSize="0.62rem" fontWeight={600}
            px="8px" py="2px" borderRadius="4px" textTransform="uppercase" letterSpacing="0.05em"
            bg={tag.color} color={getContrastColor(tag.color)}>
            {tag.name}
          </Box>
        )
      })}
    </Flex>
  )
}
