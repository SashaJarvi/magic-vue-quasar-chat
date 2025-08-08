<template>
  <div class="contacts-list">
    <q-list>
      <q-item-label header class="text-h6 q-pa-md"> Contacts </q-item-label>

      <q-item
        v-for="contact in sortedContacts"
        :key="contact.name"
        clickable
        v-ripple
        :active="contact.name === activeContactName"
        @click="selectContact(contact.name)"
        class="contact-item"
      >
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" size="40px">
            {{ getUpppercasedFirstLetter(contact.name) }}
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="contact-name">{{ contact.name }}</q-item-label>
          <q-item-label caption lines="1" class="last-message">
            {{ contact.lastMessage }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="contact-meta">
            <div class="timestamp">
              {{ formatTime(contact.lastMessageTime) }}
            </div>
            <q-badge
              v-if="contact.unreadCount > 0"
              color="red"
              :label="contact.unreadCount"
              rounded
              class="unread-badge"
            />
          </div>
        </q-item-section>
      </q-item>

      <q-item v-if="sortedContacts.length === 0" class="text-center q-pa-md">
        <q-item-section>
          <q-item-label class="text-grey-6"> No conversations yet </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from 'src/stores/chat-store'
import getUpppercasedFirstLetter from 'src/utils/get-uppercased-first-letter'

const chatStore = useChatStore()

const sortedContacts = computed(() => chatStore.sortedContacts)
const activeContactName = computed(() => chatStore.activeContactName)

const selectContact = (name: string) => {
  chatStore.setActiveContact(name)
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffInHours < 168) {
    // 7 days
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}
</script>

<style scoped>
.contacts-list {
  height: 100%;
  overflow-y: auto;
}

.contact-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.contact-item:hover {
  background-color: #f8f9fa;
}

.contact-item.q-item--active {
  background-color: #e3f2fd;
}

.contact-name {
  font-weight: 500;
  font-size: 14px;
}

.last-message {
  color: #666;
  font-size: 13px;
  margin-top: 2px;
}

.contact-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.timestamp {
  font-size: 11px;
  color: #999;
}

.unread-badge {
  min-width: 18px;
  height: 18px;
}
</style>
