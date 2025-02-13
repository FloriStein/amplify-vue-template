<template>
  <div>
    <input v-model="searchQuery" placeholder="Dateiname suchen..." />
    <ul>
      <li v-for="file in filteredFiles" :key="file.name">
        <input type="checkbox" @change="toggleFileSelection(file.name)" :checked="selectedFiles.has(file.name)" />
        <span>{{ file.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useFileList } from "@/composables/useFileList";
import { useFileDownload } from "@/composables/useFileDownload";

const { filteredFiles, searchQuery, fetchFileList } = useFileList();
const { selectedFiles, toggleFileSelection } = useFileDownload();

onMounted(fetchFileList);
</script>
