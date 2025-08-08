export interface Message {
  id: string
  from: string
  message: string
  timestamp: number
  isOwn?: boolean
}

export interface Contact {
  name: string
  lastMessage: string
  lastMessageTime: number
  unreadCount: number
  messages: Message[]
}

export interface IncomingMessage {
  message: {
    from: string
    message: string
  }
}
