const { scan } = require("../helpers/dynamo");
const { buildResponse, errorResponse } = require("../helpers/response");
const { Logger } = require("@aws-lambda-powertools/logger");

const logger = new Logger({ serviceName: 'MealPrepService' });
const TableName = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
  logger.info(event)
  try {
    const scanInput = {
      TableName: TableName
    };

    const ddbRes = await scan(scanInput);

    logger.info("Full Menu", { data: ddbRes.Items});
    return buildResponse(200, ddbRes.Items);
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports = { handler };
