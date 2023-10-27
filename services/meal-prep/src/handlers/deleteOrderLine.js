const { deleteItem } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
    try {
        const keySchema = {"PK":"orderId","SK":"orderLineId"};
        const orderId = event?.pathParameters?.order_id;
        const lineId = event?.pathParameters?.line_id;
        
        if (!orderId || !lineId)
            throw {
                statusCode: 400,
                message: "invalid param"
            }

        let Item = {
            [keySchema.PK]: orderId,
            [keySchema.SK]: `LINE#${lineId}`
        };

        await deleteItem(TableName, Item);
        return buildResponse(200, { message: `Deleted Line ID: ${lineId} from Order ID: ${orderId} successfully` });
    } catch (error) {
        return errorResponse(error);
    }
};

module.exports = { handler };
