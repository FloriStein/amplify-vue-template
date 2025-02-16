<template>
  <div class="file-uploader">
    <input
        type="file"
        ref="fileInput"
        @change="handleFileChange"
        multiple
        style="display: none"
    />
    <button @click="triggerFileSelect">Upload</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { uploadData, getUrl } from "aws-amplify/storage";

// Event, um die hochgeladenen Dateien an den Parent zu übermitteln
const emit = defineEmits<{
  (e: "uploadComplete", uploadedFiles: Array<{ name: string; path: string }>): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const uploadedFiles: Array<{ name: string; path: string }> = [];

  await Promise.all(
      Array.from(files).map(async (file) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);

        await new Promise<void>((resolve, reject) => {
          fileReader.onload = async (e) => {
            const result = e.target?.result;
            if (!result) return reject("Fehler beim Lesen der Datei");
            try {
              const path = `picture-submissions/${file.name}`;
              await uploadData({ data: result, path });

              // getUrl hier nur bei Bedarf verwenden und nicht speichern
              const fileUrl = await getUrl({
                path,
                options: { expiresIn: 5 }
              });
              console.log(`Presigned URL für ${file.name}:`, fileUrl.url.toString());

              uploadedFiles.push({ name: file.name, path });
              resolve();
            } catch (error) {
              console.error("Fehler beim Hochladen", error);
              reject(error);
            }
          };
        });
      })
  );

  target.value = "";
  emit("uploadComplete", uploadedFiles);
};

defineExpose({});
</script>
