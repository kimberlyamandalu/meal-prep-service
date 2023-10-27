const { queryItemByIndex } = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/getMealsBySeller.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/getMealsBySeller')

const { describe, it, expect } = require('@jest/globals')

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

const TableName = process.env.DYNAMODB_TABLE

describe('Test getMealsBySeller handler success', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 200 response ', async () => {
		const seller = eventJSON.pathParameters.seller

		const expectedQuery = {
			TableName,
			IndexName: expect.any(String),
			KeyConditionExpression: expect.any(String),
			ExpressionAttributeValues: {
				":seller": seller
			},
			ProjectionExpression: expect.any(String)
		}
		const expectedMeals = expect.objectContaining({
			Items: expect.any(Array)
		})

		const expectedResponse = buildResponse(200, expectedMeals)

		queryItemByIndex.mockResolvedValue(expectedMeals)
		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(eventJSON)

		expect(queryItemByIndex).toHaveBeenCalledTimes(1)
		expect(queryItemByIndex).toHaveBeenCalledWith(expectedQuery)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(200, expectedMeals)
	})
})

describe('Test getMealsBySeller handler invalid param', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 400 error response if seller is not provided', async () => {
		const errorJSON = { pathParameters: {} }
		const expectedError = { statusCode: 400, message: 'invalid param' }

		errorResponse.mockReturnValue(expectedError)

		const result = await handler(errorJSON)

		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
		expect(result).toEqual(expectedError)
	})
})

describe('Test getMealsBySeller handler internal server error', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 500 error response if internal server error', async () => {
		const expectedError = { statusCode: 500, message: 'Internal Server Error' }
		const internalServerError = new Error('Internal Server Error')
		internalServerError.statusCode = 500

		queryItemByIndex.mockRejectedValue(internalServerError)
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(eventJSON)

		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(internalServerError)
		expect(result).toEqual(expectedError)
	})
})