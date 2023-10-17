const {
	putItem
} = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/updateItemById.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/updateItemById')

const { describe, it, expect } = require('@jest/globals')

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

const TableName = process.env.DYNAMODB_TABLE
const keySchema = {"PK":"orderId","SK":"orderItemId"}
describe('Test updateItemById handler success', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 200 success response if an item is updated', async () => {
		const body = JSON.parse(eventJSON.body)
		const id = eventJSON.pathParameters?.id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub

		const expectedItem = expect.objectContaining({
			...body,
			[keySchema.PK]: `USER#${keySchema.PKV}`,
			[keySchema.SK]: `ITEM#${id}`,
			updatedAt: expect.any(String)
		})

		const expectedResponse = buildResponse(200, expectedItem)
		putItem.mockResolvedValueOnce({})
		buildResponse.mockReturnValue(expectedResponse)
		const result = await handler(eventJSON)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(200, expectedItem)
	})
})

describe('Test updateItemById handler invalid param', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 400 response when id is not provided', async () => {
		const errorJSON = JSON.parse(JSON.stringify(eventJSON))
		errorJSON.pathParameters = {}

		const expectedError = { statusCode: 400, message: 'invalid param' }

		putItem.mockRejectedValue(expectedError)
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(errorJSON)

		expect(result).toEqual(expectedError)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
	})
})

describe('Test updateItemById handler server error', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 500 response when an error occurs', async () => {
		const expectedError = { statusCode: 500, message: 'server error' }

		putItem.mockRejectedValue(expectedError)
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(eventJSON)

		expect(result).toEqual(expectedError)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
	})
})
