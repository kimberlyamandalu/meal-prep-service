const { Logger, injectLambdaContext } = require("@aws-lambda-powertools/logger");
const middy = require("@middy/core");
const { queryItemByIndex } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");

const logger = new Logger({ serviceName: process.env.AWS_LAMBDA_FUNCTION_NAME });
const TableName = process.env.DYNAMODB_TABLE;
const IndexName = "seller-gsi"

const handler = async (event) => {
    try {
        const seller = event.pathParameters?.seller;
        const queryInput = {
          TableName,
          IndexName,
          KeyConditionExpression: 'seller = :seller',
          ExpressionAttributeValues: {
            ':seller': seller
          },
          ProjectionExpression: 'mealId, seller'
        };
    
        const ddbRes = await queryItemByIndex(queryInput);
        if (!ddbRes.Items)
          throw {
            statusCode: 400,
            message: "Item not found"
          };
        
        logger.info("Meals by Seller", { data: ddbRes.Items})
        return buildResponse(200, ddbRes.Items);
      } catch (error) {
        logger.error("Error getting meals by seller", { error });
        return errorResponse(error);
      }
};

module.exports = { handler: middy(handler).use(injectLambdaContext(logger, { logEvent: true })) };
