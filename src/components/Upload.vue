<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { uploadData, downloadData, list, getUrl, remove } from "aws-amplify/storage";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const fileInput = ref<HTMLInputElement | null>(null);
const fileList = ref<{ name: string; path: string; url: string }[]>([]);
const selectedFiles = ref<Set<string>>(new Set());
const searchQuery = ref("");

// 📁 Trigger für Dateiauswahl
const triggerFileSelect = () => {
  fileInput.value?.click();
};

// 🔄 Datei-Auswahl umschalten
const toggleFileSelection = (fileName: string) => {
  if (selectedFiles.value.has(fileName)) {
    selectedFiles.value.delete(fileName);
  } else {
    selectedFiles.value.add(fileName);
  }
};

// 🗑️ Ausgewählte Dateien löschen
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

// ⬆️ Dateien hochladen
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
          fileList.value.push({ name: file.name, path, url: linkToStorageFile.url.toString() });
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

// 🔽 Dateien als ZIP herunterladen
const downloadSelectedFilesAsZip = async () => {
  const filesToDownload = Array.from(selectedFiles.value);
  if (filesToDownload.length === 0) return;

  const zip = new JSZip();

  try {
    await Promise.all(
        filesToDownload.map(async (fileName) => {
          const path = `picture-submissions/${fileName}`;
          const fileResponse = await downloadData({ path });
          const fileData = await fileResponse.result;

          if (fileData.body instanceof Blob) {
            const arrayBuffer = await fileData.body.arrayBuffer();
            zip.file(fileName, arrayBuffer);
          } else {
            console.error(`Unerwartetes Format für ${fileName}`, fileData);
          }
        })
    );

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "download.zip");
  } catch (error) {
    console.error("Fehler beim Herunterladen der Dateien:", error);
  }
};

// 🔄 Datei-Liste abrufen
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
                    path: metadata.filePath, // ✅ Path wird gespeichert
                    url: "" // URL wird erst später geladen
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
    ).filter((item): item is { name: string; path: string; url: string } => item !== null);

  } catch (error) {
    console.error("Fehler beim Laden der Dateien", error);
  }
};


const requestFileUrl = async (file: { name: string; path: string; url: string }) => {
  if (!file.url) {
    try {
      const fileUrl = await getUrl({ path: file.path });
      file.url = fileUrl.url.toString();
    } catch (error) {
      console.error(`Fehler beim Laden der URL für ${file.name}`, error);
    }
  }
  window.open(file.url, "_blank");
};



// 🔎 Datei-Liste nach Suchbegriff filtern
const filteredFiles = computed(() => {
  return fileList.value.filter((file) =>
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
    <button @click="downloadSelectedFilesAsZip" :disabled="selectedFiles.size === 0">
      Ausgewählte Dateien als ZIP herunterladen
    </button>

    <input v-model="searchQuery" placeholder="Dateiname suchen..." />

    <ul>
      <li v-for="file in filteredFiles" :key="file.name">
        <input
            type="checkbox"
            @change="toggleFileSelection(file.name)"
            :checked="selectedFiles.has(file.name)"
        />
        <a href="#" @click.prevent="requestFileUrl(file)">{{ file.name }}</a>
      </li>
    </ul>
  </div>
</template>
