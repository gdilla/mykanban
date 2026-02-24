import React, { useState, useRef, useCallback } from 'react'
import { Text, Box } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

interface TaskTitleProps {
  task: Task
  onDoubleClick: () => void
}

export default function TaskTitle({ task, onDoubleClick }: TaskTitleProps) {
  const { dispatch } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLSpanElement>(null)

  const startEdit = useCallback(() => {
    onDoubleClick()
    setIsEditing(true)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const range = document.createRange()
        range.selectNodeContents(inputRef.current)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
      }
    }, 0)
  }, [task.title, onDoubleClick])

  const finishEdit = (save: boolean) => {
    setIsEditing(false)
    if (save && inputRef.current) {
      const newTitle = inputRef.current.textContent?.trim() || ''
      if (newTitle && newTitle !== task.title) {
        dispatch({ type: 'UPDATE_TASK', id: task.id, updates: { title: newTitle } })
      }
    }
  }

  if (isEditing) {
    return (
      <Box
        ref={inputRef}
        as="span"
        contentEditable
        suppressContentEditableWarning
        fontFamily="body"
        fontWeight={500}
        fontSize="0.9rem"
        lineHeight="1.5"
        color={c.text}
        display="block"
        outline={`2px solid ${c.accent}`}
        outlineOffset="2px"
        bg={c.bg}
        px={1}
        py="2px"
        cursor="text"
        minH="1.5em"
        onBlur={() => finishEdit(true)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') { e.preventDefault(); finishEdit(true) }
          if (e.key === 'Escape') finishEdit(false)
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {task.title}
      </Box>
    )
  }

  return (
    <Text
      fontFamily="body"
      fontWeight={500}
      fontSize="0.9rem"
      lineHeight="1.5"
      color={c.text}
      wordBreak="break-word"
      onDoubleClick={(e) => { e.stopPropagation(); startEdit() }}
      cursor="pointer"
    >
      {task.title}
    </Text>
  )
}
