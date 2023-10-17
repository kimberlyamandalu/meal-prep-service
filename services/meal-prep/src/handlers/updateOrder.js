const { putItem } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
    try {
        const keySchema = {"PK":"orderId","SK":"orderLineId"};
        if (event.requestContext.authorizer) {
            // set primary key value equal to cognito id
            keySchema.PKV = event.requestContext.authorizer.claims.sub;
        } else if (event.queryStringParameters) {
            // if no cognito id, set primary key value equal to query string param e.g. ?userId=xyz
            keySchema.PKV = event.queryStringParameters[keySchema.PK];
        } else {
            throw { statusCode: 400, message: "invalid param" };
        }

        const id = event.pathParameters?.id;

        const now = new Date().toISOString();

        if (!id) {
            throw { statusCode: 400, message: "invalid param" };
        }

        const item = JSON.parse(event.body);

        let Item = {
            [keySchema.PK]: `USER#${keySchema.PKV}`,
            [keySchema.SK]: `ITEM#${id}`,
            ...item,
            updatedAt: now
        };

        await putItem(TableName, Item);
        return buildResponse(200, { message: "success" });
    } catch (error) {
        return errorResponse(error);
    }
};

module.exports = { handler };
