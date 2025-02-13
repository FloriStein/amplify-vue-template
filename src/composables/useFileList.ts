// src/composables/useFileList.ts
import { ref, computed } from "vue";
import { list } from "aws-amplify/storage";
import type { FileItem } from "@/types/FileTypes";

export function useFileList() {
    const fileList = ref<FileItem[]>([]);
    const searchQuery = ref("");

    const fetchFileList = async () => {
        try {
            const response = await list({ path: "metadata/" });
            fileList.value = response.items.map((item) => ({
                name: item.path.split("/").pop() as string,
                path: item.path, // ⬅️ Hier wird der path hinzugefügt
            }));

        } catch (error) {
            console.error("Fehler beim Laden der Dateien", error);
        }
    };

    const filteredFiles = computed(() => {
        return fileList.value.filter(file =>
            file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    });

    return { fileList, fetchFileList, filteredFiles, searchQuery };
}
