<template>
  <div class="file-manager">
    <!-- Linke Spalte: Uploader und Aktionen -->
    <div class="left-column">
      <FileSearch v-model="searchQuery" />
      <FileUploader @uploadComplete="handleUploadComplete" />
      <FileActions
          :selectedFiles="selectedFiles"
          :fileList="fileList"
          @filesDeleted="handleFilesDeleted"
      />
    </div>

    <!-- Rechte Spalte: Suchfeld + Datei-Liste -->
    <div class="right-column">
      <FileList
          :fileList="filteredFiles"
          :selectedFiles="selectedFiles"
          @toggleSelection="toggleFileSelection"
          @updateFile="updateFile"
          @getUrlOnDemand="getUrlOnDemand"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { list, downloadData, getUrl } from "aws-amplify/storage";
import type { FileItem } from "@/types/types";
import FileUploader from "./FileUploader.vue";
import FileActions from "./FileActions.vue";
import FileList from "./FileList.vue";
import FileSearch from "./FileSearch.vue";

const fileList = ref<FileItem[]>([]);
const selectedFiles = ref<Set<string>>(new Set());
const searchQuery = ref(""); // Suchtext

// Gefilterte Datei-Liste basierend auf Suchbegriff
const filteredFiles = computed(() =>
    fileList.value.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
);

const fetchFileList = async () => {
  try {
    const response = await list({ path: "metadata/" });
    const files = await Promise.all(
        response.items.map(async (item) => {
          try {
            const metadataResponse = await downloadData({ path: item.path });
            const metadataData = await metadataResponse.result;
            if (metadataData.body instanceof Blob) {
              const metadataText = await metadataData.body.text();
              if (!metadataText) return null;
              const metadata = JSON.parse(metadataText);

              // Generiere Presigned URL für jedes File
              const urlResponse = await getUrl({
                path: metadata.filePath,
                options: { expiresIn: 60 }
              });

              // Prüfe, ob uploadedAt und size vorhanden sind
              console.log("Metadaten aus S3:", metadata);

              // Übergebe alle notwendigen Metadaten an das FileItem
              const fileItem: FileItem = {
                name: metadata.fileName,
                path: metadata.filePath,
                size: metadata.size || 0,
                uploadedAt: metadata.uploadedAt || "Unbekannt",
                url: urlResponse.url.toString()
              };

              return fileItem;
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

    // Filtere null-Werte und aktualisiere die Datei-Liste
    fileList.value = files.filter((item): item is FileItem => item !== null);

  } catch (error) {
    console.error("Fehler beim Laden der Dateien", error);
  }
};




const getUrlOnDemand = async (file: FileItem) => {
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

const toggleFileSelection = (fileName: string) => {
  if (selectedFiles.value.has(fileName)) {
    selectedFiles.value.delete(fileName);
  } else {
    selectedFiles.value.add(fileName);
  }
};

const updateFile = (updatedFile: FileItem) => {
  const index = fileList.value.findIndex((f) => f.name === updatedFile.name);
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

onMounted(fetchFileList);
</script>
