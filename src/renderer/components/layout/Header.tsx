import React, { useState } from 'react'
import { Flex, Heading, ButtonGroup, Button, Text, Tooltip } from '@chakra-ui/react'
import { useApp } from '../../state/AppContext'

export default function Header() {
  const { state, dispatch } = useApp()
  const [showTagManager, setShowTagManager] = useState(false)

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      mb={4}
      pb={4}
      borderBottom="2px solid"
      borderColor="brand.shadow"
    >
      <Flex align="center" gap={4}>
        <Heading
          as="h1"
          size="lg"
          fontFamily="heading"
          textTransform="uppercase"
          letterSpacing="0.1em"
        >
          Kanban
        </Heading>
        <Text fontSize="xs" color="brand.textSecondary" fontFamily="body">
          ↑↓←→ navigate · Enter edit · d done · x delete · ⌘K search · ⌘T quick add
        </Text>
      </Flex>

      <Flex gap={3}>
        <ButtonGroup size="sm" isAttached>
          <Button
            variant={state.currentView === 'status' ? 'brutalist' : 'brutalist-outline'}
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'status' })}
          >
            Status
          </Button>
          <Button
            variant={state.currentView === 'tags' ? 'brutalist' : 'brutalist-outline'}
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'tags' })}
          >
            Tags
          </Button>
        </ButtonGroup>
        <Button
          size="sm"
          variant="brutalist-outline"
          onClick={() => {
            const event = new CustomEvent('open-tag-manager')
            window.dispatchEvent(event)
          }}
        >
          Manage Tags
        </Button>
        <Button
          size="sm"
          variant="brutalist-outline"
          onClick={() => {
            const event = new CustomEvent('open-summary-viewer')
            window.dispatchEvent(event)
          }}
        >
          Summaries
        </Button>
      </Flex>
    </Flex>
  )
}
