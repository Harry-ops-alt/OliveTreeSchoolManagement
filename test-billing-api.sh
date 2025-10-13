#!/bin/bash

# Billing System API Test Script
# This script tests all the billing endpoints

echo "🧪 Testing Billing System API..."
echo ""

API_URL="http://localhost:3001"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s ${API_URL}/healthz)
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Login
echo "2️⃣  Logging in as Finance Manager..."
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "finance.manager@olive.school",
    "password": "Password123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed - no token received${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✅ Login successful${NC}"
    echo -e "${YELLOW}Token: ${TOKEN:0:20}...${NC}"
fi
echo ""

# Test 3: Fee Structures
echo "3️⃣  Testing Fee Structures endpoint..."
FEE_RESPONSE=$(curl -s ${API_URL}/fee-structures \
  -H "Authorization: Bearer $TOKEN")

FEE_COUNT=$(echo $FEE_RESPONSE | grep -o '"id"' | wc -l)
if [ $FEE_COUNT -ge 3 ]; then
    echo -e "${GREEN}✅ Fee Structures: Found $FEE_COUNT items${NC}"
else
    echo -e "${RED}❌ Fee Structures: Expected at least 3, found $FEE_COUNT${NC}"
fi
echo ""

# Test 4: Subscriptions
echo "4️⃣  Testing Subscriptions endpoint..."
SUB_RESPONSE=$(curl -s ${API_URL}/subscriptions \
  -H "Authorization: Bearer $TOKEN")

SUB_COUNT=$(echo $SUB_RESPONSE | grep -o '"id"' | wc -l)
if [ $SUB_COUNT -ge 2 ]; then
    echo -e "${GREEN}✅ Subscriptions: Found $SUB_COUNT items${NC}"
else
    echo -e "${RED}❌ Subscriptions: Expected at least 2, found $SUB_COUNT${NC}"
fi
echo ""

# Test 5: Invoices
echo "5️⃣  Testing Invoices endpoint..."
INV_RESPONSE=$(curl -s ${API_URL}/invoices \
  -H "Authorization: Bearer $TOKEN")

INV_COUNT=$(echo $INV_RESPONSE | grep -o '"invoiceNumber"' | wc -l)
if [ $INV_COUNT -ge 3 ]; then
    echo -e "${GREEN}✅ Invoices: Found $INV_COUNT items${NC}"
else
    echo -e "${RED}❌ Invoices: Expected at least 3, found $INV_COUNT${NC}"
fi
echo ""

# Test 6: Payments
echo "6️⃣  Testing Payments endpoint..."
PAY_RESPONSE=$(curl -s ${API_URL}/payments \
  -H "Authorization: Bearer $TOKEN")

PAY_COUNT=$(echo $PAY_RESPONSE | grep -o '"id"' | wc -l)
if [ $PAY_COUNT -ge 2 ]; then
    echo -e "${GREEN}✅ Payments: Found $PAY_COUNT items${NC}"
else
    echo -e "${RED}❌ Payments: Expected at least 2, found $PAY_COUNT${NC}"
fi
echo ""

# Test 7: Discounts
echo "7️⃣  Testing Discounts endpoint..."
DISC_RESPONSE=$(curl -s "${API_URL}/discounts?organizationId=olive-tree-schools" \
  -H "Authorization: Bearer $TOKEN")

DISC_COUNT=$(echo $DISC_RESPONSE | grep -o '"id"' | wc -l)
if [ $DISC_COUNT -ge 1 ]; then
    echo -e "${GREEN}✅ Discounts: Found $DISC_COUNT items${NC}"
else
    echo -e "${RED}❌ Discounts: Expected at least 1, found $DISC_COUNT${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 All API Tests Completed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Results:"
echo "  - Fee Structures: $FEE_COUNT items"
echo "  - Subscriptions: $SUB_COUNT items"
echo "  - Invoices: $INV_COUNT items"
echo "  - Payments: $PAY_COUNT items"
echo "  - Discounts: $DISC_COUNT items"
echo ""
echo "🌐 Next Steps:"
echo "  1. Open browser: http://localhost:3000"
echo "  2. Login with: finance.manager@olive.school / Password123!"
echo "  3. Navigate to: Finance section"
echo "  4. Test the UI!"
echo ""
