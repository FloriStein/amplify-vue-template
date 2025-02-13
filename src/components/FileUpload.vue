<template>
  <div>
    <input type="file" @change="uploadFiles" multiple style="display: none" ref="fileInput" />
    <button @click="fileInput.click()">Dateien auswählen & Hochladen</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useFileUpload } from "@/composables/useFileUpload";

const { uploadFiles } = useFileUpload();
const fileInput = ref<HTMLInputElement | null>(null);
</script>
