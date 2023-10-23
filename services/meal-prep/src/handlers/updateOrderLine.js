const { updateItem } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
    try {
        const keySchema = {"PK":"orderId","SK":"orderLineId"};
        const orderId = event.pathParameters?.order_id;
        const lineId = event.pathParameters?.line_id;
        const now = new Date().toISOString();

        const order = JSON.parse(event.body);
        const subTotal = parseFloat(order.price) * parseFloat(order.quantity);
        
        let Item = {
            [keySchema.PK]: orderId,
            [keySchema.SK]: `LINE#${lineId}`
        };

        const updateExpression = "SET #mealId = :mealId, #quantity = :quantity, #price = :price, #subTotal = :subTotal, #updatedAt = :updatedAt";
        const expressionAttributeNames = {
            "#mealId": "mealId",
            "#quantity": "quantity",
            "#price": "price",
            "#subTotal": "subTotal",
            "#updatedAt": "updatedAt"
        };
        const expressionAttributeValues = {
            ":mealId": order.mealId,
            ":quantity": order.quantity,
            ":price": order.price,
            ":subTotal": subTotal.toFixed(2),
            ":updatedAt": now
        }
        await updateItem(TableName, Item, updateExpression, expressionAttributeNames, expressionAttributeValues);
        return buildResponse(200, { updatedItem: Item });
    } catch (error) {
        return errorResponse(error);
    }
};

module.exports = { handler };
