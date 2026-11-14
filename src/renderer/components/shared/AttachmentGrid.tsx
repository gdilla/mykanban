import React, { useEffect, useState, useRef } from 'react'
import { Box, Button, Flex, Image, Text } from '@chakra-ui/react'
import { Paperclip, X } from 'lucide-react'
import { Attachment } from '../../state/types'
import { useIpc } from '../../hooks/useIpc'
import { colors as c } from '../../theme'
import { Field } from './Dialog'

interface AttachmentGridProps {
  attachments: Attachment[]
  onRemove: (filename: string) => void
  onFileAttach: (files: FileList) => void
  showAlways?: boolean
}

export default function AttachmentGrid({ attachments, onRemove, onFileAttach, showAlways }: AttachmentGridProps) {
  const ipc = useIpc()
  // Per filename: a data URI once an image has loaded, null when the file is
  // missing on disk, '' when it is there but cannot be shown as an image.
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    attachments.forEach(async (att) => {
      if (!att.type.startsWith('image/') || att.filename in thumbnails) return
      const data = await ipc.loadImage(att.filename).catch(() => null)
      setThumbnails(prev => ({ ...prev, [att.filename]: data }))
    })
  }, [attachments])

  const open = async (filename: string) => {
    const error = await ipc.openAttachment(filename)
    if (error === 'File not found') setThumbnails(prev => ({ ...prev, [filename]: null }))
    else if (error) console.error(`Could not open ${filename}: ${error}`)
  }

  if (attachments.length === 0 && !showAlways) return null

  return (
    <Field label="Attachments">
      {attachments.length > 0 && (
        <Flex gap={2} flexWrap="wrap" mb={2}>
          {attachments.map(att => {
            const thumbnail = thumbnails[att.filename]
            return (
              <Box key={att.filename} position="relative">
                <Box
                  as="button"
                  type="button"
                  display="block"
                  cursor="pointer"
                  borderRadius="8px"
                  overflow="hidden"
                  border={`1px solid ${c.borderStrong}`}
                  _hover={{ borderColor: c.borderAccent }}
                  title={`Open ${att.originalName}`}
                  onClick={() => open(att.filename)}
                >
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={att.originalName}
                      w="72px" h="72px" objectFit="cover"
                      onError={() => setThumbnails(prev => ({ ...prev, [att.filename]: '' }))}
                    />
                  ) : (
                    <Flex w="72px" h="72px" direction="column" align="center" justify="center" gap="2px" bg={c.card}>
                      <Text fontSize="11px" lineHeight="14px" textAlign="center" px={1} color={c.textSecondary} wordBreak="break-all" noOfLines={3}>
                        {att.originalName}
                      </Text>
                      {thumbnail === null && (
                        <Text fontSize="11px" lineHeight="14px" fontWeight={500} color={c.dangerText}>Missing</Text>
                      )}
                    </Flex>
                  )}
                </Box>
                <Box
                  as="button"
                  type="button"
                  aria-label={`Remove ${att.originalName}`}
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  bg={c.surface}
                  color={c.textSecondary}
                  border={`1px solid ${c.borderStrong}`}
                  borderRadius="full"
                  w="18px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  _hover={{ color: c.dangerText, borderColor: c.borderAccent }}
                  onClick={() => {
                    onRemove(att.filename)
                    // This button is about to disappear; without a new home, focus falls to
                    // <body> and the window stops hearing Escape and Cmd+Enter.
                    attachButtonRef.current?.focus()
                  }}
                >
                  <X size={11} strokeWidth={2.5} />
                </Box>
              </Box>
            )
          })}
        </Flex>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && onFileAttach(e.target.files)}
      />
      <Button
        ref={attachButtonRef}
        variant="secondary"
        size="sm"
        h="28px"
        leftIcon={<Paperclip size={13} />}
        onClick={() => fileInputRef.current?.click()}
      >
        Attach files
      </Button>
    </Field>
  )
}
