import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Input, Flex, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

export default function CommandPalette() {
  const { state, dispatch } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = state.tasks.filter(t => {
    if (!query.trim()) return false
    const q = query.toLowerCase()
    return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  }).slice(0, 10)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const handleSelect = useCallback((taskId: string) => {
    dispatch({ type: 'SET_EDITING_TASK', id: taskId })
    setIsOpen(false)
  }, [dispatch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false)
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, 0)) }
    else if (e.key === 'Enter' && results[selectedIndex]) handleSelect(results[selectedIndex].id)
  }

  if (!isOpen) return null

  return (
    <Box
      position="fixed" top={0} left={0} right={0} bottom={0}
      bg="rgba(13, 13, 26, 0.7)"
      zIndex={2000}
      display="flex"
      justifyContent="center"
      pt="15vh"
      onClick={() => setIsOpen(false)}
    >
      <Box
        bg={c.card}
        border={`3px solid ${c.borderStrong}`}
        boxShadow={`8px 8px 0 ${c.shadow}`}
        w="500px"
        maxH="400px"
        onClick={e => e.stopPropagation()}
      >
        <Input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks..."
          border="none"
          borderBottom={`2px solid ${c.borderStrong}`}
          borderRadius="0"
          p={4}
          fontFamily="body"
          fontSize="1rem"
          color={c.text}
          bg="transparent"
          _focus={{ boxShadow: 'none' }}
          _placeholder={{ color: c.textMuted }}
        />
        <Box maxH="300px" overflowY="auto">
          {results.map((task, i) => {
            const tag = task.tags.length > 0 ? state.tags.find(t => t.id === task.tags[0]) : null
            return (
              <Flex
                key={task.id}
                px={4} py={2}
                cursor="pointer"
                bg={i === selectedIndex ? c.surfaceHover : 'transparent'}
                _hover={{ bg: c.surfaceHover }}
                onClick={() => handleSelect(task.id)}
                align="center"
                gap={2}
              >
                <Text fontSize="0.75rem" color={c.textMuted} fontFamily="body" textTransform="uppercase" w="60px" flexShrink={0}>
                  {task.status}
                </Text>
                <Text fontSize="0.85rem" fontFamily="heading" fontWeight={600} flex={1} noOfLines={1} color={c.text}>
                  {task.title}
                </Text>
                {tag && (
                  <Box w="8px" h="8px" bg={tag.color} border={`1px solid ${c.borderStrong}`} flexShrink={0} />
                )}
              </Flex>
            )
          })}
          {query && results.length === 0 && (
            <Text p={4} fontSize="0.85rem" color={c.textMuted} fontFamily="body">
              No results found
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}
