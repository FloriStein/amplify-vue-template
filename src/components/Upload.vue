<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { uploadData, downloadData, list, getUrl, remove} from "aws-amplify/storage";

const fileInput = ref<HTMLInputElement | null>(null);
const fileList = ref<{ name: string; url: string }[]>([]);
const selectedFiles = ref<Set<string>>(new Set());
const searchQuery = ref("");

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

    selectedFiles.value.clear();
    await fetchFileList();
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
  target.value = "";
};

// 🔹 Holt Metadaten-Dateien aus dem S3-Ordner "metadata/"
const fetchFileList = async () => {
  try {
    const response = await list({ path: "metadata/" });

    fileList.value = (await Promise.all(
        response.items.map(async (item) => {
          try {
            // Lade die Metadatei herunter und löse das Promise in 'result' auf
            const metadataResponse = await downloadData({ path: item.path });
            const metadataData = await metadataResponse.result;

            // Prüfe, ob es ein Blob ist und lese es als Text aus
            if (metadataData.body instanceof Blob) {
              const metadataText = await metadataData.body.text();
              if (!metadataText) return null;

              const metadata = JSON.parse(metadataText);
              const fileUrl = await getUrl({ path: metadata.filePath });

              return { name: metadata.fileName, url: fileUrl.url.toString() };
            } else {
              console.error("Unerwartetes Format von metadataData:", metadataData);
              return null;
            }
          } catch (error) {
            console.error("Fehler beim Abrufen der Metadaten:", error);
            return null;
          }
        })
    )).filter((item): item is { name: string; url: string } => item !== null);

    fileList.value = fileList.value.filter(Boolean);
  } catch (error) {
    console.error("Fehler beim Laden der Dateien", error);
  }
};






// 🔎 Filtert die Datei-Liste nach dem Suchbegriff
const filteredFiles = computed(() => {
  return fileList.value.filter(file =>
      file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

onMounted(fetchFileList);
</script>

<template>
  <div>
    <input type="file" ref="fileInput" @change="uploadFiles" multiple style="display: none" />
    <button @click="triggerFileSelect">Dateien auswählen & Hochladen</button>
    <button @click="deleteSelectedFiles" :disabled="selectedFiles.size === 0">
      Ausgewählte Dateien löschen
    </button>

    <input v-model="searchQuery" placeholder="Dateiname suchen..." />

    <ul>
      <li v-for="file in filteredFiles" :key="file.name">
        <input type="checkbox" @change="toggleFileSelection(file.name)" :checked="selectedFiles.has(file.name)" />
        <a :href="file.url" download>{{ file.name }}</a>
      </li>
    </ul>
  </div>
</template>
