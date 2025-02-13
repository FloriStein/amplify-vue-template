// src/composables/useFileDownload.ts
import { ref } from "vue";
import { downloadData, getUrl } from "aws-amplify/storage";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { FileItem } from "@/types/FileTypes";

export function useFileDownload() {
    const selectedFiles = ref<Set<string>>(new Set());

    const toggleFileSelection = (fileName: string) => {
        if (selectedFiles.value.has(fileName)) {
            selectedFiles.value.delete(fileName);
        } else {
            selectedFiles.value.add(fileName);
        }
    };

    const downloadSelectedFiles = async (files: FileItem[]) => {
        const zip = new JSZip();
        const filesToDownload = files.filter(file => selectedFiles.value.has(file.name));

        await Promise.all(
            filesToDownload.map(async (file) => {
                //const { path } = file;
                const downloadResponse = await downloadData({ path: `picture-submissions/${file.name}` });

                //const blob = downloadResponse.body as Blob;
                //const downloadResponse = await downloadData({ path: file.path });
                const blob = downloadResponse as unknown as Blob;

                zip.file(file.name, blob);
            })
        );

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "downloaded_files.zip");
    };

    return { selectedFiles, toggleFileSelection, downloadSelectedFiles };
}
