import React, { useState, useEffect, useCallback } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Input, Textarea, Button, FormControl, FormLabel, Flex,
} from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { useIpc } from '../../hooks/useIpc'
import TagSelector from '../shared/TagSelector'
import AttachmentGrid from '../shared/AttachmentGrid'
import { Attachment } from '../../state/types'

export default function EditTaskModal() {
  const { state, dispatch } = useApp()
  const ipc = useIpc()
  const task = state.tasks.find(t => t.id === state.editingTaskId)
  const isOpen = !!task

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [newAttachments, setNewAttachments] = useState<string[]>([]) // filenames of newly added

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDueDate(task.dueDate || '')
      setSelectedTags([...task.tags])
      setAttachments([...task.attachments])
      setNewAttachments([])
    }
  }, [task])

  const handleSave = () => {
    if (!task) return
    dispatch({
      type: 'UPDATE_TASK',
      id: task.id,
      updates: {
        title: title.trim() || task.title,
        description,
        dueDate,
        tags: selectedTags,
        attachments,
      },
    })
    dispatch({ type: 'SET_EDITING_TASK', id: null })
  }

  const handleClose = () => {
    // Clean up newly added attachments that weren't saved
    newAttachments.forEach(filename => {
      if (!attachments.find(a => a.filename === filename)) {
        ipc.deleteImage(filename)
      }
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
          const base64 = reader.result as string
          const filename = await ipc.saveImage(base64)
          const attachment: Attachment = {
            filename,
            originalName: `pasted-image.${blob.type.split('/')[1]}`,
            type: blob.type,
          }
          setAttachments(prev => [...prev, attachment])
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
        const filename = await ipc.saveFile({
          base64Data: base64,
          originalName: file.name,
          mimeType: file.type,
        })
        const attachment: Attachment = {
          filename,
          originalName: file.name,
          type: file.type,
        }
        setAttachments(prev => [...prev, attachment])
        setNewAttachments(prev => [...prev, filename])
      }
      reader.readAsDataURL(file)
    }
  }, [ipc])

  const handleRemoveAttachment = (filename: string) => {
    setAttachments(prev => prev.filter(a => a.filename !== filename))
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay bg="rgba(45, 42, 38, 0.8)" />
      <ModalContent onPaste={handlePaste}>
        <ModalHeader>Edit Task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel fontFamily="heading" fontSize="0.85rem" textTransform="uppercase">
              Title
            </FormLabel>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              border="2px solid"
              borderColor="brand.shadow"
              borderRadius="0"
              bg="brand.bg"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel fontFamily="heading" fontSize="0.85rem" textTransform="uppercase">
              Description
            </FormLabel>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              border="2px solid"
              borderColor="brand.shadow"
              borderRadius="0"
              bg="brand.bg"
              minH="120px"
            />
          </FormControl>

          <AttachmentGrid
            attachments={attachments}
            onRemove={handleRemoveAttachment}
            onFileAttach={handleFileAttach}
          />

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
              Tags
            </FormLabel>
            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="brutalist-outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="brutalist" onClick={handleSave}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
