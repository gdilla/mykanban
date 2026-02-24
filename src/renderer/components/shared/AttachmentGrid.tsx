import React, { useEffect, useState, useRef } from 'react'
import { Box, Flex, Image, Text, IconButton, Button, FormControl, FormLabel } from '@chakra-ui/react'
import { Attachment } from '../../state/types'
import { useIpc } from '../../hooks/useIpc'

interface AttachmentGridProps {
  attachments: Attachment[]
  onRemove: (filename: string) => void
  onFileAttach: (files: FileList) => void
}

export default function AttachmentGrid({ attachments, onRemove, onFileAttach }: AttachmentGridProps) {
  const ipc = useIpc()
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    attachments.forEach(async (att) => {
      if (att.type.startsWith('image/') && !thumbnails[att.filename]) {
        const data = await ipc.loadImage(att.filename)
        if (data) {
          setThumbnails(prev => ({ ...prev, [att.filename]: data }))
        }
      }
    })
  }, [attachments])

  if (attachments.length === 0) return null

  return (
    <FormControl mb={4}>
      <FormLabel fontFamily="heading" fontSize="0.85rem" textTransform="uppercase">
        Attachments
      </FormLabel>
      <Flex gap={2} flexWrap="wrap">
        {attachments.map(att => (
          <Box
            key={att.filename}
            position="relative"
            border="2px solid"
            borderColor="brand.shadow"
            p={1}
          >
            {att.type.startsWith('image/') && thumbnails[att.filename] ? (
              <Image
                src={thumbnails[att.filename]}
                alt={att.originalName}
                w="80px"
                h="80px"
                objectFit="cover"
              />
            ) : (
              <Flex
                w="80px"
                h="80px"
                align="center"
                justify="center"
                bg="brand.bg"
              >
                <Text fontSize="0.6rem" fontFamily="body" textAlign="center" px={1}>
                  {att.originalName}
                </Text>
              </Flex>
            )}
            <IconButton
              aria-label="Remove attachment"
              size="xs"
              position="absolute"
              top={-1}
              right={-1}
              bg="brand.accent"
              color="white"
              borderRadius="full"
              minW="16px"
              h="16px"
              fontSize="8px"
              onClick={() => onRemove(att.filename)}
              icon={<Text>✕</Text>}
            />
          </Box>
        ))}
      </Flex>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && onFileAttach(e.target.files)}
      />
      <Button
        size="xs"
        variant="ghost"
        mt={2}
        fontFamily="heading"
        color="brand.textSecondary"
        onClick={() => fileInputRef.current?.click()}
      >
        + Attach files
      </Button>
    </FormControl>
  )
}
