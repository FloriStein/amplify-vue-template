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

const backend = defineBackend({
  auth,
  data,
  storage,
  myApiFunction,
});

// API-Stack erstellen
const apiStack = backend.createStack("api-stack");

// REST API erstellen
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "myRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: ["https://main.d248rsenz0szsk.amplifyapp.com/"], // Passe dies auf die vertrauenswürdigen Ursprünge an
    allowMethods: Cors.ALL_METHODS, // Verfügbar für alle Methoden
    allowHeaders: Cors.DEFAULT_HEADERS, // Standard-Header
  },
});

// Lambda-Integration erstellen
const lambdaIntegration = new LambdaIntegration(
    backend.myApiFunction.resources.lambda
);

// Endpunkt "/metadata" mit IAM-Authentifizierung
const metadataPath = myRestApi.root.addResource("metadata", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM, // IAM Authentifizierung
  },
});
metadataPath.addMethod("GET", lambdaIntegration); // Daten für alle Dateien
metadataPath.addMethod("POST", lambdaIntegration); // Daten für Dateien hochladen
metadataPath.addMethod("DELETE", lambdaIntegration); // Dateien löschen
metadataPath.addMethod("PUT", lambdaIntegration); // Dateien aktualisieren

// Endpunkt für einzelne Datei
const fileMetadataPath = metadataPath.addResource("{fileName}", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM, // IAM Authentifizierung
  },
});
fileMetadataPath.addMethod("GET", lambdaIntegration); // Abfragen von Metadaten einer einzelnen Datei
fileMetadataPath.addMethod("DELETE", lambdaIntegration); // Löschen einer Datei
fileMetadataPath.addMethod("PUT", lambdaIntegration); // Aktualisieren einer Datei

// Proxy-Route für flexible API-Erweiterung
metadataPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});

// Cognito-Authorizer erstellen für geschützte Endpunkte
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// Geschützter Endpunkt "/secure-metadata" mit Cognito-Authentifizierung
const secureMetadataPath = myRestApi.root.addResource("secure-metadata");
secureMetadataPath.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// IAM-Policy für API-Zugriff erstellen
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/metadata", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/metadata/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/secure-metadata", "dev")}`,
      ],
    }),
  ],
});

// Policy an authentifizierte und nicht authentifizierte IAM-Rollen anhängen
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);

// API-Details in die Amplify-Konfiguration ausgeben
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
