import React, { useEffect, useState, useRef } from 'react'
import { Box, Flex, Image, Text, IconButton, Button } from '@chakra-ui/react'
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
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    attachments.forEach(async (att) => {
      if (att.type.startsWith('image/') && !thumbnails[att.filename]) {
        const data = await ipc.loadImage(att.filename)
        if (data) setThumbnails(prev => ({ ...prev, [att.filename]: data }))
      }
    })
  }, [attachments])

  if (attachments.length === 0 && !showAlways) return null

  return (
    <Box mb={5}>
      <Text fontFamily="heading" fontWeight={500} color={c.textSecondary} mb={2} fontSize="0.85rem" textTransform="uppercase" letterSpacing="0.05em">
        Attachments
      </Text>
      {attachments.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {attachments.map(att => (
            <Box key={att.filename} position="relative" border={`2px solid ${c.borderStrong}`} p={1}>
              {att.type.startsWith('image/') && thumbnails[att.filename] ? (
                <Image src={thumbnails[att.filename]} alt={att.originalName} w="80px" h="80px" objectFit="cover" />
              ) : (
                <Flex w="80px" h="80px" align="center" justify="center" bg={c.bg}>
                  <Text fontSize="0.6rem" fontFamily="body" textAlign="center" px={1} color={c.textSecondary}>
                    {att.originalName}
                  </Text>
                </Flex>
              )}
              <Box
                as="button"
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
                onClick={() => onRemove(att.filename)}
              >
                ✕
              </Box>
            </Box>
          ))}
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
