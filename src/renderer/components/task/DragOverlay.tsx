import React from 'react'
import { Box, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

export default function DragOverlayCard({ taskId }: { taskId: string }) {
  const { state } = useApp()
  const task = state.tasks.find(t => t.id === taskId)
  if (!task) return null

  return (
    <Box
      bg={c.card}
      border={`2px solid ${c.borderStrong}`}
      boxShadow={`8px 8px 0 ${c.shadow}`}
      transform="rotate(3deg)"
      opacity={0.95}
      p="16px 18px"
      borderRadius="2px"
    >
      <Text fontFamily="body" fontWeight={500} fontSize="0.9rem" color={c.text}>
        {task.title}
      </Text>
    </Box>
  )
}
