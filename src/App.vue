<script setup lang="ts">

import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";
import FileManager from './components/FileManager.vue';

</script>

<template>
  <main>
    <authenticator>
      <template v-slot="{ signOut }">
        <FileManager />
          <button class="left-column" @click="signOut">Sign Out</button>
      </template>
    </authenticator>
  </main>
</template>




