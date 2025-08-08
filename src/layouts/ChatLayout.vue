<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> Magic Quasar Chat </q-toolbar-title>

        <q-space />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="chat-container">
        <div
          v-show="$q.screen.gt.xs || !activeContact"
          class="contacts-panel"
          :class="{ 'full-width': $q.screen.lt.sm }"
        >
          <ContactsList />
        </div>

        <div v-show="$q.screen.gt.xs || activeContact" class="chat-panel" :class="{ 'full-width': $q.screen.lt.sm }">
          <div v-if="activeContact" class="contact-header">
            <q-btn v-if="$q.screen.lt.sm && activeContact" flat dense round icon="arrow_back" @click="handleBack" />
            <div class="contact-info">
              <q-avatar color="primary" text-color="white" size="40px">
                {{ activeContactNameFirstLetter }}
              </q-avatar>
              <div class="contact-details">
                <div class="contact-name">{{ activeContact.name }}</div>
              </div>
            </div>
          </div>

          <ChatDialog />
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useChatStore } from 'src/stores/chat-store'
import ContactsList from 'src/components/ContactsList.vue'
import ChatDialog from 'src/components/ChatDialog.vue'

const $q = useQuasar()
const chatStore = useChatStore()

const activeContact = computed(() => chatStore.activeContact)
const activeContactNameFirstLetter = computed(() =>
  activeContact.value ? activeContact.value.name.charAt(0).toUpperCase() : ''
)

const handleBack = () => {
  chatStore.clearActiveContact()
}

onMounted(() => {
  try {
    chatStore.connectWebSocket()
  } catch {
    console.log('WebSocket not available, will connect when available')
  }
})

onUnmounted(() => {
  chatStore.disconnectWebSocket()
})
</script>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 56px); /* Subtract header height */
}

.contacts-panel {
  width: 350px;
  border-right: 1px solid #e0e0e0;
  background: white;
}

.chat-panel {
  flex: 1;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.contact-header {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 12px 16px;
  flex-shrink: 0;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-details {
  flex: 1;
}

.contact-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.contact-status {
  font-size: 12px;
  color: #4caf50;
}

.full-width {
  width: 100% !important;
  flex: none;
}

.demo-btn {
  margin-right: 8px;
}

/* Equal width columns for medium screens */
@media (min-width: 600px) and (max-width: 720px) {
  .contacts-panel {
    width: 50%;
    flex: none;
  }

  .chat-panel {
    width: 50%;
    flex: none;
  }
}

@media (max-width: 479px) {
  .contacts-panel {
    width: 100%;
  }
}
</style>
