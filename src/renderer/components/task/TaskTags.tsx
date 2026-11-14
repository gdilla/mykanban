import React from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Tag, Task } from '../../state/types'
import { colors as c } from '../../theme'

// A chip is the tag colour at TAG_TINT over the card, with the label in a text token: TaskTags.test.ts keeps
// that pair at 4.5:1 in every palette for any tag colour.
export const TAG_TINT = 0.22
export const TAG_LABEL = c.text

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
      {shown.map(tag => (
        <Box
          key={tag.id}
          fontFamily="body" fontSize="11px" lineHeight="18px" fontWeight={500}
          px="7px" borderRadius="9px" whiteSpace="nowrap" flexShrink={0}
          bg={`color-mix(in srgb, ${tag.color} ${TAG_TINT * 100}%, transparent)`}
          color={TAG_LABEL}
        >
          {tag.name}
        </Box>
      ))}
    </Flex>
  )
}
