import React from 'react'
import { Card, CardBody, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'

interface DragOverlayCardProps {
  taskId: string
}

export default function DragOverlayCard({ taskId }: DragOverlayCardProps) {
  const { state } = useApp()
  const task = state.tasks.find(t => t.id === taskId)
  if (!task) return null

  return (
    <Card
      bg="brand.surface"
      border="2px solid"
      borderColor="brand.shadow"
      boxShadow="8px 8px 0 var(--chakra-colors-brand-shadow)"
      transform="rotate(3deg)"
      opacity={0.9}
      size="sm"
    >
      <CardBody p={3}>
        <Text fontFamily="heading" fontWeight={600} fontSize="0.85rem">
          {task.title}
        </Text>
      </CardBody>
    </Card>
  )
}
