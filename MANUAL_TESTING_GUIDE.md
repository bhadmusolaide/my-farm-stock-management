# DressedChickenStock Component - Manual Testing Guide

## 🔧 Issue Fixed
**Error:** `ReferenceError: Cannot access 'isExpiringSoon' before initialization`  
**Solution:** Moved all helper functions BEFORE the hooks that use them  
**Status:** ✅ FIXED

---

## 🧪 Manual Testing Instructions

### Prerequisites
1. ✅ Application running on http://localhost:5174/
2. ✅ Logged into the application
3. ✅ Have at least one live chicken batch available

---

## Test 1: Processing Modal - Add New Batch

### Steps:
1. Navigate to "Dressed Chicken Stock" page
2. Click "Process Chicken" button
3. **Verify modal opens with:**
   - Title: "Process Chicken"
   - All form fields visible
   - "Cancel" and "Process" buttons

### Test 1.1: Size Category Dropdown
4. Click on "Size Category" dropdown
5. **Verify:**
   - ✅ Shows list of size categories (Small, Medium, Large, etc.)
   - ✅ Each category shows weight range (e.g., "Medium (1.5-2.5kg)")
   - ✅ "Custom Size" option at the bottom

6. Select "Custom Size"
7. **Verify:**
   - ✅ Custom name input field appears
   - ✅ Field is required (try submitting without it)

### Test 1.2: Live Chicken Batch Selection
8. Click on "Select Live Chicken Batch" dropdown
9. **Verify:**
   - ✅ Shows available live chicken batches
   - ✅ Shows batch ID, breed, and available count

10. Select a batch with at least 10 birds
11. **Verify:**
    - ✅ "Available birds" text updates
    - ✅ Shows correct count

### Test 1.3: Processing Quantity Validation
12. Enter processing quantity: `999` (more than available)
13. Click "Process"
14. **Verify:**
    - ✅ Error notification appears
    - ✅ Message: "Cannot process more birds than available"
    - ✅ Form does not submit

15. Enter valid quantity: `5`
16. **Verify:**
    - ✅ No error
    - ✅ Can proceed

### Test 1.4: Parts Data Validation
17. Enter parts data:
    - Neck count: `5`
    - Neck weight: `2.5`
    - Feet count: `10`
    - Feet weight: `1.5`
    - Gizzard count: `5`
    - Gizzard weight: `1.0`
    - Dog food count: `0`
    - Dog food weight: `0`

18. **Verify:**
    - ✅ All fields accept numbers
    - ✅ No errors

19. Try entering negative weight: `-5`
20. Click "Process"
21. **Verify:**
    - ✅ Error notification: "Part weights cannot be negative"

