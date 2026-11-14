import React from 'react'
import { Box, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

// The card under the pointer while dragging: the title only, lifted and slightly tilted.
export default function DragOverlayCard({ taskId }: { taskId: string }) {
  const { state } = useApp()
  const task = state.tasks.find(t => t.id === taskId)
  if (!task) return null

  return (
    <Box bg={c.cardHover} borderRadius="10px" boxShadow="0 16px 32px rgba(0,0,0,0.35)"
      transform="rotate(2deg)" px="12px" py="10px" cursor="grabbing">
      <Text fontFamily="body" fontWeight={500} fontSize="0.9rem" lineHeight={1.35} color={c.text} noOfLines={3}>
        {task.title}
      </Text>
    </Box>
  )
}
