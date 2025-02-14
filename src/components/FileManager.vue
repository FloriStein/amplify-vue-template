<template>
  <div class="s3-file-manager">
    <!-- Linke Spalte: Uploader und Aktionen -->
    <div class="left-column">
      <FileUploader @uploadComplete="handleUploadComplete" />
      <FileActions
          :selectedFiles="selectedFiles"
          :fileList="fileList"
          @filesDeleted="handleFilesDeleted"
      />
    </div>

    <!-- Rechte Spalte: Datei-Liste -->
    <div class="right-column">
      <FileList
          :fileList="fileList"
          :selectedFiles="selectedFiles"
          @toggleSelection="toggleFileSelection"
          @updateFile="updateFile"
          @getUrlOnDemand="getUrlOnDemand"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { list, downloadData, getUrl } from "aws-amplify/storage";
import type { FileItem } from "@/types/types";
import FileUploader from "./FileUploader.vue";
import FileActions from "./FileActions.vue";
import FileList from "./FileList.vue";


const fileList = ref<FileItem[]>([]);
const selectedFiles = ref<Set<string>>(new Set());

const fetchFileList = async () => {
  try {
    const response = await list({ path: "metadata/" });
    fileList.value = (
        await Promise.all(
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
                    path: metadata.filePath
                    // URL wird nicht direkt geladen, sondern nur bei Bedarf
                  };
                } else {
                  console.error("Unerwartetes Format von metadataData:", metadataData);
                  return null;
                }
              } catch (error) {
                console.error("Fehler beim Abrufen der Metadaten:", error);
                return null;
              }
            })
        )
    ).filter((item): item is FileItem => item !== null);
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
