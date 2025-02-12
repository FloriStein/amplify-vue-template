<script setup lang="ts">
import { ref, onMounted } from "vue";
import { uploadData, list, getUrl, remove } from "aws-amplify/storage";

const fileInput = ref<HTMLInputElement | null>(null);
const fileList = ref<{ name: string; url: string }[]>([]);
const selectedFiles = ref<Set<string>>(new Set());

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const toggleFileSelection = (fileName: string) => {
  if (selectedFiles.value.has(fileName)) {
    selectedFiles.value.delete(fileName);
  } else {
    selectedFiles.value.add(fileName);
  }
};

const deleteSelectedFiles = async () => {
  const filesToDelete = Array.from(selectedFiles.value);
  if (filesToDelete.length === 0) return;

  try {
    await Promise.all(
        filesToDelete.map(async (fileName) => {
          const path = `picture-submissions/${fileName}`;
          await remove({ path });
        })
    );

    // Listen nach dem Löschen aktualisieren
    selectedFiles.value.clear();
    await fetchFileList(); // Erneutes Laden der aktuellen Datei-Liste aus der Cloud
    console.log("Ausgewählte Dateien wurden gelöscht.");
  } catch (error) {
    console.error("Fehler beim Löschen der Dateien", error);
  }
};

const uploadFiles = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const uploadPromises = Array.from(files).map(async (file) => {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);

    return new Promise<void>((resolve, reject) => {
      fileReader.onload = async (e) => {
        const result = e.target?.result;
        if (!result) return reject("Fehler beim Lesen der Datei");

        try {
          const path = `picture-submissions/${file.name}`;
          await uploadData({ data: result, path });
          const linkToStorageFile = await getUrl({ path });
          fileList.value.push({ name: file.name, url: linkToStorageFile.url.toString() });
          resolve();
        } catch (error) {
          console.error("Fehler beim Hochladen", error);
          reject(error);
        }
      };
    });
  });

  await Promise.all(uploadPromises);

  // Datei-Input leeren, um erneute Uploads zu ermöglichen
  target.value = "";
};


const fetchFileList = async () => {
  try {
    const response = await list({ path: "picture-submissions/" });
    fileList.value = await Promise.all(
        response.items.map(async (item: { path: string }) => {
          const linkToStorageFile = await getUrl({ path: item.path });
          return { name: item.path.split('/').pop() || "", url: linkToStorageFile.url.toString() }
        })
    );
  } catch (error) {
    console.error("Fehler beim Laden der Dateien", error);
  }
};

onMounted(fetchFileList);
</script>

<template>
  <div>
    <input type="file" ref="fileInput" @change="uploadFiles" multiple style="display: none" />
    <button @click="triggerFileSelect">Dateien auswählen & Hochladen</button>
    <button @click="deleteSelectedFiles" :disabled="selectedFiles.size === 0">Ausgewählte Dateien löschen</button>
    <ul>
      <li v-for="file in fileList" :key="file.name">
        <input type="checkbox" @change="toggleFileSelection(file.name)" :checked="selectedFiles.has(file.name)" />
        <a :href="file.url" download>{{ file.name }}</a>
      </li>
    </ul>
  </div>
</template>
