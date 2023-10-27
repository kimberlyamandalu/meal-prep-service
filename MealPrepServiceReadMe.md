## Deploying the Project
The `package.json` file includes a NPM Run Script called `setup`.

Update the `AWS_PROFILE` variable value to the correct AWS profile you want to use. This determines the AWS account which the service will be deployed to (in case you have more than 1 account).

The default behavior is to deploy the service to the AWS Account set as your `default`.

Once you have configured which AWS profile to use, you can simply run:
`npm run setup`. This will install dependencies and deploy the project to AWS.

> _I used `cross-env` NPM dependency to customize the NPM Run Scripts so I don't have to keep remembering to include the `AWS_PROFILE` variable when running the NPM Scripts._

## Pre-Requisites to Testing Deployed Service
### Acquire API Key Value
If you chose to require API Keys when accessing your APIs, you may run the following command to retrieve the API Key: `npm run getAPIKey`.

The value returned needs to be included as part of request header with key `x-api-key`.

### Acquire JWT Token
If you opted to secure your APIs using Cognito, you may run the following command to acquire the JWT token associated with the sample email address you provided in the CloudGTO Service Builder: `npm run getJWT`.

The email address can be easily changed by updating `scripts/auth.bash`.

The token value returned must be included as part of the request header with key `Authorization`.

### API Invoke URL
You can find this information in `.serverless/compose.log` as part of the Stack Outputs section. Example:
```bash
Stack Outputs:
api ›   ApiUrl: https://[apigw-id].execute-api.[region].amazonaws.com/dev
```

You can also find this information in the API Gateway Console by going to the `Stages` view. The Stage Details includes the Invoke URL.

## Testing Deployed REST API
Once the the deployment is successful, and after acquiring required information to call our APIs, we are now ready to test.

You may use any REST client of your choice such as `Postman`. We will be using `curl` for the following instructions.

> **Remember to update the API Gateway Invoke URL, API Key, JWT Token, AWS Profile, AWS Region as needed in the examples provided below.**

### Menu Service
> For simplicity, I manually created some data in the `Menu` DynamoDB table. I have provided some starter data to load into the table. You may run the following command to load some data to use for testing:
```bash
aws dynamodb batch-write-item \
--request-items file://etc/menu-ddb-starter-data.json \
--profile [YourAWSProfile] \
--region [RegionWhereTableIs]
```

> The `x-api-key` value needs to be replaced with your API Key.

> Notice that for `/menu` route, we did not add any Authorization as we want both new and existing customers to see the options.

#### `/menu` (GET)
Lists the full menu:
```bash
curl 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/menu/' --header 'x-api-key: [api-key]'
```

#### `/menu/seller/{seller}` (GET)
Retrieves menu list by seller. In this example, we want to see a list of menu items sold by a company called `YesMeal`:
```bash
curl 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/menu/seller/YesMeal' --header 'x-api-key: [api-key]'
```

#### `/menu/category/{category}`
Retrieves menu list by category. Category values can be: `Seafood`/`Pork`/`Chicken`/`Beef`/`Vegetable`. In the following example, we want to see menu items that have `Chicken` as its protein:
```bash
curl --location 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/menu/category/Chicken' --header 'x-api-key: [api-key]'
```

### Order Service
> Both `x-api-key` and `Authorization` headers need to be provided in the request.

> When an Order Header's `status` is updated to `CHECKOUT`, this is our APIs cue to calculate the total price for the entire order. You will see a `totalPrice` attribute added.

> Order Headers have `orderLineId` value of `HEADER`.

