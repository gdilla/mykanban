import React from 'react'
import { Flex, Badge } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'

interface TaskTagsProps {
  task: Task
}

export default function TaskTags({ task }: TaskTagsProps) {
  const { state } = useApp()

  if (!task.tags || task.tags.length === 0) return null

  return (
    <Flex gap={1} flexWrap="wrap" mb={1}>
      {task.tags.map(tagId => {
        const tag = state.tags.find(t => t.id === tagId)
        if (!tag) return null
        return (
          <Badge
            key={tagId}
            bg={tag.color}
            color="white"
            fontSize="0.6rem"
            px={1.5}
            py={0}
            border="1px solid"
            borderColor="brand.shadow"
          >
            {tag.name}
          </Badge>
        )
      })}
    </Flex>
  )
}
