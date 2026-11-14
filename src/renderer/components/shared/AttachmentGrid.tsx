import React, { useEffect, useState, useRef } from 'react'
import { Box, Flex, Image, Text } from '@chakra-ui/react'
import { Attachment } from '../../state/types'
import { useIpc } from '../../hooks/useIpc'
import { colors as c } from '../../theme'

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
    <Box mb={5}>
      <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">
        Attachments
      </Text>
      {attachments.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {attachments.map(att => {
            const thumbnail = thumbnails[att.filename]
            return (
              <Box key={att.filename} position="relative" border={`2px solid ${c.borderStrong}`} p={1}>
                <Box
                  as="button"
                  type="button"
                  display="block"
                  cursor="pointer"
                  title={`Open ${att.originalName}`}
                  onClick={() => open(att.filename)}
                >
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={att.originalName}
                      w="80px" h="80px" objectFit="cover"
                      onError={() => setThumbnails(prev => ({ ...prev, [att.filename]: '' }))}
                    />
                  ) : (
                    <Flex w="80px" h="80px" direction="column" align="center" justify="center" bg={c.bg}>
                      <Text fontSize="0.6rem" fontFamily="body" textAlign="center" px={1} color={c.textSecondary} wordBreak="break-all" noOfLines={3}>
                        {att.originalName}
                      </Text>
                      {thumbnail === null && (
                        <Text fontSize="0.6rem" fontFamily="body" color={c.danger}>missing</Text>
                      )}
                    </Flex>
                  )}
                </Box>
                <Box
                  as="button"
                  type="button"
                  aria-label={`Remove ${att.originalName}`}
                  position="absolute"
                  top={-1}
                  right={-1}
                  bg={c.danger}
                  color="white"
                  borderRadius="full"
                  w="16px"
                  h="16px"
                  fontSize="8px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={() => {
                    onRemove(att.filename)
                    // This button is about to disappear; without a new home, focus falls to
                    // <body> and the window stops hearing Escape and Cmd+Enter.
                    attachButtonRef.current?.focus()
                  }}
                >
                  ✕
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
      <Box
        as="button"
        ref={attachButtonRef}
        mt={2}
        fontFamily="heading"
        fontSize="0.75rem"
        color={c.textSecondary}
        cursor="pointer"
        _hover={{ color: c.text }}
        onClick={() => fileInputRef.current?.click()}
      >
        + Attach files
      </Box>
    </Box>
  )
}
