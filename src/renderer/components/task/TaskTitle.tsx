import React, { useRef } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { colors as c } from '../../theme'

const type = { fontFamily: 'body', fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.35 }

interface TaskTitleProps {
  title: string
  muted: boolean
  editing: boolean
  onStartEdit: () => void
  /** The new title, or null when the edit was cancelled. */
  onEndEdit: (title: string | null) => void
}

export default function TaskTitle({ title, muted, editing, onStartEdit, onEndEdit }: TaskTitleProps) {
  if (editing) return <TitleEditor title={title} onEnd={onEndEdit} />
  return (
    <Text
      className="task-title" {...type} color={muted ? c.textMuted : c.text}
      noOfLines={3} wordBreak="break-word"
      onDoubleClick={e => { e.stopPropagation(); onStartEdit() }}
    >
      {title}
    </Text>
  )
}

// The title, editable where it stands: same type, no box. Enter or leaving the field saves, Escape cancels.
function TitleEditor({ title, onEnd }: { title: string; onEnd: (title: string | null) => void }) {
  const ended = useRef(false) // Enter and Escape unmount the field, which blurs it: report once
  const end = (value: string | null) => {
    if (ended.current) return
    ended.current = true
    onEnd(value)
  }
  const fit = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  // The card around it is a drag handle and opens the edit window on click: keep the pointer to ourselves.
  const own = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <Box
      as="textarea" ref={fit} {...type} color={c.text}
      display="block" w="100%" p={0} m={0} rows={1} resize="none" overflow="hidden"
      bg="transparent" border="none" outline="none" boxShadow={`0 1px 0 ${c.accent}`}
      aria-label="Task title" defaultValue={title} autoFocus
      onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => e.currentTarget.select()}
      onInput={(e: React.FormEvent<HTMLTextAreaElement>) => fit(e.currentTarget)}
      onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => end(e.currentTarget.value)}
      onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.nativeEvent.isComposing) return
        if (e.key === 'Enter') { e.preventDefault(); end(e.currentTarget.value) }
        else if (e.key === 'Escape') end(null)
      }}
      onPointerDown={own} onClick={own} onDoubleClick={own}
    />
  )
}
