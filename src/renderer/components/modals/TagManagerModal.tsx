import React, { useState, useEffect } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Input, Button, Flex, Box, IconButton, Text,
} from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
}

export default function TagManagerModal() {
  const { state, dispatch } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6bcb77')

  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('open-tag-manager', handler)
    return () => window.removeEventListener('open-tag-manager', handler)
  }, [])

  const handleAdd = () => {
    if (!newName.trim()) return
    dispatch({
      type: 'ADD_TAG',
      tag: { id: generateId(), name: newName.trim(), color: newColor },
    })
    setNewName('')
    setNewColor('#6bcb77')
  }

  const handleDelete = (tagId: string) => {
    if (confirm('Delete this tag? It will be removed from all tasks.')) {
      dispatch({ type: 'DELETE_TAG', id: tagId })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
      <ModalOverlay bg="rgba(45, 42, 38, 0.8)" />
      <ModalContent>
        <ModalHeader>Manage Tags</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {state.tags.map(tag => (
            <Flex key={tag.id} align="center" gap={2} mb={2} p={2} bg="brand.bg">
              <Box w="20px" h="20px" bg={tag.color} border="2px solid" borderColor="brand.shadow" flexShrink={0} />
              <Text flex={1} fontFamily="heading" fontWeight={600} fontSize="0.85rem">
                {tag.name}
              </Text>
              <IconButton
                aria-label="Delete tag"
                size="xs"
                variant="ghost"
                color="brand.accent"
                onClick={() => handleDelete(tag.id)}
                icon={<Text>✕</Text>}
              />
            </Flex>
          ))}

          <Flex gap={2} mt={4}>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="New tag name..."
              size="sm"
              border="2px solid"
              borderColor="brand.shadow"
              borderRadius="0"
              bg="brand.bg"
              flex={1}
            />
            <Input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              w="40px"
              h="32px"
              p={0}
              border="2px solid"
              borderColor="brand.shadow"
              borderRadius="0"
              cursor="pointer"
            />
            <Button size="sm" variant="brutalist" onClick={handleAdd}>
              Add
            </Button>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Button variant="brutalist-outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
