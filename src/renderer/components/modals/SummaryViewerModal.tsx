import React, { useState, useEffect } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, Flex, Box, Text, VStack,
} from '@chakra-ui/react'
import { useIpc } from '../../hooks/useIpc'
import { colors as c } from '../../theme'

export default function SummaryViewerModal() {
  const ipc = useIpc()
  const [isOpen, setIsOpen] = useState(false)
  const [summaries, setSummaries] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    const handler = () => { setIsOpen(true); loadSummaries() }
    window.addEventListener('open-summary-viewer', handler)
    return () => window.removeEventListener('open-summary-viewer', handler)
  }, [])

  const loadSummaries = async () => setSummaries(await ipc.listSummaries())

  const selectSummary = async (filename: string) => {
    setSelectedFile(filename)
    setContent((await ipc.readSummary(filename)) || 'Could not load summary.')
  }

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
      <ModalOverlay bg="rgba(13, 13, 26, 0.85)" />
      <ModalContent maxW="700px" bg={c.surface} color={c.text}>
        <ModalHeader>Historical Summaries</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex gap={4} minH="300px">
            <VStack align="stretch" w="180px" flexShrink={0} borderRight={`1px dashed ${c.border}`} pr={3} overflowY="auto" maxH="400px">
              {summaries.map(file => (
                <Text
                  key={file} fontSize="0.8rem" fontFamily="body" cursor="pointer" p={1}
                  bg={selectedFile === file ? c.accent : 'transparent'}
                  color={selectedFile === file ? '#fff' : c.textSecondary}
                  onClick={() => selectSummary(file)}
                  _hover={{ bg: selectedFile === file ? c.accent : c.cardHover }}
                >
                  {file.replace('summary-', '').replace('.md', '')}
                </Text>
              ))}
              {summaries.length === 0 && <Text fontSize="0.8rem" color={c.textMuted}>No summaries yet</Text>}
            </VStack>
            <Box flex={1} overflowY="auto" maxH="400px">
              <Text fontSize="0.8rem" fontFamily="body" whiteSpace="pre-wrap" color={content ? c.text : c.textMuted}>
                {content || 'Select a summary to view'}
              </Text>
            </Box>
          </Flex>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button size="sm" variant="brutalist-outline" onClick={async () => { await ipc.generateSummary(); await loadSummaries() }}>Generate Now</Button>
          <Button variant="brutalist-outline" onClick={() => setIsOpen(false)}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
