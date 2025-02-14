// src/composables/useFileUploader.ts
import { uploadFile } from "@/services/storageService";

export function useFileUploader() {
    /**
     * Lädt alle übergebenen Dateien hoch.
     * @param files - FileList von ausgewählten Dateien
     */
    const uploadFiles = async (files: FileList) => {
        if (!files || files.length === 0) return;

        const uploadPromises = Array.from(files).map(async (file) => {
            await uploadFile(file);
        });
        await Promise.all(uploadPromises);
    };

    return { uploadFiles };
}
