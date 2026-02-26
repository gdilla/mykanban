import React, { useState, useEffect } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Input, Button, Flex, Box, Text,
} from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'
import ConfirmDialog from '../shared/ConfirmDialog'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
}

export default function TagManagerModal() {
  const { state, dispatch } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6bcb77')
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('open-tag-manager', handler)
    return () => window.removeEventListener('open-tag-manager', handler)
  }, [])

  const handleAdd = () => {
    if (!newName.trim()) return
    dispatch({ type: 'ADD_TAG', tag: { id: generateId(), name: newName.trim(), color: newColor } })
    setNewName('')
    setNewColor('#6bcb77')
  }

  const handleDelete = (tagId: string) => {
    setDeleteTagId(tagId)
  }

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
      <ModalOverlay bg="rgba(13, 13, 26, 0.85)" />
      <ModalContent bg={c.surface} color={c.text}>
        <ModalHeader>Manage Tags</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {state.tags.map(tag => (
            <Flex key={tag.id} align="center" gap={2} mb={2} p={2} bg={c.bg} border={`1px solid ${c.border}`}>
              <Box w="20px" h="20px" bg={tag.color} border={`2px solid ${c.borderStrong}`} flexShrink={0} />
              <Text flex={1} fontFamily="heading" fontWeight={600} fontSize="0.85rem" color={c.text}>{tag.name}</Text>
              <Box
                as="button"
                fontSize="0.75rem"
                color={c.danger}
                cursor="pointer"
                fontWeight={700}
                _hover={{ color: '#ff2234' }}
                onClick={() => handleDelete(tag.id)}
              >
                DEL
              </Box>
              <ConfirmDialog
                isOpen={deleteTagId === tag.id}
                onClose={() => setDeleteTagId(null)}
                onConfirm={() => dispatch({ type: 'DELETE_TAG', id: tag.id })}
                title="Delete Tag"
                message={`Delete "${tag.name}"? It will be removed from all tasks.`}
              />
            </Flex>
          ))}
          <Flex gap={2} mt={4}>
            <Input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="New tag name..." size="sm" variant="brutalist" flex={1} />
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
              style={{ width: 40, height: 32, border: `2px solid ${c.borderStrong}`, cursor: 'pointer', background: c.bg }} />
            <Button size="sm" variant="brutalist" onClick={handleAdd}>Add</Button>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button variant="brutalist-outline" onClick={() => setIsOpen(false)}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
