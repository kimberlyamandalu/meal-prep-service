const {
	deleteItem
} = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/deleteOrder.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/deleteOrder')

const { describe, it, expect } = require('@jest/globals')

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

const TableName = process.env.DYNAMODB_TABLE
const keySchema = {"PK":"orderId","SK":"orderLineId"}

describe('Test deleteItemById handler success', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 204 success response if order is deleted', async () => {
		const orderId = eventJSON.pathParameters.order_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub
		const Item = {
			[keySchema.PK]: orderId,
			[keySchema.SK]: "HEADER"
		}
		const deleteSuccessMessage = `Deleted Order ID: ${orderId} successfully`
		const expectedResponse = buildResponse(204, { message: deleteSuccessMessage })
		
		deleteItem.mockResolvedValue({ Item: { message: deleteSuccessMessage }})
		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(eventJSON)

		expect(deleteItem).toHaveBeenCalledTimes(1)
		expect(result).toEqual(expectedResponse)
		expect(deleteItem).toHaveBeenCalledWith(TableName, Item)
		expect(buildResponse).toHaveBeenCalledWith(204, { message: deleteSuccessMessage })
	})
})

describe('Test deleteItemById handler invalid params', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 404 error response if order is not found', async () => {
		const orderId = eventJSON.pathParameters.order_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub

		const expectedError = { statusCode: 404, message: 'Item not found' }

		const Item = {
			[keySchema.PK]: orderId,
			[keySchema.SK]: `HEADER`
		}
		deleteItem.mockRejectedValue(expectedError)
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(eventJSON)

		expect(deleteItem).toHaveBeenCalledTimes(1)
		expect(result).toEqual(expectedError)
		expect(deleteItem).toHaveBeenCalledWith(TableName, Item)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
	})
})

describe('Test deleteOrder handler server error', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 500 error response if the server is down', async () => {
		const orderId = eventJSON.pathParameters.order_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub

		const Item = {
			[keySchema.PK]: orderId,
			[keySchema.SK]: "HEADER"
		}
		const expectedError = { statusCode: 500, message: 'error' }

		deleteItem.mockRejectedValueOnce(expectedError)
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(eventJSON)

		expect(deleteItem).toHaveBeenCalledTimes(1)
		expect(result).toEqual(expectedError)
		expect(deleteItem).toHaveBeenCalledWith(TableName, Item)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
	})
})

describe('Test deleteOrder handler invalid params', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 400 error response if order_id is not provided', async () => {
		const errorJSON = {}
		const expectedError = { statusCode: 400, message: 'invalid param' }

		errorResponse.mockReturnValue(expectedError)

		const result = await handler(errorJSON)
		expect(result).toEqual(expectedError)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
	})
})
