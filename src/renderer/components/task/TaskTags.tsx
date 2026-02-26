import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'
import { getContrastColor } from '../../utils/color'

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
