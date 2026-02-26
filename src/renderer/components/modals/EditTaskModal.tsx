import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Input, Textarea, Button, Box, Text,
} from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { useIpc } from '../../hooks/useIpc'
import { colors as c } from '../../theme'
import TagSelector from '../shared/TagSelector'
import AttachmentGrid from '../shared/AttachmentGrid'
import { Attachment } from '../../state/types'

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

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay bg="rgba(13, 13, 26, 0.85)" />
      <ModalContent maxW="480px" bg={c.surface} color={c.text} onPaste={handlePaste}>
        <ModalHeader>Edit Task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={5}>
            <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">Title</Text>
            <Input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} variant="brutalist" />
          </Box>
          <Box mb={5}>
            <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">Description</Text>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} variant="brutalist" minH="120px" resize="vertical" />
            <Text fontSize="0.75rem" color={c.textMuted} mt={1}>Paste images with ⌘V</Text>
          </Box>
          <AttachmentGrid attachments={attachments} onRemove={f => setAttachments(prev => prev.filter(a => a.filename !== f))} onFileAttach={handleFileAttach} showAlways />
          <Box mb={5}>
            <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">Due Date</Text>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} variant="brutalist" />
          </Box>
          <Box mb={5}>
            <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">Tags</Text>
            <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
          </Box>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="brutalist-outline" onClick={handleClose}>Cancel</Button>
          <Button variant="brutalist" onClick={handleSave}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
