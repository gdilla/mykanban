import React from 'react'
import { Box, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

export default function DragOverlayCard({ taskId }: { taskId: string }) {
  const { state } = useApp()
  const task = state.tasks.find(t => t.id === taskId)
  if (!task) return null

  return (
    <Box bg={c.card} border={`1px solid ${c.borderStrong}`} borderRadius="8px"
      boxShadow="0 16px 32px rgba(0,0,0,0.5)" transform="rotate(2deg)" opacity={0.95} p="14px 16px">
      <Text fontFamily="body" fontWeight={500} fontSize="0.88rem" color={c.text}>
        {task.title}
      </Text>
    </Box>
  )
}
