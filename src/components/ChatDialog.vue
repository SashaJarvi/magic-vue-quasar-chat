<template>
  <div class="chat-dialog">
    <div v-if="!activeContact" class="no-chat-selected">
      <div class="text-center q-pa-xl">
        <q-icon name="chat" size="64px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">Select a contact to start chatting</div>
      </div>
    </div>

    <div v-else class="chat-content">
      <!-- Messages Area -->
      <div ref="messagesContainer" class="messages-container">
        <transition-group name="message" tag="div" class="messages-list">
          <div
            v-for="message in activeContact.messages"
            :key="message.id"
            class="message-wrapper"
            :class="{ 'own-message': message.isOwn }"
            :data-timestamp="message.timestamp"
          >
            <div class="message-bubble" :class="{ 'own-bubble': message.isOwn }">
              <div class="message-text">{{ message.message }}</div>
              <div class="message-time">
                {{ formatMessageTime(message.timestamp) }}
                <q-tooltip persistent anchor="bottom end" transition-show="scale" transition-hide="scale">
                  {{ formatMessageTooltip(message.timestamp) }}
                </q-tooltip>
              </div>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- Message Input Area -->
      <div class="message-input-area">
        <q-form @submit.prevent="sendMessage" class="message-form">
          <q-input
            v-model="newMessage"
            outlined
            placeholder="Type a message..."
            autogrow
            :max-height="100"
            class="message-input"
            @keydown.enter.exact.prevent="sendMessage"
          >
            <template #append>
              <q-btn
                round
                dense
                flat
                icon="send"
                type="submit"
                :disable="!newMessage.trim()"
                color="primary"
                @click="sendMessage"
              />
            </template>
          </q-input>
        </q-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useChatStore } from 'src/stores/chat-store'

const chatStore = useChatStore()

const messagesContainer = ref<HTMLElement | null>(null)
const newMessage = ref('')

const activeContact = computed(() => chatStore.activeContact)

const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

const formatMessageTooltip = (timestamp: number): string => {
  const date = new Date(timestamp)
  const day = date.getDate()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

  return `${day} ${month} ${year} at ${time}`
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !activeContact.value) return

  chatStore.sendMessage(newMessage.value.trim())
  newMessage.value = ''

  await nextTick()
  scrollToBottom()
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(
  () => activeContact.value?.messages.length,
  async () => {
    await nextTick(() => {
      scrollToBottom()
    })
  },
  { immediate: true }
)

watch(activeContact, async () => {
  await nextTick(() => {
    scrollToBottom()
  })
})
</script>

<style scoped>
.chat-dialog {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Important for flex containers with scrollable children */
}

.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  min-height: 0; /* Important for flex containers with scrollable children */
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
  min-height: 0; /* Important for proper scrolling */
}

.messages-list {
  width: 100%;
  min-height: 100%;
}

.message-wrapper {
  display: flex;
  margin-bottom: 12px;
  will-change: transform, opacity;
}

.message-wrapper.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.message-bubble:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.message-bubble.own-bubble {
  background: #2196f3;
  color: white;
}

.message-text {
  word-wrap: break-word;
  line-height: 1.4;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

.message-input-area {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background: white;
  flex-shrink: 0; /* Prevent the input area from shrinking */
}

.message-form {
  width: 100%;
}

.message-input {
  width: 100%;
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.message-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.message-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Optional: Add a subtle move transition when messages reposition */
.message-move {
  transition: transform 0.2s ease;
}
</style>
