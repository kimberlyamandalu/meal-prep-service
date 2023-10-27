const { Logger, injectLambdaContext } = require("@aws-lambda-powertools/logger");
const { queryItemByIndex } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const middy = require("@middy/core");

const logger = new Logger({ serviceName: process.env.AWS_LAMBDA_FUNCTION_NAME });
const TableName = process.env.DYNAMODB_TABLE;
const IndexName = "category-gsi";

const handler = async (event) => {
  try {
    const categoryId = event?.pathParameters?.category_id;

    if (!categoryId)
      throw {
        statusCode: 400,
        message: "invalid param"
      }

    const queryInput = {
      TableName,
      IndexName,
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': categoryId
      },
      ProjectionExpression: 'mealId, seller'
    };

    const ddbRes = await queryItemByIndex(queryInput);
    if (!ddbRes.Items)
      throw {
        statusCode: 400,
        message: "Item not found"
      };

    logger.info("Meals by Category", { data: ddbRes.Items})
    return buildResponse(200, ddbRes.Items);
  } catch (error) {
    logger.error("Error getting meals by Category", { error });
    return errorResponse(error);
  }
};

module.exports = { handler: middy(handler).use(injectLambdaContext(logger, { logEvent: true })) };