const {
	putItem
} = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/createOrderLine.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/createOrderLine')

const { describe, it, expect } = require('@jest/globals')

const TableName = process.env.DYNAMODB_TABLE
const keySchema = {"PK":"orderId","SK":"orderLineId"}

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

describe('Test createOrderLine handler success', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 201 response when an order line is created', async () => {
		const orderLine = JSON.parse(eventJSON.body)
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub

		const expectedOrderLine = expect.objectContaining({
			...orderLine,
			subTotal: (parseFloat(orderLine.price) * parseInt(orderLine.quantity)).toFixed(2),
			[keySchema.PK]: expect.any(String),
			[keySchema.SK]: expect.any(String),
			createdAt: expect.any(String),
			updatedAt: expect.any(String)
		})

		const expectedResponse = buildResponse(201, expectedOrderLine)

		putItem.mockResolvedValueOnce({})
		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(eventJSON)

		expect(putItem).toHaveBeenCalledTimes(1)
		expect(putItem).toHaveBeenCalledWith(TableName, expectedOrderLine)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(201, expectedOrderLine)
	})
})

describe('Test createOrderLine handler invalid param', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 400 response when there is no Secondary Key', async () => {
		const errorJSON = {
			body: JSON.stringify({}),
			requestContext: {},
			pathParameters: {
				order_id: "errorOrder"
			}
		}
		const error = new Error('invalid param')
		error.statusCode = 400

		errorResponse.mockReturnValue({
			statusCode: error.statusCode,
			message: error.message
		})

		putItem.mockRejectedValueOnce(error)
		
		const result = await handler(errorJSON)

		expect(errorResponse).toHaveBeenCalledWith(error)
		expect(result).toEqual(errorResponse(error))
	})
})

describe('Test createOrderLine handler server error', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 500 response when an error occurs', async () => {
		const error = new Error('server error')
		error.statusCode = 500

		errorResponse.mockReturnValue({
			statusCode: error.statusCode,
			message: error.message
		})

		putItem.mockRejectedValueOnce(error)
		const result = await handler(eventJSON)

		expect(result).toEqual(errorResponse(error))
		expect(putItem).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(error)
		expect(result).toEqual(errorResponse(error))
	})
})
