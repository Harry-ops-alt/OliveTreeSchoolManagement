# 🚀 Quick Start Guide - Testing Your Billing System

## The Problem You Just Had

You saw this error:
```
Error: listen EADDRINUSE: address already in use :::3000
```

This means something was already running on port 3000. **I've fixed it!**

---

## ✅ Solution: Use the Startup Scripts

I created two scripts to make your life easier:

### Start Everything (One Command!)

```bash
./start-dev.sh
```

This will:
1. ✅ Kill any old processes
2. ✅ Start the API on port 3001
3. ✅ Start the Frontend on port 3000
4. ✅ Wait for both to be ready
5. ✅ Show you the URLs

### Stop Everything

```bash
./stop-dev.sh
```

This will:
1. ✅ Stop all servers
2. ✅ Clean up log files

---

## 🎯 Step-by-Step Testing (Baby Steps)

### Step 1: Start the Servers

Open your terminal and run:

```bash
cd /Users/harun/Desktop/Windsurf/OliveTreeSchoolManagement
./start-dev.sh
```

**Wait for this message:**
```
🎉 Both servers are running!
```

### Step 2: Open Your Browser

Go to: **http://localhost:3000**

### Step 3: Login

Use these credentials:
- **Email:** `finance.manager@olive.school`
- **Password:** `Password123!`

### Step 4: Navigate to Finance

1. After login, look for **Finance** in the navigation
2. Click on it to go to `/app/finance`

### Step 5: Test Each Page

#### A. Fee Structures
1. Click **Fee Structures** card
2. You should see 3 fee structures
3. Try clicking **Add Fee Structure**
4. Fill in the form and click **Create**

#### B. Subscriptions
1. Go back and click **Subscriptions** card
2. You should see 2 subscriptions
3. Notice the sibling discount on one of them

#### C. Invoices & Payments
1. Go back and click **Invoices & Payments** card
2. You should see 3 invoices
3. Find the "Partially Paid" invoice
4. Click the credit card icon
5. Record a payment

---

## 🧪 Test the API Directly (Optional)

If you want to test the API without the UI:

```bash
./test-billing-api.sh
```

This will test all endpoints and show you the results.

---

## 📊 What You Should See

### Fee Structures Page
- ✅ 3 fee structures listed
  - Monthly Tuition (£500)
  - Termly Enrichment Programme (£300)
  - Annual Registration Fee (£150)

### Subscriptions Page
- ✅ 2 subscriptions
- ✅ One with "10% sibling discount (1 sibling)"
- ✅ Statistics showing total revenue

### Invoices Page
- ✅ 3 invoices with different statuses:
  - INV-2025-0001: PAID (£500)
  - INV-2025-0002: PARTIALLY_PAID (£450, paid £200)
  - INV-2025-0003: OVERDUE (£150)

---

## 🆘 Troubleshooting

### Problem: Servers won't start

**Solution:**
```bash
./stop-dev.sh
./start-dev.sh
```

### Problem: "Port already in use"

**Solution:**
```bash
# Kill processes manually
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Then start again
./start-dev.sh
```

### Problem: No data showing

**Solution:**
```bash
# Re-run the database seeder
cd apps/api
npx prisma db seed
cd ../..
./start-dev.sh
```

### Problem: Can't login

**Solution:**
Make sure you're using the correct credentials:
- Email: `finance.manager@olive.school`
- Password: `Password123!`

### Problem: Check logs for errors

```bash
# View API logs
tail -f api.log

# View Frontend logs
tail -f frontend.log
```

---

## 🎉 Success Checklist

You'll know everything works when:

- [ ] Servers start without errors
- [ ] You can login successfully
- [ ] Finance page shows 3 module cards
- [ ] Fee Structures page shows 3 items
- [ ] Subscriptions page shows 2 items
- [ ] Invoices page shows 3 items
- [ ] You can record a payment
- [ ] Invoice status updates after payment

---

## 📝 Quick Commands Reference

```bash
# Start everything
./start-dev.sh

# Stop everything
./stop-dev.sh

# Test API
./test-billing-api.sh

# View logs
tail -f api.log
tail -f frontend.log

# Re-seed database
cd apps/api && npx prisma db seed
```

---

## 🎊 You're Ready!

Once you see the servers running and can login, you have a **fully functional billing system**!

**Next Steps:**
1. Test creating a new fee structure
2. Test recording payments
3. Explore the different pages
4. Try filtering and searching

**Need more help?** Check `TESTING_GUIDE.md` for detailed instructions.

---

## 💡 Pro Tips

1. **Keep the terminal open** - You'll see logs in real-time
2. **Use the scripts** - They handle all the cleanup for you
3. **Check the logs** - If something breaks, the logs will tell you why
4. **Re-seed if needed** - Fresh data is just one command away

Happy testing! 🚀
