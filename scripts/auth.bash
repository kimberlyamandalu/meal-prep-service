#! /bin/bash

## ** Examples (npm run auth <stage> <region> <command>)
## ** run the commands below from root level in your terminal
## **** Signup: npm run auth dev us-west-2 signup
## **** Signin: npm run auth dev us-west-2 signin

stage=$1
region=$2
action=$3
stack_name="meal-prep-cognito-dev"
# swap in your email below
email="kim@serverlessguru.com"
pw="a3620deb-5b21-4adE!"

# swap in your own password (8+ characters w/ symbol, uppercase, lowercase, and number)
# we are using pwgen utility to generate a random password
# install it on your *nix machine with: 
# brew install pwgen
# sudo apt-get install -y pwgen

# pw=$(pwgen -s 10 -1 -y)
# echo "Your password is: $pw"

# default stage if nothing passed
if [[ -z $stage ]];
then
    echo "no stage passed"
    exit 1
fi

# default region if nothing passed
if [[ -z $region ]];
then
    echo "no region passed"
    exit 1
fi

if [[ -z $action ]];
then
    echo "no action passed, default to signup, needs to be signup, confirmsignin, or signin"
    exit 1
fi
    
# use AWS CLI to pull in cloudformation outputs (uses default ~/.aws/credentials profile)
cognito_client_id=$(aws cloudformation --region $region describe-stacks --stack-name $stack_name --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
user_pool_id=$(aws cloudformation --region $region describe-stacks --stack-name $stack_name --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
            
# based on action passed handle related cognito action
if [[ $action == "signup" ]]
then
    aws cognito-idp sign-up --region $region --client-id $cognito_client_id --username $email --password $pw && aws cognito-idp admin-confirm-sign-up --region $region --user-pool-id $user_pool_id --username $email
    echo "$email signed up"
elif [[ $action == "signin" ]]
then
    # check for jq and error if not installed
    if ! [ -x "$(command -v jq)" ]
    then
        echo 'Error: jq is not installed. Please install first, if on Mac, brew install jq.' >&2
        exit 1
    fi
    signin_result=$(aws cognito-idp initiate-auth --region $region --auth-flow USER_PASSWORD_AUTH --output json --client-id $cognito_client_id --auth-parameters USERNAME=$email,PASSWORD=$pw)
    if [[ $signin_result ]];
    then
        echo "$email signed in"
        # pull out JWT using library called jq (make sure to download)
        jwt_token=$(echo $signin_result | jq ".AuthenticationResult.IdToken")
        echo "JWT Token:"
        echo $jwt_token
    else
        echo "problem with signin"
        exit 1
    fi
fi
    