const { deleteItem } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
    try {
        const keySchema = {"PK":"orderId","SK":"orderLineId"};
        const orderId = event.pathParameters.order_id;
        
        let Item = {
            [keySchema.PK]: orderId,
            [keySchema.SK]: "HEADER",
        };

        await deleteItem(TableName, Item);
        return buildResponse(200, { message: `Deleted Order ID: ${orderId} successfully` });
    } catch (error) {
        return errorResponse(error);
    }
};

module.exports = { handler };
