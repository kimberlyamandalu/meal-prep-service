const { putItem, getItemsByPartitionKey } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const TableName = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
    try {
        const cognitoUserId = event?.requestContext?.authorizer?.claims?.sub;
        const keySchema = {"PK":"orderId","SK":"orderLineId"};
        const orderId = event.pathParameters?.order_id;

        if (!orderId)
            throw {
                statusCode: 400,
                message: "invalid param"
            }

        const now = new Date().toISOString();

        const order = JSON.parse(event.body);

        let Item = {
            [keySchema.PK]: orderId,
            [keySchema.SK]: "HEADER",
            ...order,
            updatedAt: now
        };
        if (cognitoUserId) 
            Item.cognitoUserId = cognitoUserId;

        if (order.status == "CHECKOUT")
            Item.totalPrice = await calculateTotalOrderPrice(orderId, keySchema);

        await putItem(TableName, Item);
        return buildResponse(200, Item);
    } catch (error) {
        return errorResponse(error);
    }
};

async function calculateTotalOrderPrice(orderId, keySchema) {
    const keyConditionExpression = `${keySchema.PK} = :PK AND begins_with(${keySchema.SK}, :SK)`;
    const expressionAttributeValues = { ":PK": orderId, ":SK": "LINE#" }
    const orderLines = await getItemsByPartitionKey(TableName, keyConditionExpression, expressionAttributeValues);
    
    console.log("Order Lines: ", orderLines);

    // add up all the subTotals to calculate total order price
    const totalPrice = orderLines.Items.reduce(
        (total, orderLine) => total + parseFloat(orderLine.subTotal),
        0.00
    );

    // toFixed function returns a string with 2 digits after decimal point
    return totalPrice.toFixed(2);
}

module.exports = { handler };
