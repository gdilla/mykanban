import React, { useRef } from 'react'
import { Button, Text } from '@chakra-ui/react'
import { colors as c } from '../../theme'
import Dialog from './Dialog'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  /** Names the destructive action, e.g. "Delete tag". */
  confirmLabel?: string
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete' }: ConfirmDialogProps) {
  // Focus starts on Cancel, so a stray Enter never destroys anything.
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog
      isOpen={isOpen} onClose={onClose} title={title} width={400}
      initialFocusRef={cancelRef} contentProps={{ role: 'alertdialog' }}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
        </>
      }
    >
      <Text fontSize="13px" lineHeight="20px" color={c.textSecondary}>{message}</Text>
    </Dialog>
  )
}
