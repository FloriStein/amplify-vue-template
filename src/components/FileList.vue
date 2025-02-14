<template>
  <div>
    <input v-model="localSearchQuery" placeholder="Dateiname suchen..." />
    <ul>
      <li v-for="file in filteredFiles" :key="file.name">
        <input
            type="checkbox"
            @change="toggleFileSelection(file.name)"
            :checked="selectedFiles.has(file.name)"
        />
        <a href="#" @click.prevent="openFileUrl(file)">{{ file.name }}</a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { getUrl } from "aws-amplify/storage";
import type { FileItem } from "@/types/types";

const props = defineProps<{
  fileList: FileItem[];
  selectedFiles: Set<string>;
}>();

const emit = defineEmits<{
  (e: "toggleSelection", fileName: string): void;
}>();

const localSearchQuery = ref("");

const filteredFiles = computed(() =>
    props.fileList.filter((file) =>
        file.name.toLowerCase().includes(localSearchQuery.value.toLowerCase())
    )
);

const toggleFileSelection = (fileName: string) => {
  emit("toggleSelection", fileName);
};

const openFileUrl = async (file: FileItem) => {
  try {
    // getUrl nur beim tatsächlichen Öffnen der Datei aufrufen
    const fileUrl = await getUrl({
      path: file.path,
      options: { expiresIn: 5 }
    });
    const url = fileUrl.url.toString();

    // URL direkt im neuen Tab öffnen
    window.open(url, "_blank");
  } catch (error) {
    console.error(`Fehler beim Laden der URL für ${file.name}`, error);
  }
};

defineExpose({});
</script>
