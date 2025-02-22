import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { myApiFunction } from "./functions/api-function/resource";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";

// Definiere dein Backend mit den vorhandenen Ressourcen
const backend = defineBackend({
  auth,
  storage,
  data,
  myApiFunction,
});

// Erstelle einen neuen API-Stack
const apiStack = backend.createStack("api-stack");

// Erstelle ein neues REST API mit einer Stage "dev" und Standard-CORS-Einstellungen
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "myRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});

// Erstelle eine Lambda-Integration, die deine API-Funktion verwendet
const lambdaIntegration = new LambdaIntegration(
    backend.myApiFunction.resources.lambda
);

// === Neuer Endpunkt: "/metadata" ===
// Dieser Endpunkt ruft per GET-Methode die Meta-Daten aus der Datenbank ab.
const metaDataPath = myRestApi.root.addResource("metadata", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM, // oder z. B. COGNITO, wenn du einen Authorizer nutzen möchtest
  },
});
metaDataPath.addMethod("GET", lambdaIntegration);

// Optional: Falls du weitere Operationen (z. B. POST, PUT, DELETE) benötigst, kannst du diese hinzufügen
// metaDataPath.addMethod("POST", lambdaIntegration);
// metaDataPath.addMethod("PUT", lambdaIntegration);
// metaDataPath.addMethod("DELETE", lambdaIntegration);

// (Optional) Beispiel: Ein weiterer Endpunkt mit Cognito-Authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});
const secureMetaPath = myRestApi.root.addResource("secure-meta", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
  },
});
secureMetaPath.addMethod("GET", lambdaIntegration, {
  authorizer: cognitoAuth,
});

// Erstelle eine IAM-Policy, um den Zugriff (Invoke) auf die API zu erlauben
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/metadata", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/metadata/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/secure-meta", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/secure-meta/*", "dev")}`,
      ],
    }),
  ],
});

// Hänge die Policy an die IAM-Rollen für authentifizierte und nicht authentifizierte Benutzer
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);

// Füge Outputs hinzu, damit die API-Details in der Amplify-Konfiguration verfügbar sind
backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
});
