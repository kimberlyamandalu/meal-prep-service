const { getItem } = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/getItemById.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/getItemById')

const { describe, it, expect } = require('@jest/globals')

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

const TableName = process.env.DYNAMODB_TABLE
const keySchema = {"PK":"mealId"}

describe('Test getItemById handler success', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 200 response if item is found', async () => {
		const id = eventJSON.pathParameters.id
		const cognitoUserId = eventJSON.requestContext.authorizer.claims.sub

		const Item = {
			[keySchema.PK]: id
		}
		const expectedItem = expect.objectContaining({
			[keySchema.PK]: id,
			cognitoUserId,
			productName: expect.any(String),
			productPrice: expect.any(String),
			createdAt: expect.any(String),
			updatedAt: expect.any(String)
		})

		const expectedResponse = buildResponse(200, expectedItem)

		getItem.mockResolvedValue({ Item: expectedItem })
		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(eventJSON)

		expect(getItem).toHaveBeenCalledTimes(1)
		expect(getItem).toHaveBeenCalledWith(TableName, Item)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(200, expectedItem)
	})
})

describe('Test getItemById handler invalid param', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 400 error response if id is not provided', async () => {
		const errorJSON = { pathParameters: {} }
		const expectedError = { statusCode: 400, message: 'invalid param' }

		errorResponse.mockReturnValue(expectedError)

		const result = await handler(errorJSON)

		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
		expect(result).toEqual(expectedError)
	})
})
describe('Test getItemById handler Item not found', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 400 error response if item is not found', async () => {
		const id = eventJSON.pathParameters.id
		const expectedError = { statusCode: 400, message: 'Item not found' }

		getItem.mockResolvedValue({})
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(eventJSON)

		expect(getItem).toHaveBeenCalledTimes(1)
		expect(getItem).toHaveBeenCalledWith(TableName, { [keySchema.PK]: id })
		expect(result).toEqual(expectedError)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
	})
})
