<script setup lang="ts">

import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";
import Todos from './components/Todos.vue';
import Upload from './components/Upload.vue';
import S3FileManager from './components/S3FileManager.vue';


</script>

<template>
  <main>
    <authenticator>
      <template v-slot="{ signOut }">
        <S3FileManager />
        <!-- //<Todos />
        <Upload />-->
        <div class="right-column">
          <button @click="signOut">Sign Out</button>
        </div>
      </template>
    </authenticator>
  </main>
</template>




