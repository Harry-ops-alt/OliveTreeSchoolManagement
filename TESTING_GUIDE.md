# 🧪 Billing System Testing Guide - Baby Steps

## Prerequisites

Make sure you have:
- ✅ Database seeded (you already did this!)
- ✅ All code committed (done!)
- ✅ Environment variables set up in `apps/api/.env`

---

## Step 1: Start the Backend API (Terminal 1)

```bash
# Navigate to project root
cd /Users/harun/Desktop/Windsurf/OliveTreeSchoolManagement

# Start the API server
pnpm --filter api start:dev
```

**Expected Output:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO Application is running on: http://localhost:3001
```

**✅ Success Check:** API should be running on `http://localhost:3001`

---

## Step 2: Start the Frontend (Terminal 2)

Open a **new terminal** and run:

```bash
# Navigate to project root
cd /Users/harun/Desktop/Windsurf/OliveTreeSchoolManagement

# Start the Next.js frontend
pnpm --filter next dev
```

**Expected Output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in X.Xs
```

**✅ Success Check:** Frontend should be running on `http://localhost:3000`

---

## Step 3: Test API Endpoints with cURL (Terminal 3)

Open a **third terminal** to test the API directly:

### 3.1 Test Health Check
```bash
curl http://localhost:3001/healthz
```
**Expected:** `{"status":"ok"}`

### 3.2 Login as Finance Manager
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "finance.manager@olive.school",
    "password": "Password123!"
  }'
```

**Expected:** You'll get a response with `accessToken`. Copy this token!

**Save the token:**
```bash
# Replace YOUR_TOKEN_HERE with the actual token from above
export TOKEN="YOUR_TOKEN_HERE"
```

### 3.3 Test Fee Structures Endpoint
```bash
curl http://localhost:3001/fee-structures \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** JSON array with 3 fee structures (Monthly Tuition, Termly Enrichment, Annual Registration)

### 3.4 Test Subscriptions Endpoint
```bash
curl http://localhost:3001/subscriptions \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** JSON array with 2 subscriptions (one with sibling discount)

### 3.5 Test Invoices Endpoint
```bash
curl http://localhost:3001/invoices \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** JSON array with 3 invoices (PAID, PARTIALLY_PAID, OVERDUE)

### 3.6 Test Payments Endpoint
```bash
curl http://localhost:3001/payments \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** JSON array with 2 payments

---

## Step 4: Test Frontend UI in Browser

### 4.1 Login to the Application

1. Open browser: `http://localhost:3000`
2. Click **Login** or navigate to `/login`
3. Use these credentials:
   - **Email:** `finance.manager@olive.school`
   - **Password:** `Password123!`

**✅ Success Check:** You should be redirected to the dashboard

### 4.2 Navigate to Finance Section

1. In the sidebar/navigation, find **Finance** section
2. Click on **Finance** to go to `/app/finance`

**✅ Success Check:** You should see:
- 3 module cards (Fee Structures, Subscriptions, Invoices & Payments)
- Recent transactions list below

### 4.3 Test Fee Structures Page

1. Click on **Fee Structures** card
2. You should see `/app/finance/fee-structures`

**What to Test:**
- ✅ See 3 fee structures listed
- ✅ Search works (type "Monthly")
- ✅ Click **Add Fee Structure** button
- ✅ Fill in the form:
  - Name: "Test Fee"
  - Amount: 100
  - Billing Cycle: Monthly
- ✅ Click **Create**
- ✅ See success toast notification
- ✅ New fee appears in the list

**Edit Test:**
- ✅ Click edit icon on any fee
- ✅ Change the amount
- ✅ Click **Update**
- ✅ See updated amount

### 4.4 Test Subscriptions Page

1. Go back and click **Subscriptions** card
2. You should see `/app/finance/subscriptions`

**What to Test:**
- ✅ See 2 subscriptions listed
- ✅ See statistics cards (Total, Active, Monthly Revenue)
- ✅ Filter by status (try "Active")
- ✅ Search by student name
- ✅ See sibling discount displayed (10% discount)

### 4.5 Test Invoices & Payments Page

1. Go back and click **Invoices & Payments** card
2. You should see `/app/finance/invoices`

