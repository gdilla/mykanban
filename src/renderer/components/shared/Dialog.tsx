import React from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  ModalContentProps, Box, BoxProps, Text,
} from '@chakra-ui/react'
import { colors as c } from '../../theme'

// The one window style: every dialog (quick add, edit, tag manager, summaries, confirm) and the
// command palette is drawn by this component, so overlay, panel, header, padding and footer cannot drift apart.

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  /** Sentence-case heading. Leave out for a bare panel with no header, padding or footer (the command palette). */
  title?: string
  /** Buttons, right-aligned: secondary first, the primary (or destructive) action last. */
  footer?: React.ReactNode
  width?: number
  initialFocusRef?: React.RefObject<HTMLElement | null>
  /** Extra props for the panel itself: role, aria-label, onKeyDown, onPaste. */
  contentProps?: ModalContentProps
  children: React.ReactNode
}

export default function Dialog({ isOpen, onClose, title, footer, width = 480, initialFocusRef, contentProps, children }: DialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" initialFocusRef={initialFocusRef as React.RefObject<HTMLElement>}>
      <ModalOverlay bg="var(--c-modal-overlay)" backdropFilter="blur(2px)" />
      <ModalContent maxW={`min(${width}px, calc(100vw - 32px))`} overflow="hidden" {...contentProps}>
        {title === undefined ? children : (
          <>
            <ModalHeader px={5} pt="14px" pb="12px" fontSize="15px" lineHeight="20px">{title}</ModalHeader>
            <ModalCloseButton top="9px" right="10px" size="sm" borderRadius="6px" />
            <ModalBody px={5} pt={4} pb={5}>{children}</ModalBody>
            {footer && <ModalFooter px={5} py={3} gap={2}>{footer}</ModalFooter>}
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

/** Style for every text field, select and date field in a dialog. Use with `variant="unstyled"`. */
export const fieldStyle = {
  w: '100%',
  px: 3,
  bg: c.card,
  border: `1px solid ${c.borderStrong}`,
  borderRadius: '8px',
  fontSize: '14px',
  lineHeight: '20px',
  color: c.text,
  _focus: {
    borderColor: 'var(--c-focus-outline)',
    boxShadow: `0 0 0 3px ${c.accentSoft}`,
    outline: 'none',
  },
  _placeholder: { color: c.textMuted },
}

/** Height of a single-line field, and of the buttons that sit beside one. */
export const FIELD_HEIGHT = '36px'

export const fieldLabelStyle = {
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: '16px',
  color: c.textSecondary,
  mb: '6px',
}

/** A labelled group in a dialog body. Give the control inside its own `aria-label`. */
export function Field({ label, children, ...box }: { label: string; children: React.ReactNode } & BoxProps) {
  return (
    <Box mb={4} {...box}>
      <Text {...fieldLabelStyle}>{label}</Text>
      {children}
    </Box>
  )
}
