<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> Magic Quasar Chat </q-toolbar-title>

        <q-space />

        <!-- Connection Status Indicator -->
        <q-chip
          :color="getStatusColor(connectionStatus)"
          text-color="white"
          :icon="getStatusIcon(connectionStatus)"
          size="sm"
          class="connection-status"
        >
          {{ getStatusLabel(connectionStatus) }}
          <q-tooltip v-if="webSocketError" class="text-negative">
            {{ webSocketError }}
          </q-tooltip>
        </q-chip>

        <!-- Reconnect Button (show when disconnected/error) -->
        <q-btn
          v-if="!isWebSocketConnected"
          @click="reconnectionHandler"
          icon="refresh"
          flat
          round
          dense
          color="grey-6"
          size="sm"
          class="q-ml-sm"
        >
          <q-tooltip>Reconnect</q-tooltip>
        </q-btn>
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
            <q-btn
              v-if="$q.screen.lt.sm && activeContact"
              flat
              dense
              round
              icon="arrow_back"
              @click="backButtonClickHandler"
            />
            <div class="contact-info">
              <q-avatar color="primary" text-color="white" size="40px">
                {{ activeContactNameFirstLetter }}
              </q-avatar>
              <div class="contact-details">
                <div class="contact-name">{{ activeContactName }}</div>
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
import { defineAsyncComponent, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useChatStore } from 'src/stores/chat-store'
import { useWebSocketStore } from 'src/stores/websocket-store'
import getUpppercasedFirstLetter from 'src/utils/get-uppercased-first-letter'

const ContactsList = defineAsyncComponent(() => import('src/components/ContactsList.vue'))
const ChatDialog = defineAsyncComponent(() => import('src/components/ChatDialog.vue'))

const $q = useQuasar()
const chatStore = useChatStore()
const webSocketStore = useWebSocketStore()

const activeContact = computed(() => chatStore.activeContact)
const activeContactName = computed(() => chatStore.activeContactName)
const activeContactNameFirstLetter = computed(() =>
  activeContactName.value ? getUpppercasedFirstLetter(activeContactName.value) : ''
)

const connectionStatus = computed(() => webSocketStore.status)
const isWebSocketConnected = computed(() => webSocketStore.isConnected)
const webSocketError = computed(() => webSocketStore.lastError)

const backButtonClickHandler = () => {
  chatStore.clearActiveContact()
}

const reconnectionHandler = () => {
  webSocketStore.forceReconnect()
}

// Status display helpers
const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    connected: 'positive',
    connecting: 'warning',
    reconnecting: 'warning',
    error: 'negative',
    default: 'grey'
  }

  return statusColors[status] || (statusColors.default as string)
}

const getStatusIcon = (status: string): string => {
  const statusIcons: Record<string, string> = {
    connected: 'wifi',
    connecting: 'sync',
    reconnecting: 'sync',
    error: 'wifi_off',
    default: 'signal_wifi_off'
  }

  return statusIcons[status] || (statusIcons.default as string)
}

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    connected: 'Online',
    connecting: 'Connecting',
    reconnecting: 'Reconnecting',
    error: 'Error',
    default: 'Offline'
  }

  return statusLabels[status] || (statusLabels.default as string)
}

onMounted(() => {
  try {
    chatStore.webSocketInitializationHandler()
  } catch {
    console.log('WebSocket not available, will connect when available')
  }
})

onUnmounted(() => {
  chatStore.webSocketDisconnectionHandler()
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

.connection-status {
  font-size: 11px;
  height: 24px;
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
