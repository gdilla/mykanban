import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Input, Textarea, Button, Box, Flex, Text,
} from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { useIpc } from '../../hooks/useIpc'
import { colors as c } from '../../theme'
import AttachmentGrid from '../shared/AttachmentGrid'
import { Attachment } from '../../state/types'

const fieldLabel = {
  fontFamily: 'body',
  fontWeight: 600,
  color: c.textSecondary,
  fontSize: '0.7rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  mb: '6px',
}

const fieldInput = {
  bg: c.card,
  border: `1px solid var(--c-border-strong)`,
  borderRadius: '8px',
  fontFamily: 'body',
  fontSize: '0.9rem',
  color: c.text,
  _focus: {
    borderColor: 'var(--c-focus-outline)',
    boxShadow: '0 0 0 3px var(--c-accent-soft)',
  },
  _placeholder: { color: c.textMuted },
}

export default function EditTaskModal() {
  const { state, dispatch } = useApp()
  const ipc = useIpc()
  const task = state.editingTaskId && state.editingTaskId !== '__quick_add__'
    ? state.tasks.find(t => t.id === state.editingTaskId)
    : null
  const isOpen = !!task

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [newAttachments, setNewAttachments] = useState<string[]>([])
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDueDate(task.dueDate || '')
      setSelectedTags([...task.tags])
      setAttachments([...task.attachments])
      setNewAttachments([])
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [task])

  const handleSave = () => {
    if (!task) return
    dispatch({
      type: 'UPDATE_TASK',
      id: task.id,
      updates: { title: title.trim() || task.title, description, dueDate, tags: selectedTags, attachments },
    })
    dispatch({ type: 'SET_EDITING_TASK', id: null })
  }

  const handleClose = () => {
    newAttachments.forEach(filename => {
      if (!attachments.find(a => a.filename === filename)) ipc.deleteImage(filename)
    })
    dispatch({ type: 'SET_EDITING_TASK', id: null })
  }

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (!blob) continue
        const reader = new FileReader()
        reader.onload = async () => {
          const filename = await ipc.saveImage(reader.result as string)
          setAttachments(prev => [...prev, { filename, originalName: `pasted-image.${blob.type.split('/')[1]}`, type: blob.type }])
          setNewAttachments(prev => [...prev, filename])
        }
        reader.readAsDataURL(blob)
      }
    }
  }, [ipc])

  const handleFileAttach = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const filename = await ipc.saveFile({ base64Data: base64, originalName: file.name, mimeType: file.type })
        setAttachments(prev => [...prev, { filename, originalName: file.name, type: file.type }])
        setNewAttachments(prev => [...prev, filename])
      }
      reader.readAsDataURL(file)
    }
  }, [ipc])

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay bg="var(--c-modal-overlay)" backdropFilter="blur(2px)" />
      <ModalContent maxW="520px" bg={c.surface} color={c.text} borderRadius="12px" border={`1px solid ${c.borderStrong}`} onPaste={handlePaste}>
        <ModalHeader fontFamily="body" fontWeight={600} fontSize="0.95rem" borderBottom={`1px solid ${c.border}`} pb={3}>
          Edit task
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pt={5} pb={2}>
          {/* Title */}
          <Box mb={5}>
            <Text {...fieldLabel}>Title</Text>
            <Input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              variant="unstyled"
              px={3} py={2}
              {...fieldInput}
            />
          </Box>

          {/* Description */}
          <Box mb={5}>
            <Text {...fieldLabel}>Description</Text>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              variant="unstyled"
              px={3} py={2}
              minH="120px"
              resize="vertical"
              {...fieldInput}
            />
          </Box>

          {/* Attachments */}
          <AttachmentGrid attachments={attachments} onRemove={f => setAttachments(prev => prev.filter(a => a.filename !== f))} onFileAttach={handleFileAttach} showAlways />

          {/* Due Date */}
          <Box mb={5}>
            <Text {...fieldLabel}>Due date</Text>
            <Input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              variant="unstyled"
              px={3} py="6px"
              {...fieldInput}
            />
          </Box>

          {/* Tags */}
          <Box mb={4}>
            <Text {...fieldLabel}>Tags</Text>
            <Flex gap={2} flexWrap="wrap">
              {state.tags.map(tag => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <Box
                    key={tag.id}
                    as="button"
                    fontFamily="body" fontSize="0.72rem" fontWeight={500}
                    px="10px" py="3px" borderRadius="6px"
                    bg={isSelected ? `${tag.color}25` : 'transparent'}
                    color={isSelected ? tag.color : c.textMuted}
                    border={`1px solid ${isSelected ? `${tag.color}40` : c.border}`}
                    cursor="pointer"
                    transition="all 0.15s ease"
                    opacity={isSelected ? 1 : 0.5}
                    _hover={{ opacity: isSelected ? 1 : 0.8 }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name.toLowerCase()}
                  </Box>
                )
              })}
              {state.tags.length === 0 && (
                <Text fontSize="0.7rem" color={c.textMuted}>No tags yet</Text>
              )}
            </Flex>
          </Box>
        </ModalBody>

        <ModalFooter borderTop={`1px solid ${c.border}`} gap={3} pt={4}>
          <Button
            variant="unstyled"
            fontSize="0.82rem" fontWeight={500} fontFamily="body"
            color={c.textSecondary}
            px={4} py={2}
            _hover={{ color: c.text, bg: c.card }}
            borderRadius="8px"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            fontSize="0.82rem" fontWeight={500} fontFamily="body"
            bg="var(--c-save-btn-bg)" color="var(--c-save-btn-color)"
            px={4} py={2}
            borderRadius="8px"
            _hover={{ bg: 'var(--c-save-btn-hover)' }}
            onClick={handleSave}
          >
            Save changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
