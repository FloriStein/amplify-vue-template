// src/composables/useFileListFilter.ts
import { ref, computed, type Ref } from "vue";
import type { FileData } from "../composables/useFileManager"; // oder einem anderen zentralen Ort, wo FileData definiert ist

export function useFileListFilter(fileList: Ref<FileData[]>) {
    const searchQuery = ref("");

    const filteredFiles = computed(() =>
        fileList.value.filter((file) =>
            file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    );

    return { searchQuery, filteredFiles };
}
