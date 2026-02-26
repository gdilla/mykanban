import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Box, Input, Flex, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

export default function CommandPalette() {
  const { state, dispatch } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const recentTasks = useMemo(() =>
    [...state.tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [state.tasks]
  )

  const results = query.trim()
    ? state.tasks.filter(t => {
        const q = query.toLowerCase()
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      }).slice(0, 10)
    : recentTasks

  const showLabel = !query.trim() && results.length > 0

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setIsOpen(prev => !prev); setQuery(''); setSelectedIndex(0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50) }, [isOpen])

  const handleSelect = useCallback((taskId: string) => {
    dispatch({ type: 'SET_EDITING_TASK', id: taskId }); setIsOpen(false)
  }, [dispatch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false)
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, 0)) }
    else if (e.key === 'Enter' && results[selectedIndex]) handleSelect(results[selectedIndex].id)
  }

  if (!isOpen) return null

  return (
    <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="rgba(0,0,0,0.6)"
      zIndex={2000} display="flex" justifyContent="center" pt="15vh" onClick={() => setIsOpen(false)}>
      <Box bg={c.surface} border={`1px solid ${c.borderStrong}`} borderRadius="12px"
        boxShadow="0 24px 48px rgba(0,0,0,0.5)" w="520px" maxH="400px" overflow="hidden"
        onClick={e => e.stopPropagation()}>
        <Input ref={inputRef} value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
          onKeyDown={handleKeyDown} placeholder="Search tasks..."
          border="none" borderBottom={`1px solid ${c.border}`} borderRadius="0"
          p={4} fontFamily="body" fontSize="0.95rem" color={c.text} bg="transparent"
          _focus={{ boxShadow: 'none' }} _placeholder={{ color: c.textMuted }} />
        <Box maxH="300px" overflowY="auto">
          {showLabel && (
            <Text px={4} pt={3} pb={1} fontSize="0.65rem" fontFamily="heading" fontWeight={700}
              textTransform="uppercase" letterSpacing="0.1em" color={c.textMuted}>
              Recent
            </Text>
          )}
          {results.map((task, i) => {
            const tag = task.tags.length > 0 ? state.tags.find(t => t.id === task.tags[0]) : null
            return (
              <Flex key={task.id} px={4} py="10px" cursor="pointer" align="center" gap={3}
                bg={i === selectedIndex ? c.card : 'transparent'} _hover={{ bg: c.card }}
                onClick={() => handleSelect(task.id)}>
                <Text fontSize="0.7rem" color={
                  task.status === 'todo' ? c.todo : task.status === 'doing' ? c.doing : c.done
                } fontFamily="mono" fontWeight={600} textTransform="uppercase" w="50px" flexShrink={0}>
                  {task.status === 'doing' ? 'wip' : task.status}
                </Text>
                <Text fontSize="0.85rem" fontFamily="body" fontWeight={500} flex={1} noOfLines={1} color={c.text}>
                  {task.title}
                </Text>
                {tag && <Box w="8px" h="8px" borderRadius="2px" bg={tag.color} flexShrink={0} />}
              </Flex>
            )
          })}
          {query && results.length === 0 && (
            <Text p={4} fontSize="0.85rem" color={c.textMuted} fontFamily="body">No results</Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}