#### `/orders` (POST)
Starts an order for a customer. In our example, we start an order for Bob. You may think of this as an Order Header, which is like a summary of all the line items included in the order.
```bash
curl --request POST 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/orders/' \
--header 'x-api-key: [api-key]' \
--header 'Authorization: [YourJWTTokenValue]'\
--header 'Content-Type: application/json' \
--data '{ "customer": "Bob", "status": "InProgress" }'
```
#### `/orders/{order_id}` (GET)
Retrieves a single Order Header. We pass the `order_id` value as a path parameter.
```bash
curl 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/orders/cd7d2578-2926-40eb-8a94-075201da5b3b' \
--header 'x-api-key: [api-key]' \
--header 'Authorization: [YourJWTTokenValue]'
```

#### `/orders/{order_id}` (PUT)
Updates details for an Order Header. In our example, we update the Order Status to `Delivered`.
```bash
curl --request PUT 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/orders/cd7d2578-2926-40eb-8a94-075201da5b3b' \
--header 'x-api-key: [api-key]' \
--header 'Authorization: [YourJWTTokenValue]' \
--header 'Content-Type: application/json' \
--data '{
    "customer": "Bob",
    "status": "Delivered"
}'
```

#### `/orders/{order_id}` (DELETE)
Deletes an Order Header. You might be thinking, this should also cause line items part of an order to be deleted. You are right! But for simplicity, let's assume our application sends separate API Requests to our service.
```bash
curl --request DELETE 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/orders/cd7d2578-2926-40eb-8a94-075201da5b3b' \
--header 'x-api-key: [api-key]' \
--header 'Authorization: [YourJWTTokenValue]' \
--header 'Content-Type: application/json'
```

### Order Lines
> Both `x-api-key` and `Authorization` headers need to be provided in the request.

> An order line has a `subTotal` attribute and stores the price for that individual line item. It is calculated as `unitPrice * quantity`.

> We store the `orderLineId` value in our table as `LINE#[lineId]` but when passing the `line_id` as path parameter, we omit the prefix `LINE#` and simply provide the `GUID` as value.

#### `/orders/{order_id}/lines` (POST)
Adds line items to a customer's order. In our example, we add a meal called `YesMeal A` and include the quantity and unit price to Bob's order by providing the `order_id` as path parameter.
```bash
curl --request POST 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/orders/cd7d2578-2926-40eb-8a94-075201da5b3b/lines' \
--header 'x-api-key: [api-key]' \
--header 'Authorization: [YourJWTTokenValue]' \
--header 'Content-Type: application/json' \
--data '{
    "mealId": "YesMeal A",
    "quantity": 2,
    "price": 8.89
}'
```

#### `/orders/{order_id}/lines/{line_id}` (PUT)
Updates an individual line item from a customer's order. `order_id` represents the customer order and is included as path parameter. `line_id` represents the individual line item within the customer's order that needs updated. In our example, we increase the quantity ordered to 5.
```bash
curl --request PUT 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/orders/cd7d2578-2926-40eb-8a94-075201da5b3b/lines/10aab9ab-55aa-44b3-a2cb-407e820fcabe' \
--header 'x-api-key: [api-key]' \
--header 'Authorization: [YourJWTTokenValue]' \
--header 'Content-Type: application/json' \
--data '{
    "mealId": "YesMeal A",
    "quantity": 5,
    "price": 8.89
}'
```

#### `/orders/{order_id}/lines/{line_id}` (DELETE)
Deletes a single line item from a customer's order.
```bash
curl --request DELETE 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/orders/cd7d2578-2926-40eb-8a94-075201da5b3b/lines/10aab9ab-55aa-44b3-a2cb-407e820fcabe' \
--header 'x-api-key: [api-key]' \
--header 'Authorization: [YourJWTTokenValue]' \
--header 'Content-Type: application/json'
```

#### `/orders/{order_id}/lines` (GET)
Retrieves all the line items for a customer's order.
```bash
curl 'https://[apigw-id].execute-api.[region].amazonaws.com/dev/orders/cd7d2578-2926-40eb-8a94-075201da5b3b/lines' \
--header 'x-api-key: [api-key]' \
--header 'Authorization: [YourJWTTokenValue]'
```