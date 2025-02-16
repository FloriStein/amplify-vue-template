<template>
  <div class="file-manager">
    <!-- Linke Spalte: Suchfeld, Uploader, Aktionen -->
    <div class="left-column">
      <FileSearch v-model="searchQuery" />
      <FileUploader @uploadComplete="handleUploadComplete" />
      <FileActions
          :selectedFiles="selectedFiles"
          :fileList="fileList"
          @filesDeleted="handleFilesDeleted"
      />

      <!-- Sign-Out Button unten in der linken Spalte -->
      <div class="sign-out-container">
        <button class="sign-out-button" @click="signOut">Sign Out</button>
      </div>
    </div>

    <!-- Rechte Spalte: Datei-Liste -->
    <div class="right-column">
      <div class="file-list-container">
        <FileList
            :fileList="filteredFiles"
            :selectedFiles="selectedFiles"
            @toggleSelection="toggleFileSelection"
            @updateFile="updateFile"
            @getUrlOnDemand="getUrlOnDemand"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineProps } from "vue";
import type { PropType } from "vue";
import { list, getUrl, downloadData } from "aws-amplify/storage";
import type { FileItem } from "@/types/types";
import FileSearch from "./FileSearch.vue";
import FileUploader from "./FileUploader.vue";
import FileActions from "./FileActions.vue";
import FileList from "./FileList.vue";

// Sign-Out-Funktion als Prop erhalten
defineProps({
  signOut: {
    type: Function as PropType<() => void>,
    required: true
  }
})

const searchQuery = ref("");
const fileList = ref<FileItem[]>([]);
const selectedFiles = ref<Set<string>>(new Set());

const filteredFiles = computed(() =>
    fileList.value.filter(file =>
        file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);

const fetchFileList = async () => {
  try {
    const response = await list({ path: "metadata/" });
    const items = await Promise.all(
        response.items.map(async (item) => {
          try {
            const metadataResponse = await downloadData({ path: item.path });
            const metadataData = await metadataResponse.result;
            if (metadataData.body instanceof Blob) {
              const metadataText = await metadataData.body.text();
              if (!metadataText) return null;
              const metadata = JSON.parse(metadataText);
              return {
                name: metadata.fileName,
                path: metadata.filePath,
                uploadedAt: metadata.uploadedAt,
                size: metadata.size,
              } as FileItem; // <-- Explizit als FileItem casten
            } else {
              console.error("Unerwartetes Format von metadataData:", metadataData);
              return null;
            }
          } catch (error) {
            console.error("Fehler beim Abrufen der Metadaten:", error);
            return null;
          }
        })
    );

    // Hier erfolgt das Filtern von null-Werten mit Type Guard
    fileList.value = items.filter((item): item is FileItem => item !== null);
  } catch (error) {
    console.error("Fehler beim Laden der Dateien", error);
  }
};



const toggleFileSelection = (fileName: string) => {
  if (selectedFiles.value.has(fileName)) {
    selectedFiles.value.delete(fileName);
  } else {
    selectedFiles.value.add(fileName);
  }
};

const updateFile = (updatedFile: FileItem) => {
  const index = fileList.value.findIndex(f => f.name === updatedFile.name);
  if (index !== -1) {
    fileList.value[index] = updatedFile;
  }
};

const handleUploadComplete = (uploadedFiles: FileItem[]) => {
  fileList.value.push(...uploadedFiles);
};

const handleFilesDeleted = (updatedFileList: FileItem[]) => {
  selectedFiles.value.clear();
  fileList.value = updatedFileList;
};

// Funktion für das Abrufen der URL bei Bedarf
const getUrlOnDemand = async (file: FileItem): Promise<string | null> => {
  try {
    const urlResponse = await getUrl({
      path: file.path,
      options: { expiresIn: 5 }
    });
    return urlResponse.url.toString();
  } catch (error) {
    console.error(`Fehler beim Laden der URL für ${file.name}`, error);
    return null;
  }
};

onMounted(fetchFileList);
</script>
