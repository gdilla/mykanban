import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Tag, Task } from '../../state/types'
import { colors as c } from '../../theme'

// One row of pills, tinted in the tag colour; the label stays a text token so it is readable in every
// palette whatever colour the tag has. Too many to fit fade out at the right instead of wrapping.
export default function TaskTags({ task, tags }: { task: Task; tags: Tag[] }) {
  const shown = task.tags.flatMap(id => tags.find(t => t.id === id) ?? [])
  if (shown.length === 0) return null

  return (
    <Flex
      gap="4px" align="center" minW={0} overflow="hidden"
      sx={{ maskImage: 'linear-gradient(to right, #000 calc(100% - 12px), transparent)' }}
    >
      {shown.map(tag => (
        <Box
          key={tag.id}
          fontFamily="body" fontSize="11px" lineHeight="18px" fontWeight={500}
          px="7px" borderRadius="9px" whiteSpace="nowrap" flexShrink={0}
          bg={`color-mix(in srgb, ${tag.color} 22%, transparent)`}
          color={c.textSecondary}
        >
          {tag.name}
        </Box>
      ))}
    </Flex>
  )
}
