import { defineFunction } from "@aws-amplify/backend";

export const myApiFunction = defineFunction({
    name: "get-metadata-function",
    entry: "./handler.ts",          // Pfad zur Datei mit der Lambda-Handler-Funktion
             // Node.js Runtime-Version (aktuellste LTS-Version)
    memoryMB: 512,
    //runtime: "nodejs14.x",                   // 512 MB RAM
    timeoutSeconds: 10,             // Timeout von 10 Sekunden
});