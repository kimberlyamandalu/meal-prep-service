const {
	deleteItem
} = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/deleteOrderLine.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/deleteOrderLine')

const { describe, it, expect } = require('@jest/globals')

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

const TableName = process.env.DYNAMODB_TABLE
const keySchema = {"PK":"orderId","SK":"orderLineId"}

describe('Test deleteItemById handler success', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 204 success response if order line is deleted', async () => {
		const orderId = eventJSON.pathParameters.order_id
		const lineId = eventJSON.pathParameters.line_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub

		const Item = {
			[keySchema.PK]: orderId,
			[keySchema.SK]: `LINE#${lineId}`
		}

		const deleteSuccessMessage = `Deleted Line ID: ${lineId} from Order ID: ${orderId} successfully`
		const expectedResponse = buildResponse(204, { message: deleteSuccessMessage })

		deleteItem.mockResolvedValue({ Item: { message: deleteSuccessMessage } })
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
	it('should return a 404 error response if order line is not found', async () => {
		const orderId = eventJSON.pathParameters.order_id
		const lineId = eventJSON.pathParameters.line_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub

		const expectedError = { statusCode: 404, message: 'Item not found' }

		const Item = {
			[keySchema.PK]: orderId,
			[keySchema.SK]: `LINE#${lineId}`
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

describe('Test deleteOrderLine handler server error', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 500 error response if the server is down', async () => {
		const orderId = eventJSON.pathParameters.order_id
		const lineId = eventJSON.pathParameters.line_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub

		const Item = {
			[keySchema.PK]: orderId,
			[keySchema.SK]: `LINE#${lineId}`
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

describe('Test deleteOrderLine handler invalid params', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 400 error response if order_id or line_id is not provided', async () => {
		const errorJSON = JSON.parse(JSON.stringify(eventJSON))
		errorJSON.pathParameters = {}
		const expectedError = { statusCode: 400, message: 'invalid param' }

		errorResponse.mockReturnValue(expectedError)

		const result = await handler(errorJSON)
		expect(result).toEqual(expectedError)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
	})
})
