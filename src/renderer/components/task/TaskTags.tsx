import React from 'react'
import { Flex } from '@chakra-ui/react'
import { Tag, Task } from '../../state/types'
import TagChip from '../shared/TagChip'

// One row of pills. Too many to fit fade out at the right instead of wrapping: the fade covers the row's last
// 8px, which is empty padding (taken back by the margin) unless the pills overflow into it.
export default function TaskTags({ task, tags }: { task: Task; tags: Tag[] }) {
  const shown = task.tags.flatMap(id => tags.find(t => t.id === id) ?? [])
  if (shown.length === 0) return null

  return (
    <Flex
      gap="4px" align="center" minW={0} overflow="hidden" pr="8px" mr="-8px"
      sx={{ maskImage: 'linear-gradient(to right, #000 calc(100% - 8px), transparent)' }}
    >
      {shown.map(tag => <TagChip key={tag.id} name={tag.name} color={tag.color} size="sm" />)}
    </Flex>
  )
}
