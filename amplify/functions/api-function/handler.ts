import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

// Initialisiere den DynamoDB-Client für die Region, in der deine Tabelle liegt
const client = new DynamoDBClient({ region: "eu-central-1" });

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
        // Erstelle einen Scan-Befehl, um alle Items aus der Tabelle abzurufen
        const command = new ScanCommand({
            TableName: "fileHoster_MetaData",
        });

        const response = await client.send(command);
        console.log("DynamoDB Response: ", response);

        // Mappen der Items in ein einfaches JSON-Format:
        const items = response.Items?.map((item) => ({
            fileName: item.fileName?.S,
            filePath: item.filePath?.S,
            bucket: item.bucket?.S,
            uploadedAt: item.uploadedAt?.S,
            size: item.size?.N,
        })) || [];

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Erlaubt alle Ursprünge
                "Access-Control-Allow-Headers": "*", // Erlaubt alle Header
            },
            body: JSON.stringify(items),
        };
    } catch (error) {
        console.error("Error retrieving metadata:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};
