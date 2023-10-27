const {
	getItem
} = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/getOrder.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/getOrder')

const { describe, it, expect } = require('@jest/globals')

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

const TableName = process.env.DYNAMODB_TABLE
const keySchema = {"PK":"orderId","SK":"orderLineId"}

describe('Test getOrder handler', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 200 response if order is found', async () => {
		const orderId = eventJSON.pathParameters.order_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub

		const Item = {
			[keySchema.PK]: orderId,
			[keySchema.SK]: "HEADER"
		}
		const expectedItem = expect.objectContaining({
			[keySchema.PK]: orderId,
			[keySchema.SK]: "HEADER",
			customer: expect.any(String),
			status: expect.any(String),
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

describe('Test getOrder handler invalid params', () => {
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

describe('Test getOrder handler order header not found', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 400 error response if order is not found', async () => {
		const orderId = eventJSON.pathParameters.order_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub
		const expectedError = { statusCode: 400, message: 'Item not found' }

		const Item = {
			[keySchema.PK]: orderId,
			[keySchema.SK]: "HEADER"
		}

		getItem.mockResolvedValue({ Item: undefined })
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(eventJSON)

		// expect(getItem).toHaveBeenCalledTimes(1)
		// expect(getItem).toHaveBeenCalledWith(TableName, Item)
		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
		expect(result).toEqual(expectedError)
	})
})
