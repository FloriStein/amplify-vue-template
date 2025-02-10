<script setup lang="ts">
import { ref, onMounted } from "vue";
import { uploadData, list } from "aws-amplify/storage";

const fileInput = ref<HTMLInputElement | null>(null);
const fileList = ref<string[]>([]);

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const uploadFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const selectedFile = target.files?.[0];
  if (!selectedFile) return;

  const fileReader = new FileReader();
  fileReader.readAsArrayBuffer(selectedFile);

  fileReader.onload = async (e) => {
    const result = e.target?.result;
    if (!result) return;

    console.log("Datei erfolgreich gelesen!", result);
    try {
      await uploadData({
        data: result,
        path: `picture-submissions/${selectedFile.name}`,
      });
      console.log("Upload erfolgreich!");
      fetchFileList();
    } catch (error) {
      console.error("Fehler beim Hochladen", error);
    }
  };
};

const fetchFileList = async () => {
  try {
    const { results } = await list("picture-submissions/");
    fileList.value = results.map(item => item.key);
  } catch (error) {
    console.error("Fehler beim Laden der Dateien", error);
  }
};

onMounted(fetchFileList);
</script>

<template>
  <div>
    <input type="file" ref="fileInput" @change="uploadFile" style="display: none" />
    <button @click="triggerFileSelect">Datei auswählen & Hochladen</button>
    <ul>
      <li v-for="file in fileList" :key="file">{{ file }}</li>
    </ul>
  </div>
</template>