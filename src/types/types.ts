// src/types/types.ts
export interface FileItem {
    name: string;
    path: string;
    url?: string;  // Optional, da die URL on-demand generiert wird
}