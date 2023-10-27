const {
	getItemsByPartitionKey
} = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/getOrderLines.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/getOrderLines')

const { describe, it, expect } = require('@jest/globals')

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

const TableName = process.env.DYNAMODB_TABLE
const keySchema = {"PK":"orderId","SK":"orderLineId"}

describe('Test getOrderLines handler', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 200 response', async () => {
		const orderId = eventJSON.pathParameters.order_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub
		const keyConditionExpression = `${keySchema.PK} = :PK AND begins_with(${keySchema.SK}, :SK)`;
    const expressionAttributeValues = { ":PK": orderId, ":SK": "LINE#" }

		const expectedItems = expect.objectContaining({
			Items: expect.any(Array)
		})

		const expectedResponse = buildResponse(200, expectedItems.Items)

		getItemsByPartitionKey.mockResolvedValue({ Item: expectedItems })
		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(eventJSON)

		expect(getItemsByPartitionKey).toHaveBeenCalledTimes(1)
		expect(getItemsByPartitionKey).toHaveBeenCalledWith(TableName, keyConditionExpression, expressionAttributeValues)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(200, expectedItems.Items)
	})
})

describe('Test getOrderLines handler invalid params', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 400 error response if order_id is not provided', async () => {
		const errorJSON = JSON.parse(JSON.stringify(eventJSON))
		errorJSON.pathParameters.order_id = undefined
		const expectedError = { statusCode: 400, message: 'invalid param' }

		errorResponse.mockReturnValue(expectedError)

		const result = await handler(errorJSON)

		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
		expect(result).toEqual(expectedError)
	})
})

describe('Test getOrderLines handler order lines not found', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 400 error response if order lines are not found', async () => {
		const orderId = eventJSON.pathParameters.order_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub
		const expectedError = { statusCode: 400, message: 'Item not found' }
		const keyConditionExpression = `${keySchema.PK} = :PK AND begins_with(${keySchema.SK}, :SK)`;
    const expressionAttributeValues = { ":PK": orderId, ":SK": "LINE#" }

		getItemsByPartitionKey.mockResolvedValue({})
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(eventJSON)

		expect(getItemsByPartitionKey).toHaveBeenCalledTimes(1)
		expect(getItemsByPartitionKey).toHaveBeenCalledWith(TableName, keyConditionExpression, expressionAttributeValues)
		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
		expect(result).toEqual(expectedError)
	})
})
