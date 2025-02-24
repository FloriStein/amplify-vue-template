import "./assets/main.css";
import { createApp } from "vue";
import App from "./App.vue";
import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";
import outputs from "../amplify_outputs.json";

// Amplify-Konfiguration aus amplify_outputs.json parsen
const amplifyConfig = parseAmplifyConfig(outputs);

// Amplify konfigurieren und REST API hinzufügen
Amplify.configure({
    ...amplifyConfig,
    API: {
        ...amplifyConfig.API,
        REST: outputs.custom.API, // Stellt sicher, dass REST API aus den Amplify Outputs verfügbar ist
    },
});

// Vue-App erstellen und mounten
createApp(App).mount("#app");
