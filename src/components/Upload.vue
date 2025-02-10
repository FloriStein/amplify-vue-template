<script setup lang="ts">
import { ref } from "vue";
import { uploadData } from "aws-amplify/storage";

const fileInput = ref<HTMLInputElement | null>(null);

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
    } catch (error) {
      console.error("Fehler beim Hochladen", error);
    }
  };
};
</script>

<template>
  <div>
    <input type="file" ref="fileInput" @change="uploadFile" style="display: none" />
    <button @click="triggerFileSelect">Datei auswählen & Hochladen</button>
  </div>
</template>
