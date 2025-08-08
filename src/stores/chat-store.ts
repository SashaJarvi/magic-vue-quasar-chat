import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contact, Message, IncomingMessage } from 'src/types/chat'
import generateRandomId from 'src/utils/generate-random-id'

export const useChatStore = defineStore('chat', () => {
  const WS_PORT = 8181

  const contacts = ref<Contact[]>([])
  const activeContactName = ref<string | null>(null)
  const currentUserName = ref<string>('You')
  const websocket = ref<WebSocket | null>(null)

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
    // if (!Object.hasOwn(incomingMessage, 'message')) {
    //   console.error('Incoming message is not a chat message', incomingMessage)
    //   return
    // }

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

  const connectWebSocket = () => {
    if (websocket.value) {
      websocket.value.close()
    }

    websocket.value = new WebSocket(`ws://localhost:${WS_PORT}`)

    websocket.value.onmessage = (event) => {
      try {
        const incomingMessage: IncomingMessage = JSON.parse(event.data)
        receiveMessage(incomingMessage)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    websocket.value.onopen = () => {
      console.log('WebSocket connected')
    }

    websocket.value.onclose = () => {
      console.log('WebSocket disconnected')
    }

    websocket.value.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  const disconnectWebSocket = () => {
    if (websocket.value) {
      websocket.value.close()
      websocket.value = null
    }
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
    connectWebSocket,
    disconnectWebSocket
  }
})
