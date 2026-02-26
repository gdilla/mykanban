import React, { useRef } from 'react'
import {
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
  AlertDialogBody, AlertDialogFooter, Button,
} from '@chakra-ui/react'
import { colors as c } from '../../theme'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
      <AlertDialogOverlay bg="rgba(13, 13, 26, 0.85)" />
      <AlertDialogContent bg={c.surface} border={`1px solid ${c.borderStrong}`} borderRadius="12px" color={c.text}
        boxShadow="0 24px 48px rgba(0,0,0,0.5)">
        <AlertDialogHeader fontFamily="heading" fontWeight={700} fontSize="1.1rem" textTransform="uppercase"
          letterSpacing="0.05em" borderBottom={`1px solid ${c.border}`} pb={4}>
          {title}
        </AlertDialogHeader>
        <AlertDialogBody pt={5} fontFamily="body" fontSize="0.9rem" color={c.textSecondary}>
          {message}
        </AlertDialogBody>
        <AlertDialogFooter gap={3} borderTop={`1px solid ${c.border}`} pt={5}>
          <Button ref={cancelRef} variant="brutalist-outline" onClick={onClose}>Cancel</Button>
          <Button variant="brutalist-danger" onClick={() => { onConfirm(); onClose() }}>Delete</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
