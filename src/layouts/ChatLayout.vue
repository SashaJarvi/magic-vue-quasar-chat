<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn v-if="$q.screen.lt.md && activeContactName" flat dense round icon="arrow_back" @click="handleBack" />
        <q-toolbar-title>
          {{ activeContactName || 'Chat' }}
        </q-toolbar-title>

        <q-space />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="chat-container">
        <!-- Contacts List - visible on desktop or when no contact selected on mobile -->
        <div
          v-show="$q.screen.gt.sm || !activeContactName"
          class="contacts-panel"
          :class="{ 'full-width': $q.screen.lt.md }"
        >
          <ContactsList />
        </div>

        <!-- Chat Dialog - visible on desktop or when contact selected on mobile -->
        <div
          v-show="$q.screen.gt.sm || activeContactName"
          class="chat-panel"
          :class="{ 'full-width': $q.screen.lt.md }"
        >
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

const activeContactName = computed(() => chatStore.activeContactName)

const handleBack = () => {
  chatStore.clearActiveContact()
}

onMounted(() => {
  try {
    chatStore.connectWebSocket()
  } catch {
    console.log('WebSocket not available, please check your connection')
  }
})

onUnmounted(() => {
  chatStore.disconnectWebSocket()
})
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
}

.contacts-panel {
  width: 350px;
  border-right: 1px solid #e0e0e0;
  background: white;
}

.chat-panel {
  flex: 1;
  background: #f5f5f5;
}

.full-width {
  width: 100% !important;
  flex: none;
}

.demo-btn {
  margin-right: 8px;
}

@media (max-width: 599px) {
  .contacts-panel {
    width: 100%;
  }

  .demo-btn {
    font-size: 12px;
    padding: 4px 8px;
  }
}
</style>
