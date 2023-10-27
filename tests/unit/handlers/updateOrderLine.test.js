const {
	updateItem
} = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/updateOrderLine.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/updateOrderLine')

const { describe, it, expect } = require('@jest/globals')

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

const TableName = process.env.DYNAMODB_TABLE
const keySchema = {"PK":"orderId","SK":"orderLineId"}

describe('Test updateOrderLine handler success', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 200 success response if an order line is updated', async () => {
		const body = JSON.parse(eventJSON.body)
		const orderId = eventJSON.pathParameters?.order_id
		const lineId = eventJSON.pathParameters?.line_id
		keySchema.PKV = eventJSON.requestContext.authorizer.claims.sub
		const subTotal = (parseFloat(body.price) * parseInt(body.quantity)).toFixed(2)
		const updateExpression = "SET #mealId = :mealId, #quantity = :quantity, #price = :price, #subTotal = :subTotal, #updatedAt = :updatedAt";
		const expressionAttributeNames = {
				"#mealId": "mealId",
				"#quantity": "quantity",
				"#price": "price",
				"#subTotal": "subTotal",
				"#updatedAt": "updatedAt"
		};
		const expressionAttributeValues = expect.objectContaining({
				":mealId": body.mealId,
				":quantity": body.quantity,
				":price": body.price,
				":subTotal": subTotal,
				":updatedAt": expect.any(String)
		})

		const Item = {
			[keySchema.PK]: orderId,
			[keySchema.SK]: `LINE#${lineId}`
		}

		const expectedItem = expect.objectContaining({
			...body,
			subTotal,
			...Item
		})

		const expectedResponse = buildResponse(200, { updatedItem: expectedItem})

		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(eventJSON)
		
		expect(updateItem).toHaveBeenCalledWith(TableName, Item, updateExpression, expressionAttributeNames, expressionAttributeValues)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(200, { updatedItem: expectedItem })
	})
})

describe('Test updateOrderLine handler invalid param', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return a 400 response when order_id or line_id is not provided', async () => {
		const errorJSON = JSON.parse(JSON.stringify(eventJSON))
		errorJSON.pathParameters = {}

		const expectedError = { statusCode: 400, message: 'invalid param' }

		updateItem.mockRejectedValue(expectedError)
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(errorJSON)

		expect(result).toEqual(expectedError)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
	})
})

describe('Test updateOrderLine handler server error', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 500 response when an error occurs', async () => {
		const expectedError = { statusCode: 500, message: 'server error' }

		updateItem.mockRejectedValue(expectedError)
		errorResponse.mockReturnValue(expectedError)

		const result = await handler(eventJSON)

		expect(result).toEqual(expectedError)
		expect(errorResponse).toHaveBeenCalledWith(expectedError)
	})
})
