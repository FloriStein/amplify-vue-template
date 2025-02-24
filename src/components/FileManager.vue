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
import { ApiError, get } from "aws-amplify/api"; // 🚀 REST API von Amplify v2 nutzen
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
});

const searchQuery = ref("");
const fileList = ref<FileItem[]>([]);
const selectedFiles = ref<Set<string>>(new Set());

const filteredFiles = computed(() =>
    fileList.value.filter(file =>
        file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);

// 📌 **Neue API-gestützte Methode zum Abrufen der Datei-Metadaten**
const fetchFileList = async (): Promise<void> => {
  try {
    const restOperation = get({
      apiName: 'myRestApi',
      path: '/metadata',
    });
    const { body } = await restOperation.response;

    // Sicherstellen, dass der Body ein String ist und als JSON verarbeitet werden kann
    if (body) {
      const textBody = await body.text(); // Umwandlung des Body zu Text
      try {
        const response = JSON.parse(textBody); // Versuchen, den Body als JSON zu parsen
        if (Array.isArray(response)) {
          fileList.value = response.map((metadata: any) => ({
            name: metadata.fileName,
            path: metadata.filePath,
            uploadedAt: metadata.uploadedAt,
            size: metadata.size
          }));
        } else {
          console.error('Antwort ist nicht im erwarteten Format:', response);
        }
      } catch (error) {
        console.error('Fehler beim Parsen der Antwort:', error);
      }
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.response) {
        const { statusCode, body } = error.response;
        console.error(`Fehler beim Laden der Dateien: ${statusCode} - ${body}`);
      } else {
        console.error("API-Fehler ohne HTTP-Antwort:", error);
      }
    } else {
      console.error("Unbekannter Fehler:", error);
    }
  }
};

const toggleFileSelection = (fileName: string): void => {
  if (selectedFiles.value.has(fileName)) {
    selectedFiles.value.delete(fileName);
  } else {
    selectedFiles.value.add(fileName);
  }
};

const updateFile = (updatedFile: FileItem): void => {
  const index = fileList.value.findIndex(f => f.name === updatedFile.name);
  if (index !== -1) {
    fileList.value[index] = updatedFile;
  }
};

const handleUploadComplete = (uploadedFiles: FileItem[]): void => {
  fileList.value.push(...uploadedFiles);
};

const handleFilesDeleted = (updatedFileList: FileItem[]): void => {
  selectedFiles.value.clear();
  fileList.value = updatedFileList;
};

// 📌 **REST API-Aufruf für signierte URL (falls benötigt)**
const getUrlOnDemand = async (file: FileItem): Promise<string | null> => {
  try {
    const restOperation = get({
      apiName: 'myRestApi',
      path: `/metadata/${file.name}`,
    });
    const { body } = await restOperation.response;

    // Sicherstellen, dass der Body ein String ist und als JSON verarbeitet werden kann
    if (body) {
      const textBody = await body.text(); // Umwandlung des Body zu Text
      try {
        const response = JSON.parse(textBody); // Versuchen, den Body als JSON zu parsen
        if (response && response.url) {
          return response.url; // Rückgabe der URL
        } else {
          console.error('URL nicht im Antwort-Body gefunden:', response);
        }
      } catch (error) {
        console.error('Fehler beim Parsen der Antwort:', error);
      }
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.response) {
        const { statusCode, body } = error.response;
        console.error(`Fehler beim Laden der URL für ${file.name}: ${statusCode} - ${body}`);
      } else {
        console.error("API-Fehler ohne HTTP-Antwort:", error);
      }
    } else {
      console.error(`Fehler beim Laden der URL für ${file.name}`, error);
    }
    return null; // Rückgabe von null im Fehlerfall
  }
  return null; // Im Erfolgsfall sollte keine Rückgabe fehlen
};

onMounted(fetchFileList);
</script>
