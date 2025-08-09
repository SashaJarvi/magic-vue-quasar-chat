import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { WS_PORT } from 'src/constants'
import type { IncomingMessage } from 'src/types/chat'
import type { ConnectionStatus, WebSocketConfig } from 'src/types/websocket'

export const useWebSocketStore = defineStore('websocket', () => {
  const connection = ref<WebSocket | null>(null)
  const status = ref<ConnectionStatus>('disconnected')
  const lastError = ref<string | null>(null)
  const reconnectAttempts = ref(0)
  const messageQueue = ref<string[]>([])

  let reconnectTimer: NodeJS.Timeout | null = null

  const config = ref<WebSocketConfig>({
    url: `ws://localhost:${WS_PORT}`,
    reconnectInterval: 2000,
    maxReconnectAttempts: 10,
    reconnectDecay: 1.5
  })

  // Event listeners
  const messageListeners = ref<Set<(data: IncomingMessage) => void>>(new Set())
  const statusListeners = ref<Set<(status: ConnectionStatus) => void>>(new Set())

  const isConnected = computed(() => status.value === 'connected')
  const canReconnect = computed(() => reconnectAttempts.value < config.value.maxReconnectAttempts)

  const clearTimers = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const setStatus = (newStatus: ConnectionStatus) => {
    if (status.value !== newStatus) {
      status.value = newStatus
      statusListeners.value.forEach((listener) => listener(newStatus))
    }
  }

  const processMessageQueue = () => {
    if (!isConnected.value || messageQueue.value.length === 0) return

    const messages = [...messageQueue.value]
    messageQueue.value = []

    messages.forEach((message) => {
      if (connection.value?.readyState === WebSocket.OPEN) {
        connection.value.send(message)
      } else {
        // Put back in queue if connection lost
        messageQueue.value.push(message)
      }
    })
  }

  const calculateReconnectDelay = (): number => {
    return Math.min(
      config.value.reconnectInterval * Math.pow(config.value.reconnectDecay, reconnectAttempts.value),
      30000 // Max 30 seconds
    )
  }

  const connect = (url?: string) => {
    if (connection.value?.readyState === WebSocket.CONNECTING) {
      return
    }

    if (url) {
      config.value.url = url
    }

    disconnect()
    clearTimers()

    setStatus('connecting')
    lastError.value = null

    try {
      connection.value = new WebSocket(config.value.url)

      connection.value.onopen = () => {
        console.log('WebSocket connected')
        setStatus('connected')
        reconnectAttempts.value = 0
        processMessageQueue()
      }

      connection.value.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        clearTimers()

        if (!event.wasClean && canReconnect.value) {
          setStatus('reconnecting')
          scheduleReconnect()
        } else {
          setStatus('disconnected')
        }
      }

      connection.value.onerror = (error) => {
        console.error('WebSocket error:', error)
        lastError.value = 'Connection error occurred'
        setStatus('error')
      }

      connection.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Notify listeners
          messageListeners.value.forEach((listener) => listener(data))
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      lastError.value = 'Failed to create connection'
      setStatus('error')
    }
  }

  const disconnect = () => {
    clearTimers()

    if (connection.value) {
      connection.value.close(1000, 'Client disconnect')
      connection.value = null
    }

    setStatus('disconnected')
    reconnectAttempts.value = 0
  }

  function scheduleReconnect() {
    if (!canReconnect.value) {
      console.error('Max reconnection attempts reached')
      setStatus('error')
      return
    }

    const delay = calculateReconnectDelay()
    reconnectAttempts.value++

    console.log(
      `Scheduling reconnection attempt ${reconnectAttempts.value}/${config.value.maxReconnectAttempts} in ${delay}ms`
    )

    reconnectTimer = setTimeout(() => {
      connect()
    }, delay)
  }

  const send = (data: unknown) => {
    const message = JSON.stringify(data)

    if (isConnected.value && connection.value?.readyState === WebSocket.OPEN) {
      connection.value.send(message)
    } else {
      messageQueue.value.push(message)
      console.log('Message queued (connection not ready):', data)
    }
  }

  const forceReconnect = () => {
    reconnectAttempts.value = 0
    if (connection.value) {
      connection.value.close()
    } else {
      connect()
    }
  }

  // Event subscription methods
  const onMessage = (callback: (data: IncomingMessage) => void) => {
    messageListeners.value.add(callback)

    // Return unsubscribe function
    return () => {
      messageListeners.value.delete(callback)
    }
  }

  const onStatusChange = (callback: (status: ConnectionStatus) => void) => {
    statusListeners.value.add(callback)

    // Return unsubscribe function
    return () => {
      statusListeners.value.delete(callback)
    }
  }

  const updateConfig = (newConfig: Partial<WebSocketConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const cleanup = () => {
    disconnect()
    clearTimers()
    messageListeners.value.clear()
    statusListeners.value.clear()
  }

  return {
    status,
    isConnected,
    lastError,
    reconnectAttempts,
    queuedMessages: computed(() => messageQueue.value.length),
    canReconnect,
    connect,
    disconnect,
    send,
    forceReconnect,
    updateConfig,
    cleanup,
    onMessage,
    onStatusChange
  }
})
