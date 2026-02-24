import React from 'react'
import { Flex, Heading, Box, Button, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

export default function Header() {
  const { state, dispatch } = useApp()

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      mb={8}
      pb={6}
      borderBottom={`3px solid ${c.borderStrong}`}
    >
      <Flex align="center" gap={6}>
        <Heading
          as="h1"
          fontFamily="heading"
          fontWeight={700}
          fontSize="2.5rem"
          letterSpacing="-0.02em"
          textTransform="uppercase"
          color={c.text}
        >
          Kanban
        </Heading>
        <Text fontSize="0.75rem" color={c.textMuted} fontFamily="body">
          <Text as="kbd" bg={c.surface} border={`1px solid ${c.border}`} borderRadius="3px" px={1.5} py={0.5} fontSize="0.7rem" boxShadow={`0 1px 0 ${c.border}`} color={c.textSecondary}>↑↓←→</Text> nav{' · '}
          <Text as="kbd" bg={c.surface} border={`1px solid ${c.border}`} borderRadius="3px" px={1.5} py={0.5} fontSize="0.7rem" boxShadow={`0 1px 0 ${c.border}`} color={c.textSecondary}>Enter</Text> edit{' · '}
          <Text as="kbd" bg={c.surface} border={`1px solid ${c.border}`} borderRadius="3px" px={1.5} py={0.5} fontSize="0.7rem" boxShadow={`0 1px 0 ${c.border}`} color={c.textSecondary}>d</Text> done{' · '}
          <Text as="kbd" bg={c.surface} border={`1px solid ${c.border}`} borderRadius="3px" px={1.5} py={0.5} fontSize="0.7rem" boxShadow={`0 1px 0 ${c.border}`} color={c.textSecondary}>⌘K</Text> search
        </Text>
      </Flex>

      <Flex gap={0} align="center">
        <Flex mr={4}>
          <Button
            size="md"
            bg={state.currentView === 'status' ? c.accent : c.surface}
            color={state.currentView === 'status' ? '#fff' : c.text}
            border={`2px solid ${c.borderStrong}`}
            borderRight="none"
            borderRadius="0"
            fontFamily="heading"
            fontWeight={500}
            fontSize="0.85rem"
            textTransform="uppercase"
            letterSpacing="0.05em"
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'status' })}
            _hover={{ bg: state.currentView === 'status' ? c.accent : c.surfaceHover }}
          >
            Status
          </Button>
          <Button
            size="md"
            bg={state.currentView === 'tags' ? c.accent : c.surface}
            color={state.currentView === 'tags' ? '#fff' : c.text}
            border={`2px solid ${c.borderStrong}`}
            borderRadius="0"
            fontFamily="heading"
            fontWeight={500}
            fontSize="0.85rem"
            textTransform="uppercase"
            letterSpacing="0.05em"
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'tags' })}
            _hover={{ bg: state.currentView === 'tags' ? c.accent : c.surfaceHover }}
          >
            Tags
          </Button>
        </Flex>

        <Button variant="brutalist-outline" size="md" mr={3}
          onClick={() => window.dispatchEvent(new CustomEvent('open-tag-manager'))}>
          Manage Tags
        </Button>
        <Button variant="brutalist-outline" size="md"
          onClick={() => window.dispatchEvent(new CustomEvent('open-summary-viewer'))}>
          Summaries
        </Button>
      </Flex>
    </Flex>
  )
}
