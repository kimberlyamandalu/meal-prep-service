const { putItem } = require("../helpers/dynamo");
const { randomUUID } = require("crypto");
const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;
const handler = async (event) => {
    try {
        const cognitoUserId = event?.requestContext?.authorizer?.claims?.sub;
        const keySchema = {"PK":"orderId","SK":"orderLineId"};

        const order = JSON.parse(event.body);
        const orderId = randomUUID();
        const now = new Date().toISOString();

        let Item = {
            [keySchema.PK]: orderId,
            [keySchema.SK]: "HEADER",
            ...order,
            createdAt: now,
            updatedAt: now
        };
        
        if (cognitoUserId) 
            Item.cognitoUserId = cognitoUserId;

        await putItem(TableName, Item);
        return buildResponse(201, Item);
    } catch (error) {
        return errorResponse(error);
    }
};

module.exports = { handler };
