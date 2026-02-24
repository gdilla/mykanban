import React, { useState, useEffect, useRef } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Input, Textarea, Button, FormControl, FormLabel, Select, Link,
} from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { Task } from '../../state/types'
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
      setTimeout(() => inputRef.current?.focus(), 100)
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
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay bg="rgba(45, 42, 38, 0.8)" />
      <ModalContent>
        <ModalHeader>Quick Add Task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel fontFamily="heading" fontSize="0.85rem" textTransform="uppercase">
              Title
            </FormLabel>
            <Input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="What needs to be done?"
              border="2px solid"
              borderColor="brand.shadow"
              borderRadius="0"
              bg="brand.bg"
            />
          </FormControl>

          {showDesc ? (
            <FormControl mb={4}>
              <FormLabel fontFamily="heading" fontSize="0.85rem" textTransform="uppercase">
                Description
              </FormLabel>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add more details..."
                border="2px solid"
                borderColor="brand.shadow"
                borderRadius="0"
                bg="brand.bg"
                minH="80px"
              />
            </FormControl>
          ) : (
            <Link
              fontSize="0.8rem"
              color="brand.textSecondary"
              onClick={() => setShowDesc(true)}
              mb={4}
              display="block"
            >
              + Add description
            </Link>
          )}

          <FormControl mb={4}>
            <FormLabel fontFamily="heading" fontSize="0.85rem" textTransform="uppercase">
              Due Date
            </FormLabel>
            <Input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              border="2px solid"
              borderColor="brand.shadow"
              borderRadius="0"
              bg="brand.bg"
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontFamily="heading" fontSize="0.85rem" textTransform="uppercase">
              Status
            </FormLabel>
            <Select
              value={status}
              onChange={e => setStatus(e.target.value as Task['status'])}
              border="2px solid"
              borderColor="brand.shadow"
              borderRadius="0"
              bg="brand.bg"
            >
              <option value="todo">To Do</option>
              <option value="doing">In Progress</option>
              <option value="done">Done</option>
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontFamily="heading" fontSize="0.85rem" textTransform="uppercase">
              Tags
            </FormLabel>
            <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
          </FormControl>
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
