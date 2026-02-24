import React from 'react'
import { Flex, Heading, Button, Text } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'
import { colors as c } from '../../theme'

export default function Header() {
  const { state, dispatch } = useApp()

  return (
    <Flex as="header" align="center" justify="space-between" mb={6} pb={5} borderBottom={`1px solid ${c.border}`}>
      <Flex align="center" gap={5}>
        <Heading as="h1" fontFamily="heading" fontWeight={700} fontSize="1.8rem" letterSpacing="-0.02em" textTransform="uppercase" color={c.text}>
          Kanban
        </Heading>
        <Flex gap={1} align="center" flexWrap="wrap">
          {[
            ['↑↓←→', 'nav'],
            ['Enter', 'edit'],
            ['d', 'done'],
            ['⌘K', 'search'],
          ].map(([key, label]) => (
            <Flex key={key} align="center" gap={1}>
              <Text as="kbd" bg={c.card} border={`1px solid ${c.borderStrong}`} borderRadius="4px" px={1.5} py={0.5} fontSize="0.65rem" color={c.textSecondary} fontFamily="body">
                {key}
              </Text>
              <Text fontSize="0.65rem" color={c.textMuted} mr={2}>{label}</Text>
            </Flex>
          ))}
        </Flex>
      </Flex>

      <Flex gap={2} align="center">
        <Flex bg={c.surface} borderRadius="8px" border={`1px solid ${c.borderStrong}`} overflow="hidden">
          {(['status', 'tags'] as const).map(view => (
            <Button
              key={view}
              size="sm"
              bg={state.currentView === view ? c.accent : 'transparent'}
              color={state.currentView === view ? '#fff' : c.textSecondary}
              borderRadius="0"
              border="none"
              fontFamily="heading"
              fontWeight={600}
              fontSize="0.8rem"
              textTransform="uppercase"
              px={5}
              onClick={() => dispatch({ type: 'SET_VIEW', view })}
              _hover={{ bg: state.currentView === view ? c.accent : c.card }}
            >
              {view}
            </Button>
          ))}
        </Flex>
        <Button variant="brutalist-outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-tag-manager'))}>
          Tags
        </Button>
        <Button variant="brutalist-outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-summary-viewer'))}>
          Summaries
        </Button>
      </Flex>
    </Flex>
  )
}