**What to Test:**
- ✅ See 3 invoices listed
- ✅ See statistics (Total, Paid, Overdue, Outstanding)
- ✅ Filter by status (try "Overdue")
- ✅ Search by invoice number or student name

**Record Payment Test:**
- ✅ Find the PARTIALLY_PAID invoice (INV-2025-0002)
- ✅ Click the credit card icon
- ✅ See payment dialog with:
  - Invoice amount: £450.00
  - Paid: £200.00
  - Remaining: £250.00
- ✅ Enter payment amount: 250
- ✅ Select payment method: "Cash"
- ✅ Add reference: "TEST-001"
- ✅ Click **Record Payment**
- ✅ See success toast
- ✅ Invoice status changes to "Paid"
- ✅ Paid amount updates to £450.00

---

## Step 5: Test API with Postman/Insomnia (Optional)

If you prefer a GUI tool:

### 5.1 Import Collection

Create a new collection with these requests:

**Base URL:** `http://localhost:3001`

**Headers for all requests (except login):**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### 5.2 Test Requests

1. **POST /auth/login** - Get token
2. **GET /fee-structures** - List fee structures
3. **POST /fee-structures** - Create new fee
4. **GET /subscriptions** - List subscriptions
5. **GET /invoices** - List invoices
6. **POST /payments** - Record payment

---

## Step 6: Run Automated Tests

```bash
# Run backend unit tests
pnpm --filter api test

# Run specific test file
pnpm --filter api test fee-structures.service.spec.ts
```

**Expected:** All tests should pass ✅

---

## Common Issues & Solutions

### Issue 1: API won't start
**Error:** `Port 3001 is already in use`

**Solution:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 pnpm --filter api start:dev
```

### Issue 2: Database connection error
**Error:** `Can't reach database server`

**Solution:**
```bash
# Check if database is running
# If using Docker:
docker ps

# Restart database
docker-compose up -d

# Or check your .env file has correct DATABASE_URL
```

### Issue 3: "Unauthorized" error
**Solution:**
- Make sure you copied the full token
- Token might have expired (login again)
- Check Authorization header format: `Bearer YOUR_TOKEN`

### Issue 4: Frontend shows "Failed to load"
**Solution:**
- Check API is running on port 3001
- Check browser console for errors
- Verify CORS is enabled in API

### Issue 5: No data showing
**Solution:**
```bash
# Re-run the seeder
cd apps/api
npx prisma db seed
```

---

## Quick Verification Checklist

Use this to verify everything works:

- [ ] API starts without errors
- [ ] Frontend starts without errors
- [ ] Can login with finance.manager@olive.school
- [ ] Can see finance dashboard
- [ ] Fee structures page loads with 3 items
- [ ] Can create a new fee structure
- [ ] Subscriptions page loads with 2 items
- [ ] Invoices page loads with 3 items
- [ ] Can record a payment
- [ ] Invoice status updates after payment
- [ ] All API endpoints return data (cURL tests)

---

## Next Steps After Testing

Once everything works:

1. **Test with different users:**
   - finance.officer@olive.school
   - school.admin@olive.school

2. **Test edge cases:**
   - Create invoice with £0 amount (should fail)
   - Record payment larger than invoice (should fail)
   - Archive fee structure in use (should fail with message)

3. **Test workflows:**
   - Create fee structure → Create subscription → Generate invoice → Record payment

4. **Performance test:**
   - Create 50+ fee structures
   - Test pagination
   - Test search performance

---

## Getting Help

If you encounter issues:

1. Check the terminal logs for errors
2. Check browser console (F12) for frontend errors
3. Verify database has seeded data:
   ```bash
   npx prisma studio
   ```
4. Check API logs in Terminal 1
5. Review the error messages carefully

---

## Success! 🎉

If all tests pass, you have a fully functional billing system!

**What you've verified:**
- ✅ Backend API works
- ✅ Database is properly seeded
- ✅ Frontend loads and displays data
- ✅ CRUD operations work
- ✅ Authentication & authorization work
- ✅ Business logic works (payments update invoices)

**You're ready to:**
- Show this to stakeholders
- Deploy to staging
- Build additional features
- Move to Phase 3 (LMS)

Congratulations! 🚀
