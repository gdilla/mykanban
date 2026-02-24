import React, { useState, useRef, useCallback } from 'react'
import { Text } from '@chakra-ui/react'
import { Task } from '../../state/types'
import { useApp } from '../../state/AppContext'

interface TaskTitleProps {
  task: Task
  onDoubleClick: () => void
}

export default function TaskTitle({ task, onDoubleClick }: TaskTitleProps) {
  const { dispatch } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const inputRef = useRef<HTMLSpanElement>(null)

  const startEdit = useCallback(() => {
    onDoubleClick()
    setIsEditing(true)
    setEditValue(task.title)
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
      <Text
        ref={inputRef}
        contentEditable
        suppressContentEditableWarning
        fontFamily="heading"
        fontWeight={600}
        fontSize="0.85rem"
        outline="2px solid"
        outlineColor="brand.doing"
        px={1}
        onBlur={() => finishEdit(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); finishEdit(true) }
          if (e.key === 'Escape') finishEdit(false)
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {editValue}
      </Text>
    )
  }

  return (
    <Text
      fontFamily="heading"
      fontWeight={600}
      fontSize="0.85rem"
      mb={1}
      onDoubleClick={(e) => { e.stopPropagation(); startEdit() }}
      cursor="text"
      noOfLines={2}
    >
      {task.title}
    </Text>
  )
}
