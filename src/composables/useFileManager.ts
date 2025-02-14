// src/composables/useFileManager.ts
import { ref, onMounted } from "vue";
import { listFiles, getFileUrl } from "@/services/storageService";

export interface FileData {
    name: string;
    path: string;
    url: string;
}

export function useFileManager() {
    const fileList = ref<FileData[]>([]);
    const selectedFiles = ref(new Set<string>());

    const fetchFileList = async () => {
        try {
            const items = await listFiles("metadata/");
            // Beispielhafte Verarbeitung – passe dies an deine Metadatenstruktur an:
            const files: FileData[] = await Promise.all(
                items.map(async (item: any) => ({
                    name: item.key, // oder item.fileName, falls vorhanden
                    path: item.key,
                    url: ""
                }))
            );
            fileList.value = files;
        } catch (error) {
            console.error("Fehler beim Laden der Dateien", error);
        }
    };

    const refreshFileList = async () => {
        await fetchFileList();
        selectedFiles.value.clear();
    };

    const handleOpenFile = async (file: FileData) => {
        if (!file.url) {
            try {
                file.url = await getFileUrl(file.path);
            } catch (error) {
                console.error(`Fehler beim Laden der URL für ${file.name}`, error);
                return;
            }
        }
        window.open(file.url, "_blank");
    };

    onMounted(fetchFileList);

    return {
        fileList,
        selectedFiles,
        refreshFileList,
        handleOpenFile
    };
}
