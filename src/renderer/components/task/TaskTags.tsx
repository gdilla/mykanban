import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'

export default function TaskTags({ task }: { task: Task }) {
  const { state } = useApp()
  if (!task.tags || task.tags.length === 0) return null

  return (
    <Flex gap="4px" flexWrap="wrap" align="center">
      {task.tags.map(tagId => {
        const tag = state.tags.find(t => t.id === tagId)
        if (!tag) return null
        return (
          <Box
            key={tagId}
            fontFamily="body" fontSize="0.68rem" fontWeight={500}
            px="7px" py="1px"
            borderRadius="5px"
            bg={`${tag.color}18`}
            color={tag.color}
            border={`1px solid ${tag.color}30`}
          >
            {tag.name.toLowerCase()}
          </Box>
        )
      })}
    </Flex>
  )
}