22. Fix the negative value, then enter feet count: `50` (more than birds * 2)
23. Click "Process"
24. **Verify:**
    - ✅ Warning notification about high feet count
    - ✅ Form still submits (it's a warning, not an error)

### Test 1.5: Expiry Date Auto-calculation
25. Select processing date: Today's date
26. **Verify:**
    - ✅ Expiry date auto-fills to 3 months from today
    - ✅ Date format is correct

27. Change processing date to a different date
28. **Verify:**
    - ✅ Expiry date updates automatically

### Test 1.6: Storage Location and Notes
29. Enter storage location: `Freezer A`
30. Enter notes: `First batch of the week - good quality`
31. **Verify:**
    - ✅ Fields accept text input

### Test 1.7: Submit Form
32. Fill all required fields correctly
33. Click "Process"
34. **Verify:**
    - ✅ Button shows "Processing..." and is disabled
    - ✅ Success notification appears
    - ✅ Modal closes
    - ✅ New record appears in inventory table
    - ✅ Live chicken batch count reduced

---

## Test 2: Edit Modal

### Steps:
1. Find a dressed chicken record in the inventory
2. Click "Edit" button
3. **Verify modal opens with:**
   - ✅ Title: "Edit Dressed Chicken"
   - ✅ All fields pre-populated with existing data
   - ✅ Size category shows correctly
   - ✅ Storage location shows correctly
   - ✅ Expiry date shows correctly
   - ✅ Notes show correctly

### Test 2.1: Edit Current Count
4. Change current count from `5` to `3`
5. **Verify:**
   - ✅ Field updates

### Test 2.2: Edit Storage Location
6. Change storage location to `Cold Room 2`
7. **Verify:**
   - ✅ Field updates

### Test 2.3: Edit Expiry Date
8. Change expiry date to tomorrow
9. **Verify:**
   - ✅ Expiry status shows "⚠️ Expiring Soon" below the field

10. Change expiry date to yesterday
11. **Verify:**
    - ✅ Expiry status shows "⚠️ EXPIRED" in red

### Test 2.4: Edit Notes
12. Update notes: `Updated - moved to cold storage`
13. **Verify:**
    - ✅ Field updates

### Test 2.5: Submit Changes
14. Click "Save Changes"
15. **Verify:**
    - ✅ Button shows "Saving..." and is disabled
    - ✅ Success notification appears
    - ✅ Modal closes
    - ✅ Changes reflected in inventory table immediately
    - ✅ No page refresh needed

---

## Test 3: Processing History Tab

### Steps:
1. Click on "Processing History" tab
2. **Verify:**
   - ✅ Tab switches successfully
   - ✅ Shows list of processed batches

### Test 3.1: Verify Yield Calculation
3. Find a processed batch in the list
4. **Verify the following columns:**
   - ✅ **Processing Date** - Shows correct date
   - ✅ **Batch ID** - Shows correct ID
   - ✅ **Size Category** - Shows correct size
   - ✅ **Birds Processed** - Shows number of birds from source batch
   - ✅ **Dressed Count** - Shows number of dressed chickens produced
   - ✅ **Yield Rate** - Shows percentage

### Test 3.2: Verify Yield Rate Color Coding
5. Check yield rate colors:
   - ✅ **Green** - For 95-100% yield (normal)
   - ✅ **Orange** - For < 95% yield (low)
   - ✅ **Red** - For > 100% yield (error - shouldn't happen)

### Test 3.3: Verify Yield Calculation Accuracy
6. Manually calculate: (Dressed Count / Birds Processed) * 100
7. **Verify:**
   - ✅ Displayed yield rate matches your calculation
   - ✅ Example: 50 dressed / 50 processed = 100%
   - ✅ Example: 48 dressed / 50 processed = 96%

### Test 3.4: Verify Average Weight
8. Check "Avg Weight" column
9. **Verify:**
   - ✅ Shows weight in kg format (e.g., "2.50 kg")
   - ✅ Calculation: Total parts weight / Processing quantity

### Test 3.5: Verify Parts Summary
10. Check "Parts" column
11. **Verify:**
    - ✅ Shows summary like "Neck: 50, Feet: 100, Gizzard: 50"
    - ✅ Numbers match what was entered during processing

---

## Test 4: Inventory View - Expiry Warnings

### Test 4.1: Create Expiring Soon Batch
1. Process a new batch with expiry date 5 days from today
2. **Verify:**
   - ✅ Success notification appears
   - ✅ New record in inventory

3. Refresh the page (F5)
4. **Verify:**
   - ✅ Warning notification appears: "X batch(es) expiring within 7 days"
   - ✅ Row is highlighted in **yellow**
   - ✅ Expiry date column shows "⚠️ Expiring Soon" badge

### Test 4.2: Create Expired Batch
5. Edit a batch and set expiry date to yesterday
6. Save changes
7. Refresh the page (F5)
8. **Verify:**
   - ✅ Error notification appears: "X batch(es) have EXPIRED!"
   - ✅ Row is highlighted in **red**
   - ✅ Expiry date column shows "⚠️ EXPIRED" badge

---

## Test 5: Batch Traceability

### Steps:
1. Find a processed batch in inventory
2. Click "🔍 Trace" button
3. **Verify modal opens showing:**

### Section 1: Dressed Chicken Batch Details
   - ✅ Batch ID
   - ✅ Processing Date
   - ✅ Processing Quantity
   - ✅ Size Category
   - ✅ Average Weight
   - ✅ Storage Location
   - ✅ Expiry Date
   - ✅ Notes

### Section 2: Source Live Chicken Batch
   - ✅ Source Batch ID
   - ✅ Breed
   - ✅ Hatch Date
   - ✅ Birds Processed
   - ✅ Relationship Type (e.g., "partial_processed_from")

4. **Verify all data is accurate**
5. Click "Close" button
6. **Verify:**
   - ✅ Modal closes

---

## Test 6: Delete Functionality

### Steps:
1. Find a test batch in inventory
2. Click "Delete" button
3. **Verify:**
   - ✅ Confirmation dialog appears
   - ✅ Message: "Are you sure you want to delete this dressed chicken record?"

4. Click "Cancel"
5. **Verify:**
   - ✅ Dialog closes
   - ✅ Record NOT deleted

6. Click "Delete" again
7. Click "OK" in confirmation dialog
8. **Verify:**
   - ✅ Success notification appears
   - ✅ Record removed from table immediately
   - ✅ No page refresh needed

---

## Test 7: Analytics Tab

### Steps:
1. Click on "Analytics" tab
2. **Verify:**
   - ✅ Tab switches successfully
   - ✅ Shows analytics dashboard

### Test 7.1: Overall Statistics
3. **Verify the following metrics:**
   - ✅ **Total Batches** - Shows correct count
   - ✅ **Total Whole Chickens** - Sum of all processing quantities
   - ✅ **Total Weight** - Sum of (quantity * average weight)

### Test 7.2: Size Distribution
4. **Verify:**
   - ✅ Shows breakdown by size category
   - ✅ Counts match inventory
   - ✅ Handles both old format (string) and new format (ID) correctly

### Test 7.3: Parts Statistics
5. **Verify:**
   - ✅ Shows total counts for each part type
   - ✅ Shows total weights for each part type
   - ✅ Numbers are accurate

---

## Test 8: Performance

### Test 8.1: Tab Switching
1. Switch between tabs multiple times: Inventory → Processing History → Analytics → Inventory
2. **Verify:**
   - ✅ Switching is fast (< 100ms)
   - ✅ No lag or freezing
   - ✅ No unnecessary re-renders (check React DevTools if available)

### Test 8.2: Large Dataset
1. If you have 50+ records:
2. **Verify:**
   - ✅ Page loads quickly
   - ✅ Scrolling is smooth
   - ✅ No performance issues

---

## ✅ Test Results Checklist

Mark each test as you complete it:

- [ ] Test 1: Processing Modal - Add New Batch
- [ ] Test 2: Edit Modal
- [ ] Test 3: Processing History Tab
- [ ] Test 4: Inventory View - Expiry Warnings
- [ ] Test 5: Batch Traceability
- [ ] Test 6: Delete Functionality
- [ ] Test 7: Analytics Tab
- [ ] Test 8: Performance

---

## 🐛 Bug Reporting

If you find any issues, please note:
1. **What you did** (steps to reproduce)
2. **What you expected** (expected behavior)
3. **What happened** (actual behavior)
4. **Console errors** (if any - press F12 to open console)

---

## 📝 Notes

- All tests should be performed with real data
- Check browser console for any errors (F12)
- Test in different browsers if possible
- Test with different data scenarios (empty, small, large datasets)

---

**Testing Date:** _________________  
**Tested By:** _________________  
**Browser:** _________________  
**Status:** _________________

