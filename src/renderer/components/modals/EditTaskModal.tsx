import React, { useState, useRef, useLayoutEffect } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Input, Textarea, TextareaProps, Button, Box, Flex, Text, chakra,
} from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { useIpc } from '../../hooks/useIpc'
import { colors as c } from '../../theme'
import AttachmentGrid from '../shared/AttachmentGrid'
import { Attachment, Task } from '../../state/types'
import { filesToDelete } from '../../utils/attachments'

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

// A textarea that grows to show all of its text (Chromium 120 has no `field-sizing: content`).
// ponytail: re-measured when the text changes, not when the window resizes; add a ResizeObserver if the modal gets a fluid width.
function AutoGrowTextarea({ fieldRef, ...props }: TextareaProps & { fieldRef: React.RefObject<HTMLTextAreaElement | null> }) {
  useLayoutEffect(() => {
    const el = fieldRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
  }, [props.value])
  return <Textarea ref={fieldRef} rows={1} minH="0" resize="none" overflow="hidden" {...props} />
}

export default function EditTaskModal() {
  const { state } = useApp()
  const task = state.editingTaskId && state.editingTaskId !== '__quick_add__'
    ? state.tasks.find(t => t.id === state.editingTaskId)
    : null
  // Mounted per task: the form is seeded once when the window opens, so data
  // reloaded from disk while it is open does not wipe what is being typed.
  return task ? <EditTaskForm key={task.id} task={task} /> : null
}

function EditTaskForm({ task }: { task: Task }) {
  const { state, dispatch } = useApp()
  const ipc = useIpc()
  // The task as it was when the window opened: edits and added/removed files are measured against it.
  const opened = useRef(task).current

  const [title, setTitle] = useState(opened.title)
  const [description, setDescription] = useState(opened.description || '')
  const [dueDate, setDueDate] = useState(opened.dueDate || '')
  const [status, setStatus] = useState(opened.status)
  const [selectedTags, setSelectedTags] = useState(opened.tags)
  const [attachments, setAttachments] = useState(opened.attachments)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const closed = useRef(false)

  // Every way out of the window ends here. Escape, an overlay click, the close
  // button and Cmd+Enter save; the Cancel button is the only discard.
  const close = (outcome: 'save' | 'cancel') => {
    if (closed.current) return
    closed.current = true
    if (outcome === 'save') {
      // Only the fields edited here are written, so closing an untouched window writes nothing.
      const updates: Partial<Task> = {}
      const newTitle = title.trim()
      if (newTitle && newTitle !== opened.title) updates.title = newTitle // an emptied title keeps the old one
      if (description !== (opened.description || '')) updates.description = description
      if (dueDate !== (opened.dueDate || '')) updates.dueDate = dueDate
      if (selectedTags !== opened.tags) updates.tags = selectedTags
      if (attachments !== opened.attachments) updates.attachments = attachments
      if (Object.keys(updates).length) dispatch({ type: 'UPDATE_TASK', id: task.id, updates })
      if (status !== opened.status) dispatch({ type: 'MOVE_TASK', id: task.id, status })
    }
    const usedElsewhere = state.tasks
      .filter(t => t.id !== task.id)
      .flatMap(t => t.attachments.map(a => a.filename))
    filesToDelete(opened.attachments, attachments, outcome, usedElsewhere).forEach(f => ipc.deleteImage(f))
    dispatch({ type: 'SET_EDITING_TASK', id: null })
  }

  const addAttachment = (attachment: Attachment) => {
    // The file finished saving after the window closed: nothing refers to it.
    if (closed.current) { ipc.deleteImage(attachment.filename); return }
    setAttachments(prev => [...prev, attachment])
  }

  const removeAttachment = (filename: string) => {
    setAttachments(prev => prev.filter(a => a.filename !== filename))
    // Added in this session, so no saved task refers to it: delete it now.
    if (!opened.attachments.some(a => a.filename === filename)) ipc.deleteImage(filename)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
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
          addAttachment({ filename, originalName: `pasted-image.${blob.type.split('/')[1]}`, type: blob.type })
        }
        reader.readAsDataURL(blob)
      }
    }
  }

  const handleFileAttach = (files: FileList) => {
    for (const file of Array.from(files)) {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const filename = await ipc.saveFile({ base64Data: base64, originalName: file.name, mimeType: file.type })
        addAttachment({ filename, originalName: file.name, type: file.type })
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <Modal isOpen onClose={() => close('save')} size="lg" scrollBehavior="inside" initialFocusRef={titleRef}>
      <ModalOverlay bg="var(--c-modal-overlay)" backdropFilter="blur(2px)" />
      <ModalContent
        maxW="520px" bg={c.surface} color={c.text} borderRadius="12px" border={`1px solid ${c.borderStrong}`}
        onPaste={handlePaste}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); close('save') }
        }}
      >
        <ModalHeader fontFamily="body" fontWeight={600} fontSize="0.95rem" borderBottom={`1px solid ${c.border}`} pb={3}>
          Edit task
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pt={5} pb={2}>
          {/* Title */}
          <Box mb={5}>
            <Text {...fieldLabel}>Title</Text>
            <AutoGrowTextarea
              fieldRef={titleRef}
              aria-label="Title"
              value={title}
              onChange={e => setTitle(e.target.value.replace(/\n/g, ' '))}
              onKeyDown={e => {
                // A title is one line of text: Enter moves on to the description (Cmd+Enter saves).
                if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  descriptionRef.current?.focus()
                }
              }}
              variant="unstyled"
              px={3} py={2}
              {...fieldInput}
            />
          </Box>

          {/* Description */}
          <Box mb={5}>
            <Text {...fieldLabel}>Description</Text>
            <Textarea
              ref={descriptionRef}
              aria-label="Description"
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
          <AttachmentGrid attachments={attachments} onRemove={removeAttachment} onFileAttach={handleFileAttach} showAlways />

          {/* Status and due date */}
          <Flex gap={3} mb={5}>
            <Box flex={1}>
              <Text {...fieldLabel}>Status</Text>
              {/* a native select: Chakra's Select puts style props on its wrapper, not the field */}
              <chakra.select
                aria-label="Status"
                value={status}
                onChange={e => setStatus(e.target.value as Task['status'])}
                w="100%" h="38px" px={3}
                {...fieldInput}
              >
                <option value="todo">To do</option>
                <option value="doing">In progress</option>
                <option value="done">Done</option>
              </chakra.select>
            </Box>
            <Box flex={1}>
              <Text {...fieldLabel}>Due date</Text>
              <Input
                type="date"
                aria-label="Due date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                variant="unstyled"
                px={3} py="6px"
                {...fieldInput}
              />
            </Box>
          </Flex>

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
            onClick={() => close('cancel')}
          >
            Cancel
          </Button>
          <Button
            fontSize="0.82rem" fontWeight={500} fontFamily="body"
            bg="var(--c-save-btn-bg)" color="var(--c-save-btn-color)"
            px={4} py={2}
            borderRadius="8px"
            _hover={{ bg: 'var(--c-save-btn-hover)' }}
            onClick={() => close('save')}
          >
            Save changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
