// src/composables/useFileUpload.ts
import { ref } from "vue";
import { uploadData, getUrl } from "aws-amplify/storage";
import type { FileItem } from "@/types/FileTypes";

export function useFileUpload() {
    const fileList = ref<FileItem[]>([]);

    const uploadFiles = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (!files || files.length === 0) return;

        const uploadPromises = Array.from(files).map(async (file) => {
            const path = `picture-submissions/${file.name}`;
            await uploadData({ data: file, path });
            const linkToStorageFile = await getUrl({ path });
            fileList.value.push({
                name: file.name,
                url: linkToStorageFile.url.toString(),
                path: `picture-submissions/${file.name}`
            });
        });

        await Promise.all(uploadPromises);
        target.value = "";
    };

    return { fileList, uploadFiles };
}
