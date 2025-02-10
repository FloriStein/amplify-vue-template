<script setup lang="ts">

import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";
import Todos from './components/Todos.vue'
import Upload from './components/Upload.vue'

</script>

<template>
  <main>
    <authenticator>
      <template v-slot="{ signOut }">
        <!-- <Todos /> -->
        <Upload />
        <button @click="signOut">Sign Out</button>
      </template>
    </authenticator>
  </main>
</template>

