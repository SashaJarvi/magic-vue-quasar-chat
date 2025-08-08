import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { WS_PORT } from 'src/constants'
import type { IncomingMessage } from 'src/types/chat'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface WebSocketConfig {
  url: string
  heartbeatInterval: number
  heartbeatTimeout: number
  reconnectInterval: number
  maxReconnectAttempts: number
  reconnectDecay: number
}

export const useWebSocketStore = defineStore('websocket', () => {
  const connection = ref<WebSocket | null>(null)
  const status = ref<ConnectionStatus>('disconnected')
  const lastError = ref<string | null>(null)
  const reconnectAttempts = ref(0)
  const messageQueue = ref<string[]>([])

  let heartbeatTimer: NodeJS.Timeout | null = null
  let heartbeatTimeout: NodeJS.Timeout | null = null
  let reconnectTimer: NodeJS.Timeout | null = null

  const config = ref<WebSocketConfig>({
    url: `ws://localhost:${WS_PORT}`,
    heartbeatInterval: 30000,
    heartbeatTimeout: 10000,
    reconnectInterval: 2000,
    maxReconnectAttempts: 10,
    reconnectDecay: 1.5
  })

  // Event listeners
  const messageListeners = ref<Set<(data: IncomingMessage) => void>>(new Set())
  const statusListeners = ref<Set<(status: ConnectionStatus) => void>>(new Set())

  // Computed
  const isConnected = computed(() => status.value === 'connected')
  const canReconnect = computed(() => reconnectAttempts.value < config.value.maxReconnectAttempts)

  // Private methods
  function clearTimers() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout)
      heartbeatTimeout = null
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function setStatus(newStatus: ConnectionStatus) {
    if (status.value !== newStatus) {
      status.value = newStatus
      statusListeners.value.forEach((listener) => listener(newStatus))
    }
  }

  function setupHeartbeat() {
    if (!isConnected.value) return

    heartbeatTimer = setInterval(() => {
      if (connection.value?.readyState === WebSocket.OPEN) {
        // Send ping
        connection.value.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))

        // Set timeout for pong response
        heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - connection may be broken')
          if (connection.value) {
            connection.value.close()
          }
        }, config.value.heartbeatTimeout)
      }
    }, config.value.heartbeatInterval)
  }

  function handlePong() {
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout)
      heartbeatTimeout = null
    }
  }

  function processMessageQueue() {
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

  function calculateReconnectDelay(): number {
    return Math.min(
      config.value.reconnectInterval * Math.pow(config.value.reconnectDecay, reconnectAttempts.value),
      30000 // Max 30 seconds
    )
  }

  // Public methods
  function connect(url?: string) {
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
        setupHeartbeat()
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

          // Handle heartbeat pong
          if (data.type === 'pong') {
            handlePong()
            return
          }

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

  function disconnect() {
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

  function send(data: unknown) {
    const message = JSON.stringify(data)

    if (isConnected.value && connection.value?.readyState === WebSocket.OPEN) {
      connection.value.send(message)
    } else {
      // Queue message for later sending
      messageQueue.value.push(message)
      console.log('Message queued (connection not ready):', data)
    }
  }

  function forceReconnect() {
    reconnectAttempts.value = 0
    if (connection.value) {
      connection.value.close()
    } else {
      connect()
    }
  }

  // Event subscription methods
  function onMessage(callback: (data: IncomingMessage) => void) {
    messageListeners.value.add(callback)

    // Return unsubscribe function
    return () => {
      messageListeners.value.delete(callback)
    }
  }

  function onStatusChange(callback: (status: ConnectionStatus) => void) {
    statusListeners.value.add(callback)

    // Return unsubscribe function
    return () => {
      statusListeners.value.delete(callback)
    }
  }

  function updateConfig(newConfig: Partial<WebSocketConfig>) {
    config.value = { ...config.value, ...newConfig }
  }

  // Cleanup on store disposal
  function cleanup() {
    disconnect()
    clearTimers()
    messageListeners.value.clear()
    statusListeners.value.clear()
  }

  return {
    // State
    status: computed(() => status.value),
    isConnected,
    lastError: computed(() => lastError.value),
    reconnectAttempts: computed(() => reconnectAttempts.value),
    queuedMessages: computed(() => messageQueue.value.length),
    canReconnect,

    // Actions
    connect,
    disconnect,
    send,
    forceReconnect,
    updateConfig,
    cleanup,

    // Event subscriptions
    onMessage,
    onStatusChange
  }
})
