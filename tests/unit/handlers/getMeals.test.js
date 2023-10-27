const { scan } = require('../../../services/meal-prep/src/helpers/dynamo')
const {
	buildResponse,
	errorResponse
} = require('../../../services/meal-prep/src/helpers/response')
const eventJSON = require('../../../events/getMeals.json')
const {
	handler
} = require('../../../services/meal-prep/src/handlers/getMeals')

const { describe, it, expect } = require('@jest/globals')

jest.mock('../../../services/meal-prep/src/helpers/dynamo')
jest.mock('../../../services/meal-prep/src/helpers/response')

const TableName = process.env.DYNAMODB_TABLE

describe('Test getMeals handler success', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 200 response', async () => {
		const scanInput = {
			TableName
		}
		const expectedItem = expect.objectContaining({
			Items: expect.any(Array)
		})

		const expectedResponse = buildResponse(200, expectedItem)

		scan.mockResolvedValue({ Items: [] })
		buildResponse.mockReturnValue(expectedResponse)

		const result = await handler(eventJSON)

		expect(scan).toHaveBeenCalledTimes(1)
		expect(scan).toHaveBeenCalledWith(scanInput)
		expect(result).toEqual(expectedResponse)
		expect(buildResponse).toHaveBeenCalledWith(200, expectedItem)
	})
})

describe('Test getMeals handler returns 500 when Internal Server Error', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it('should return a 400 error response if id is not provided', async () => {
		const errorJSON = { pathParameters: {} }
		const expectedError = { statusCode: 500, message: 'Internal Server Error' }
		const internalServerError = new Error("Internal Server Error")
		internalServerError.statusCode = expectedError.statusCode

		errorResponse.mockReturnValue(expectedError)
		scan.mockRejectedValue(internalServerError)

		const result = await handler(errorJSON)

		expect(errorResponse).toHaveBeenCalledTimes(1)
		expect(errorResponse).toHaveBeenCalledWith(internalServerError)
		expect(result).toEqual(expectedError)
	})
})
