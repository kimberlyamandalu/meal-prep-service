const { getItem } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
    try {
        const keySchema = {"PK":"orderId","SK":"orderLineId"};
        const orderId = event?.pathParameters?.order_id;

        if (!orderId)
            throw {
                statusCode: 400,
                message: "invalid param"
            }

        let Item = {
            [keySchema.PK]: orderId,
            [keySchema.SK]: "HEADER"
        };

        const ddbRes = await getItem(TableName, Item);

        if (!ddbRes.Item)
            throw {
                statusCode: 400,
                message: "Item not found"
            };

        return buildResponse(200, ddbRes.Item);
    } catch (error) {
        return errorResponse(error);
    }
};

module.exports = { handler };
