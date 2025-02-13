<template>
  <div>
    <FileUpload />
    <FileList />
    <button @click="downloadSelectedFiles(filteredFiles)">Ausgewählte Dateien herunterladen</button>
  </div>
</template>

<script setup lang="ts">
import FileUpload from "@/components/FileUpload.vue";
import FileList from "@/components/FileList.vue";
import { useFileDownload } from "@/composables/useFileDownload";
import { useFileList } from "@/composables/useFileList";

const { downloadSelectedFiles } = useFileDownload();
const { filteredFiles } = useFileList();
</script>
