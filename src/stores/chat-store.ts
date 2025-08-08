import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contact, Message, IncomingMessage } from 'src/types/chat'
import { useWebSocketStore } from './websocket-store'
import { WS_PORT } from 'src/constants'
import generateRandomId from 'src/utils/generate-random-id'

export const useChatStore = defineStore('chat', () => {
  const websocketStore = useWebSocketStore()

  const contacts = ref<Contact[]>([])
  const activeContactName = ref<string | null>(null)
  const currentUserName = ref<string>('You')

  // Message listener cleanup function
  let unsubscribeFromMessages: (() => void) | null = null

  const sortedContacts = computed(() => [...contacts.value].sort((a, b) => b.lastMessageTime - a.lastMessageTime))
  const activeContact = computed(() => contacts.value.find((contact) => contact.name === activeContactName.value))

  const addOrUpdateContact = (name: string, message: string, isOwn = false) => {
    const existingContact = contacts.value.find((contact) => contact.name === name)
    const timestamp = Date.now()

    const newMessage: Message = {
      id: generateRandomId(),
      from: isOwn ? currentUserName.value : name,
      message,
      timestamp,
      isOwn
    }

    if (existingContact) {
      existingContact.messages.push(newMessage)
      existingContact.lastMessage = message
      existingContact.lastMessageTime = timestamp

      if (!isOwn && activeContactName.value !== name) {
        existingContact.unreadCount++
      }
    } else {
      const newContact: Contact = {
        name,
        lastMessage: message,
        lastMessageTime: timestamp,
        unreadCount: isOwn ? 0 : 1,
        messages: [newMessage]
      }
      contacts.value.push(newContact)
    }
  }

  const receiveMessage = (incomingMessage: IncomingMessage) => {
    // Avoiding errors if an incoming message does not have the expected structure
    if (!Object.hasOwn(incomingMessage, 'message')) {
      console.error('Incoming message is not a chat message', incomingMessage)
      return
    }

    const { from, message } = incomingMessage.message
    addOrUpdateContact(from, message, false)
  }

  const sendMessage = (message: string) => {
    if (activeContactName.value) {
      addOrUpdateContact(activeContactName.value, message, true)
    }
  }

  const setActiveContact = (name: string) => {
    activeContactName.value = name

    const contact = contacts.value.find((c) => c.name === name)
    if (contact) {
      contact.unreadCount = 0
    }
  }

  const clearActiveContact = () => {
    activeContactName.value = null
  }

  const webSocketInitializationHandler = () => {
    // Clean up existing listener
    if (unsubscribeFromMessages) {
      unsubscribeFromMessages()
    }

    // Set up message listener
    unsubscribeFromMessages = websocketStore.onMessage((data: IncomingMessage) => {
      // Handle chat messages
      if (data.message && data.message.from && data.message.message) {
        receiveMessage(data)
      }
    })

    // Connect to WebSocket
    websocketStore.updateConfig({
      url: `ws://localhost:${WS_PORT}`
    })
    websocketStore.connect()
  }

  const webSocketDisconnectionHandler = () => {
    if (unsubscribeFromMessages) {
      unsubscribeFromMessages()
      unsubscribeFromMessages = null
    }
    websocketStore.disconnect()
  }

  return {
    contacts,
    sortedContacts,
    activeContactName,
    activeContact,
    currentUserName,
    receiveMessage,
    sendMessage,
    setActiveContact,
    clearActiveContact,
    webSocketInitializationHandler,
    webSocketDisconnectionHandler
  }
})
