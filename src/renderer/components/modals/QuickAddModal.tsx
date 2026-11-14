import React, { useState, useRef } from 'react'
import { Input, Textarea, Button } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { Task } from '../../state/types'
import { newTask } from '../../../shared/task-rules.mjs'
import Dialog, { Field, fieldStyle, FIELD_HEIGHT } from '../shared/Dialog'
import TagSelector from '../shared/TagSelector'
import StatusDueFields from './StatusDueFields'

export default function QuickAddModal() {
  const { state } = useApp()
  // Mounted per opening, so the form always starts empty.
  return state.editingTaskId === '__quick_add__' ? <QuickAddForm /> : null
}

function QuickAddForm() {
  const { state, dispatch } = useApp()
  const titleRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<Task['status']>('todo')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const close = () => dispatch({ type: 'SET_EDITING_TASK', id: null })

  const add = () => {
    if (!title.trim()) return
    // The same defaults the MCP server gives a new task (src/shared/task-rules.mjs)
    const task = newTask({ title: title.trim(), description, status, dueDate, tags: selectedTags }, state.tasks)
    dispatch({ type: 'ADD_TASK', task })
    close()
  }

  return (
    <Dialog
      isOpen onClose={close} title="New task" width={480} initialFocusRef={titleRef}
      contentProps={{
        onKeyDown: e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); add() }
        },
      }}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={add} isDisabled={!title.trim()}>Add task</Button>
        </>
      }
    >
      <Field label="Title">
        <Input
          ref={titleRef}
          aria-label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            // Plain Enter adds; Cmd+Enter is handled once, by the window.
            if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing) add()
          }}
          placeholder="What needs to be done?"
          variant="unstyled"
          h={FIELD_HEIGHT}
          {...fieldStyle}
        />
      </Field>

      <Field label="Description">
        <Textarea
          aria-label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional details"
          variant="unstyled"
          py={2}
          minH="64px"
          resize="vertical"
          {...fieldStyle}
        />
      </Field>

      <StatusDueFields status={status} onStatusChange={setStatus} dueDate={dueDate} onDueDateChange={setDueDate} />

      <Field label="Tags" mb={0}>
        <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
      </Field>
    </Dialog>
  )
}
