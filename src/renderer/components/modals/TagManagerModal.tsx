import React, { useState, useEffect, useRef } from 'react'
import { Input, Button, Flex, Box, Text } from '@chakra-ui/react'
import { Pencil, Trash2, Pipette } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { Tag } from '../../state/types'
import { colors as c } from '../../theme'
import { TAG_COLORS, tagNameError, nextTagColor } from '../../utils/tags'
import Dialog, { Field, fieldStyle, FIELD_HEIGHT } from '../shared/Dialog'
import ConfirmDialog from '../shared/ConfirmDialog'
import TagChip from '../shared/TagChip'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
}

const PRESETS = Object.entries(TAG_COLORS)

export default function TagManagerModal() {
  const { state, dispatch } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Tag | null>(null)
  const newNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = () => { setEditingId(null); setIsOpen(true) }
    window.addEventListener('open-tag-manager', handler)
    return () => window.removeEventListener('open-tag-manager', handler)
  }, [])

  // The edit form is about to unmount with the focus inside it: give focus a home in the window.
  const stopEditing = () => { setEditingId(null); newNameRef.current?.focus() }

  const usedBy = (tagId: string) => state.tasks.filter(t => t.tags.includes(tagId)).length
  const tasks = (n: number) => `${n} ${n === 1 ? 'task' : 'tasks'}`
  const deletingCount = deleting ? usedBy(deleting.id) : 0

  return (
    <Dialog
      isOpen={isOpen} onClose={() => setIsOpen(false)} title="Manage tags" width={460} initialFocusRef={newNameRef}
      footer={<Button variant="primary" onClick={() => setIsOpen(false)}>Done</Button>}
    >
      <Box mx="-8px" mb={4}>
        {state.tags.map(tag => editingId === tag.id ? (
          <Box key={tag.id} p="8px" my="2px" bg={c.card} borderRadius="8px">
            <TagForm
              tag={tag}
              submitLabel="Save"
              onSubmit={updates => { dispatch({ type: 'UPDATE_TAG', id: tag.id, updates }); stopEditing() }}
              onCancel={stopEditing}
            />
          </Box>
        ) : (
          <Flex key={tag.id} align="center" gap={2} h="36px" px="8px" borderRadius="8px" _hover={{ bg: c.card }}>
            <Box
              as="button" type="button" display="flex" minW={0} cursor="pointer" borderRadius="full"
              title="Rename or recolour" onClick={() => setEditingId(tag.id)}
            >
              <TagChip name={tag.name} color={tag.color} />
            </Box>
            <Text flex={1} fontSize="12px" color={c.textMuted} whiteSpace="nowrap">{tasks(usedBy(tag.id))}</Text>
            <RowButton label={`Edit ${tag.name}`} onClick={() => setEditingId(tag.id)}><Pencil size={14} /></RowButton>
            <RowButton label={`Delete ${tag.name}`} onClick={() => setDeleting(tag)} danger><Trash2 size={14} /></RowButton>
          </Flex>
        ))}
        {state.tags.length === 0 && (
          <Text px="8px" fontSize="13px" color={c.textMuted}>No tags yet. Add your first one below.</Text>
        )}
      </Box>

      <Field label="New tag" mb={0} pt={4} borderTop={`1px solid ${c.border}`}>
        <TagForm
          tag={{ name: '', color: nextTagColor(state.tags) }}
          inputRef={newNameRef}
          submitLabel="Add"
          onSubmit={tag => dispatch({ type: 'ADD_TAG', tag: { id: generateId(), ...tag } })}
        />
      </Field>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: 'DELETE_TAG', id: deleting.id })}
        title={`Delete “${deleting?.name}”?`}
        message={deletingCount
          ? `This tag is on ${tasks(deletingCount)}. Deleting it removes the tag from ${deletingCount === 1 ? 'that task' : 'those tasks'}; the tasks themselves stay.`
          : 'No tasks use this tag.'}
        confirmLabel="Delete tag"
      />
    </Dialog>
  )
}

function RowButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <Box
      as="button" type="button" aria-label={label} title={label} onClick={onClick}
      display="flex" alignItems="center" justifyContent="center" flexShrink={0}
      w="28px" h="28px" borderRadius="6px" color={c.textSecondary} cursor="pointer"
      _hover={{ bg: c.cardHover, color: danger ? c.dangerText : c.text }}
    >
      {children}
    </Box>
  )
}

interface TagFormProps {
  /** The tag being edited, or the blank starting point for a new one. */
  tag: { id?: string; name: string; color: string }
  submitLabel: string
  onSubmit: (tag: { name: string; color: string }) => void
  /** Present when editing: Escape and the Cancel button call it. */
  onCancel?: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

// Name field plus colour swatches: the same form adds a tag and edits one.
function TagForm({ tag, submitLabel, onSubmit, onCancel, inputRef }: TagFormProps) {
  const { state } = useApp()
  const [name, setName] = useState(tag.name)
  const [color, setColor] = useState(tag.color)
  const [error, setError] = useState<string | null>(null)
  const isCustom = !PRESETS.some(([, value]) => value === color)

  const submit = () => {
    const problem = tagNameError(name, state.tags, tag.id)
    setError(problem)
    if (problem) return
    onSubmit({ name: name.trim(), color })
    if (!onCancel) {
      // Adding: stay open, blank, with the next unused colour, ready for another tag
      setName('')
      setColor(nextTagColor([...state.tags, { id: '', name, color }]))
    }
  }

  // Two rings: a gap in the row's own colour, then the swatch colour
  const ring = (swatch: string) => `0 0 0 2px ${onCancel ? c.card : c.surface}, 0 0 0 4px ${swatch}`

  return (
    <Box>
      <Flex gap={2} align="center">
        <Input
          ref={inputRef}
          autoFocus={!!onCancel}
          aria-label="Tag name"
          aria-invalid={!!error}
          value={name}
          onChange={e => { setName(e.target.value); setError(null) }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); submit() }
            // Escape cancels the rename, not the whole window
            else if (e.key === 'Escape' && onCancel) { e.stopPropagation(); onCancel() }
          }}
          placeholder="Tag name"
          variant="unstyled"
          flex={1}
          h={FIELD_HEIGHT}
          {...fieldStyle}
          bg={onCancel ? c.surface : c.card}
        />
        {onCancel && <Button variant="secondary" h={FIELD_HEIGHT} onClick={onCancel}>Cancel</Button>}
        <Button variant="primary" h={FIELD_HEIGHT} onClick={submit}>{submitLabel}</Button>
      </Flex>

      {error && <Text role="alert" mt="6px" fontSize="12px" color={c.dangerText}>{error}</Text>}

      <Flex role="radiogroup" aria-label="Colour" gap="10px" align="center" mt="12px" px="4px" flexWrap="wrap">
        {PRESETS.map(([label, value]) => (
          <Box
            key={value} as="button" type="button" role="radio" aria-checked={color === value} aria-label={label} title={label}
            w="18px" h="18px" borderRadius="full" bg={value} cursor="pointer" flexShrink={0}
            boxShadow={color === value ? ring(value) : undefined}
            onClick={() => setColor(value)}
          />
        ))}
        {/* Custom colour: the native picker, drawn as one more swatch */}
        <Flex
          as="label" title="Custom colour"
          position="relative" align="center" justify="center" flexShrink={0}
          w="18px" h="18px" borderRadius="full" cursor="pointer"
          color={c.textSecondary}
          bg={isCustom ? color : 'transparent'}
          border={isCustom ? undefined : `1px dashed ${c.borderAccent}`}
          boxShadow={isCustom ? ring(color) : undefined}
          _hover={{ color: c.text }}
        >
          {!isCustom && <Pipette size={10} />}
          <input
            type="color" aria-label="Custom colour" value={color} onChange={e => setColor(e.target.value)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
          />
        </Flex>
      </Flex>
    </Box>
  )
}
