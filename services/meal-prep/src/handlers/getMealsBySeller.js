const { getItem } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
    try {
        const id = event.pathParameters?.id;

        if (!id) {
            throw { statusCode: 400, message: "invalid param" };
        }

        const keySchema = {"PK":"mealId"};

        let Item = {
            [keySchema.PK]: id
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
