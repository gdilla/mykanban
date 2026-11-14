import React, { useState, useEffect, useRef } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Input, Textarea, Button, Box, Text, Select, Link,
} from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { Task } from '../../state/types'
import { colors as c } from '../../theme'
import TagSelector from '../shared/TagSelector'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
}

export default function QuickAddModal() {
  const { state, dispatch } = useApp()
  const isOpen = state.editingTaskId === '__quick_add__'
  const inputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showDesc, setShowDesc] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<Task['status']>('todo')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setShowDesc(false)
      setDueDate('')
      setStatus('todo')
      setSelectedTags([])
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    const task: Task = {
      id: generateId(),
      title: title.trim(),
      description,
      status,
      dueDate,
      tags: selectedTags,
      attachments: [],
      createdAt: now,
      startedAt: status === 'doing' ? now : null,
      completedAt: status === 'done' ? now : null,
      timeSpent: 0,
      sortOrder: state.tasks.length,
      tagSortOrders: {},
    }
    dispatch({ type: 'ADD_TASK', task })
    dispatch({ type: 'SET_EDITING_TASK', id: null })
  }

  const handleClose = () => dispatch({ type: 'SET_EDITING_TASK', id: null })

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" initialFocusRef={inputRef}>
      <ModalOverlay bg="rgba(0, 0, 0, 0.7)" />
      <ModalContent maxW="400px" bg={c.surface} color={c.text}>
        <ModalHeader>Quick Add Task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={5}>
            <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">
              Title
            </Text>
            <Input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="What needs to be done?"
              variant="brutalist"
            />
          </Box>

          {showDesc ? (
            <Box mb={5}>
              <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">
                Description
              </Text>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add more details..."
                variant="brutalist"
                minH="80px"
              />
            </Box>
          ) : (
            <Link
              fontSize="0.8rem"
              color={c.textSecondary}
              onClick={() => setShowDesc(true)}
              mb={4}
              display="block"
            >
              + Add description
            </Link>
          )}

          <Box mb={5}>
            <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">
              Due Date
            </Text>
            <Input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              variant="brutalist"
            />
          </Box>

          <Box mb={5}>
            <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">
              Status
            </Text>
            <Select
              value={status}
              onChange={e => setStatus(e.target.value as Task['status'])}
              variant="brutalist"
            >
              <option style={{ background: '#0c0c0c', color: '#ececec' }} value="todo">To Do</option>
              <option style={{ background: '#0c0c0c', color: '#ececec' }} value="doing">In Progress</option>
              <option style={{ background: '#0c0c0c', color: '#ececec' }} value="done">Done</option>
            </Select>
          </Box>

          <Box mb={5}>
            <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">
              Tags
            </Text>
            <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
          </Box>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="brutalist-outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="brutalist" onClick={handleSubmit}>
            Add
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
