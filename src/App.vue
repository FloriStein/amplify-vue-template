<script setup lang="ts">
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";
import FileManager from './components/FileManager.vue';
</script>

<template>
  <authenticator>
    <template v-slot="{ signOut }">
      <FileManager :signOut="signOut" />
    </template>
  </authenticator>
</template>

