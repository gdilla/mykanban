import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Textarea, TextareaProps, Button } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { useIpc, deleteFiles, deleteFilesAfterSave } from '../../hooks/useIpc'
import AttachmentGrid from '../shared/AttachmentGrid'
import Dialog, { Field, fieldStyle } from '../shared/Dialog'
import TagSelector from '../shared/TagSelector'
import StatusDueFields from './StatusDueFields'
import { Attachment, Task } from '../../state/types'
import { editedFields, filesToDelete } from '../../utils/editTask'

// A textarea that grows to show all of its text (Chromium 120 has no `field-sizing: content`).
function AutoGrowTextarea({ fieldRef, ...props }: TextareaProps & { fieldRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const fit = () => {
    const el = fieldRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
  }
  useLayoutEffect(fit, [props.value])
  useLayoutEffect(() => {
    const el = fieldRef.current
    if (!el) return
    el.setSelectionRange(el.value.length, el.value.length) // caret starts after the text, as in a single-line input
    // A narrower window re-wraps the text, so fit again when the width changes.
    let width = el.clientWidth
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== width) { width = el.clientWidth; fit() }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <Textarea ref={fieldRef} rows={1} minH="0" resize="none" overflow="hidden" {...props} />
}

export default function EditTaskModal() {
  const { state } = useApp()
  const task = state.editingTaskId && state.editingTaskId !== '__quick_add__'
    ? state.tasks.find(t => t.id === state.editingTaskId)
    : null
  // Mounted per task: the form is seeded once when the window opens, so data
  // reloaded from disk while it is open does not wipe what is being typed.
  return task ? <EditTaskForm key={task.id} task={task} /> : null
}

function EditTaskForm({ task }: { task: Task }) {
  const { state, dispatch } = useApp()
  const ipc = useIpc()
  // The task as it was when the window opened: edits and added/removed files are measured against it.
  const opened = useRef(task).current

  const [title, setTitle] = useState(opened.title)
  const [description, setDescription] = useState(opened.description || '')
  const [dueDate, setDueDate] = useState(opened.dueDate || '')
  const [status, setStatus] = useState(opened.status)
  const [selectedTags, setSelectedTags] = useState(opened.tags)
  const [attachments, setAttachments] = useState(opened.attachments)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const closed = useRef(false)

  // Every way out of the window ends here, once. Escape, an overlay click, the
  // close button and Cmd+Enter save; the Cancel button is the only discard.
  const commit = (outcome: 'save' | 'cancel') => {
    if (closed.current) return
    closed.current = true
    const unwanted = filesToDelete(opened.attachments, attachments, outcome)
    if (outcome === 'cancel') { deleteFiles(unwanted); return } // added here and never saved
    const updates = editedFields(
      opened,
      { title, description, dueDate, tags: selectedTags, attachments },
      state.tags.map(t => t.id),
    )
    if (Object.keys(updates).length) dispatch({ type: 'UPDATE_TASK', id: task.id, updates })
    if (status !== opened.status) dispatch({ type: 'MOVE_TASK', id: task.id, status })
    deleteFilesAfterSave(unwanted)
  }

  const close = (outcome: 'save' | 'cancel') => {
    commit(outcome)
    dispatch({ type: 'SET_EDITING_TASK', id: null })
  }

  // Being swapped out without closing (the quick-add hotkey replaces this
  // window) counts as closing it: save rather than drop the edits.
  const commitRef = useRef(commit)
  commitRef.current = commit
  useEffect(() => {
    closed.current = false // StrictMode runs this cleanup once on mount in dev
    return () => commitRef.current('save')
  }, [])

  const addAttachment = (attachment: Attachment) => {
    // The file finished saving after the window closed: nothing refers to it.
    if (closed.current) { deleteFiles([attachment.filename]); return }
    setAttachments(prev => [...prev, attachment])
  }

  const removeAttachment = (filename: string) => {
    setAttachments(prev => prev.filter(a => a.filename !== filename))
    // Added in this session, so no saved task refers to it: delete it now.
    if (!opened.attachments.some(a => a.filename === filename)) deleteFiles([filename])
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (!blob) continue
        const reader = new FileReader()
        reader.onload = async () => {
          const filename = await ipc.saveImage(reader.result as string)
          addAttachment({ filename, originalName: `pasted-image.${blob.type.split('/')[1]}`, type: blob.type })
        }
        reader.readAsDataURL(blob)
      }
    }
  }

  const handleFileAttach = (files: FileList) => {
    for (const file of Array.from(files)) {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const filename = await ipc.saveFile({ base64Data: base64, originalName: file.name, mimeType: file.type })
        addAttachment({ filename, originalName: file.name, type: file.type })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog
      isOpen onClose={() => close('save')} title="Edit task" width={520} initialFocusRef={titleRef}
      contentProps={{
        onPaste: handlePaste,
        onKeyDown: e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); close('save') }
        },
      }}
      footer={
        <>
          <Button variant="secondary" onClick={() => close('cancel')}>Cancel</Button>
          <Button variant="primary" onClick={() => close('save')}>Save changes</Button>
        </>
      }
    >
      <Field label="Title">
        <AutoGrowTextarea
          fieldRef={titleRef}
          aria-label="Title"
          value={title}
          onChange={e => setTitle(e.target.value.replace(/\n/g, ' '))}
          onKeyDown={e => {
            // A title is one line of text: Enter moves on to the description (Cmd+Enter saves).
            if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              descriptionRef.current?.focus()
            }
          }}
          variant="unstyled"
          py="7px"
          {...fieldStyle}
        />
      </Field>

      <Field label="Description">
        <Textarea
          ref={descriptionRef}
          aria-label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          variant="unstyled"
          py={2}
          minH="112px"
          resize="vertical"
          {...fieldStyle}
        />
      </Field>

      <AttachmentGrid attachments={attachments} onRemove={removeAttachment} onFileAttach={handleFileAttach} showAlways />

      <StatusDueFields status={status} onStatusChange={setStatus} dueDate={dueDate} onDueDateChange={setDueDate} />

      <Field label="Tags" mb={0}>
        <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
      </Field>
    </Dialog>
  )
}
