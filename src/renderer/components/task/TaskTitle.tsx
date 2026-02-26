import React from 'react'
import { Text } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { colors as c } from '../../theme'

export default function TaskTitle({ task }: { task: Task }) {
  const isDone = task.status === 'done'

  return (
    <Text
      fontFamily="body" fontWeight={500} fontSize="0.88rem" lineHeight="1.5"
      color={isDone ? c.textSecondary : c.text}
      textDecoration={isDone ? 'line-through' : undefined}
      wordBreak="break-word"
    >
      {task.title}
    </Text>
  )
}
