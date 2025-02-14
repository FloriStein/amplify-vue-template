// src/composables/useFileActions.ts
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { deleteFile, downloadFileData } from "@/services/storageService";

export function useFileActions() {
    /**
     * Löscht die übergebenen Dateien.
     * @param selectedFiles - Array mit Dateinamen
     * @param onComplete - Callback, der nach erfolgreichem Löschen aufgerufen wird.
     */
    const deleteFiles = async (
        selectedFiles: string[],
        onComplete?: () => void
    ) => {
        if (selectedFiles.length === 0) return;
        try {
            await Promise.all(selectedFiles.map((fileName) => deleteFile(fileName)));
            onComplete && onComplete();
        } catch (error) {
            console.error("Fehler beim Löschen der Dateien", error);
        }
    };

    /**
     * Lädt die ausgewählten Dateien herunter und packt sie in ein ZIP-Archiv.
     * @param selectedFiles - Array mit Dateinamen
     */
    const downloadZip = async (selectedFiles: string[]) => {
        if (selectedFiles.length === 0) return;

        const zip = new JSZip();
        try {
            await Promise.all(
                selectedFiles.map(async (fileName) => {
                    const fileData = await downloadFileData(fileName);
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

    return { deleteFiles, downloadZip };
}
