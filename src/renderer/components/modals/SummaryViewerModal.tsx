import React, { useState, useEffect, useRef } from 'react'
import { Button, Flex, Box, Text } from '@chakra-ui/react'
import { useIpc } from '../../hooks/useIpc'
import { colors as c } from '../../theme'
import { formatSummary, summaryDate, Block, Inline } from '../../utils/summary'
import Dialog from '../shared/Dialog'

const dateLabel = (filename: string) =>
  summaryDate(filename)?.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) ?? filename

export default function SummaryViewerModal() {
  const ipc = useIpc()
  const [isOpen, setIsOpen] = useState(false)
  const [summaries, setSummaries] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const doneRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = () => { setIsOpen(true); loadSummaries() }
    window.addEventListener('open-summary-viewer', handler)
    return () => window.removeEventListener('open-summary-viewer', handler)
  }, [])

  const selectSummary = async (filename: string) => {
    setSelectedFile(filename)
    setContent((await ipc.readSummary(filename)) || 'Could not load summary.')
  }

  // Newest first, and show the newest straight away (file names sort by date)
  const loadSummaries = async () => {
    const files: string[] = [...(await ipc.listSummaries())].sort().reverse()
    setSummaries(files)
    if (files.length) await selectSummary(files[0])
  }

  return (
    <Dialog
      isOpen={isOpen} onClose={() => setIsOpen(false)} title="Summaries" width={720} initialFocusRef={doneRef}
      footer={
        <>
          <Button variant="secondary" onClick={async () => { await ipc.generateSummary(); await loadSummaries() }}>Generate now</Button>
          <Button ref={doneRef} variant="primary" onClick={() => setIsOpen(false)}>Done</Button>
        </>
      }
    >
      {/* Two panes that scroll on their own, sized to fit the smallest window */}
      <Flex gap={4} h="min(440px, calc(100vh - 17rem))" minH="160px">
        <Box as="nav" aria-label="Summary dates" w="132px" flexShrink={0} overflowY="auto" ml="-8px" pr="4px">
          {summaries.map(file => {
            const isSelected = selectedFile === file
            return (
              <Box
                key={file} as="button" type="button" aria-current={isSelected || undefined}
                display="block" w="100%" textAlign="left" px="8px" h="28px" mb="2px" borderRadius="6px"
                fontSize="13px" fontWeight={isSelected ? 500 : 400} whiteSpace="nowrap"
                bg={isSelected ? c.card : 'transparent'}
                boxShadow={isSelected ? `inset 0 0 0 1px ${c.border}` : undefined}
                color={isSelected ? c.text : c.textSecondary}
                _hover={{ bg: isSelected ? c.card : c.cardHover, color: c.text }}
                onClick={() => selectSummary(file)}
              >
                {dateLabel(file)}
              </Box>
            )
          })}
          {summaries.length === 0 && <Text px="8px" fontSize="13px" color={c.textMuted}>No summaries yet</Text>}
        </Box>
        <Box flex={1} minW={0} overflowY="auto" pl={4} pr={2} borderLeft={`1px solid ${c.border}`}>
          {content
            ? formatSummary(content).map((block, i) => <SummaryBlock key={i} block={block} />)
            : <Text fontSize="13px" color={c.textMuted}>{summaries.length ? 'Select a date to read its summary.' : 'Generate one now, or wait for tonight’s.'}</Text>}
        </Box>
      </Flex>
    </Dialog>
  )
}

const inline = (parts: Inline[]) => parts.map((part, i) =>
  part.bold ? <Text as="strong" key={i} fontWeight={600} color={c.text}>{part.text}</Text> : part.text)

function SummaryBlock({ block }: { block: Block }) {
  const body = { fontSize: '13px', lineHeight: '20px', color: c.textSecondary, overflowWrap: 'anywhere' as const }
  switch (block.type) {
    case 'heading': {
      const style = [
        { fontSize: '16px', lineHeight: '22px', mb: '4px' },
        { fontSize: '14px', lineHeight: '20px', mt: '20px', mb: '6px' },
        { fontSize: '13px', lineHeight: '20px', mt: '12px', mb: '2px' },
      ][block.level - 1]
      return <Text as={`h${block.level + 1}` as 'h2'} fontWeight={600} color={c.text} {...style}>{block.text}</Text>
    }
    case 'list':
      return (
        <Box as="ul" pl="18px" mb="4px" {...body}>
          {block.items.map((item, i) => <Box as="li" key={i} py="1px">{inline(item)}</Box>)}
        </Box>
      )
    case 'rule':
      return <Box as="hr" my="16px" border="none" borderTop={`1px solid ${c.border}`} />
    case 'paragraph':
      return <Text mb="4px" {...body}>{inline(block.text)}</Text>
  }
}
