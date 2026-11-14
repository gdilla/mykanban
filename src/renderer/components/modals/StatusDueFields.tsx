import React from 'react'
import { Flex, Input, chakra } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { Field, fieldStyle, FIELD_HEIGHT } from '../shared/Dialog'

interface StatusDueFieldsProps {
  status: Task['status']
  onStatusChange: (status: Task['status']) => void
  dueDate: string
  onDueDateChange: (dueDate: string) => void
}

/** The status and due-date row shared by the quick-add and edit windows. */
export default function StatusDueFields({ status, onStatusChange, dueDate, onDueDateChange }: StatusDueFieldsProps) {
  return (
    <Flex gap={3}>
      <Field label="Status" flex={1} minW={0}>
        {/* a native select: Chakra's Select puts style props on its wrapper, not the field */}
        <chakra.select
          aria-label="Status"
          value={status}
          onChange={e => onStatusChange(e.target.value as Task['status'])}
          h={FIELD_HEIGHT}
          {...fieldStyle}
          pl="8px" // the native select adds 4px of its own: its text lines up with the other fields
        >
          <option value="todo">To do</option>
          <option value="doing">In progress</option>
          <option value="done">Done</option>
        </chakra.select>
      </Field>
      <Field label="Due date" flex={1} minW={0}>
        <Input
          type="date"
          aria-label="Due date"
          value={dueDate}
          onChange={e => onDueDateChange(e.target.value)}
          variant="unstyled"
          h={FIELD_HEIGHT}
          {...fieldStyle}
        />
      </Field>
    </Flex>
  )
}
