const { getItemsByPartitionKey } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
    try {
        const keySchema = {"PK":"orderId","SK":"orderLineId"};
        const orderId = event.pathParameters?.order_id;

        let Item = {
            [keySchema.PK]: orderId
        };
        const keyConditionExpression = `${keySchema.PK} = :PK AND begins_with(${keySchema.SK}, :SK)`;
        const expressionAttributeValues = { ":PK": orderId, ":SK": "LINE#" }
        const orderLines = await getItemsByPartitionKey(TableName, keyConditionExpression, expressionAttributeValues);

        if (!orderLines.Items)
            throw {
                statusCode: 400,
                message: "Item not found"
            };

        return buildResponse(200, orderLines.Items);
    } catch (error) {
        return errorResponse(error);
    }
};

module.exports = { handler };
