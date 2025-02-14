<!-- FileActions.vue -->
<template>
  <div>
    <button @click="deleteSelectedFiles" :disabled="selectedFiles.size === 0">
      Ausgewählte Dateien löschen
    </button>
    <button @click="downloadSelectedFilesAsZip" :disabled="selectedFiles.size === 0">
      Ausgewählte Dateien als ZIP herunterladen
    </button>
  </div>
</template>

<script setup lang="ts">
import { remove, getUrl } from "aws-amplify/storage";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { FileItem } from "@/types/types";

const props = defineProps<{
  selectedFiles: Set<string>;
  fileList: FileItem[];
}>();

const emit = defineEmits<{
  (e: "filesDeleted", updatedFileList: FileItem[]): void;
}>();

// Event, um den Parent darüber zu informieren, dass Dateien gelöscht wurden
/*const emit = defineEmits<{
  (e: "filesDeleted"): void;
}>();*/

/*const deleteSelectedFiles = async () => {
  const filesToDelete = Array.from(props.selectedFiles);
  if (filesToDelete.length === 0) return;

  try {
    await Promise.all(
        filesToDelete.map(async (fileName) => {
          const path = `picture-submissions/${fileName}`;
          await remove({ path });
        })
    );
    // Nachdem die Dateien gelöscht wurden, informieren wir den Parent:
    emit("filesDeleted");
  } catch (error) {
    console.error("Fehler beim Löschen der Dateien", error);
  }
};*/

const deleteSelectedFiles = async () => {
  const filesToDelete = Array.from(props.selectedFiles);
  if (filesToDelete.length === 0) return;

  try {
    await Promise.all(
        filesToDelete.map(async (fileName) => {
          const path = `picture-submissions/${fileName}`;
          await remove({ path });
        })
    );

    // Nachdem die Dateien gelöscht wurden, direkt aus der Liste entfernen
    const updatedFileList = props.fileList.filter(
        (file) => !filesToDelete.includes(file.name)
    );

    // Parent darüber informieren, dass sich die Liste geändert hat
    emit("filesDeleted", updatedFileList);
  } catch (error) {
    console.error("Fehler beim Löschen der Dateien", error);
  }
};



const downloadSelectedFilesAsZip = async () => {
  const filesToDownload = Array.from(props.selectedFiles);
  if (filesToDownload.length === 0) return;

  const zip = new JSZip();

  try {
    await Promise.all(
        filesToDownload.map(async (fileName) => {
          const fileItem = props.fileList.find((file) => file.name === fileName);
          if (!fileItem) return;

          // getUrl nur beim tatsächlichen Download aufrufen
          const urlResponse = await getUrl({
            path: fileItem.path,
            options: { expiresIn: 5 }
          });
          const url = urlResponse.url.toString();

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Fehler beim Herunterladen von ${fileName}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          zip.file(fileName, arrayBuffer);
        })
    );

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "download.zip");
  } catch (error) {
    console.error("Fehler beim Herunterladen der Dateien:", error);
  }
};


defineExpose({});
</script>
