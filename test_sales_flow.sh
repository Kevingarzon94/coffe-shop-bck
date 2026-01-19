#!/bin/bash

# Config
PRODUCT_ID="b46fc140-fc3c-4086-b07f-7f7412bff781"

# 1. Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_user@example.com","password":"Password123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed."
  exit 1
fi

echo "Login successful."

# 2. Create Sale
echo -e "\n2. Creating Sale..."
SALE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/sales \
  -H "Content-Type: application/json" \
  -d "{
    \"customer\": {
      \"firstName\": \"Juan\",
      \"lastName\": \"Perez\",
      \"email\": \"juan.perez@test.com\"
    },
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 2
      }
    ]
  }")

echo "Response: $SALE_RESPONSE"
SALE_ID=$(echo $SALE_RESPONSE | grep -o '"saleId":"[^"]*' | cut -d'"' -f4)

if [ -z "$SALE_ID" ]; then
    echo "Sale creation failed."
    exit 1
fi
echo "Sale ID: $SALE_ID"

# 3. List Sales
echo -e "\n3. Listing Sales..."
curl -s -X GET http://localhost:3001/api/sales \
  -H "Authorization: Bearer $TOKEN"

# 4. Get Sale by ID
echo -e "\n\n4. Getting Sale Details..."
curl -s -X GET "http://localhost:3001/api/sales/$SALE_ID" \
  -H "Authorization: Bearer $TOKEN"
