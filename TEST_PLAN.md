# DressedChickenStock Component - Test Plan

## Overview
This document outlines the comprehensive testing strategy for the DressedChickenStock component after implementing all Phase 1-4 improvements.

---

## 1. Manual Testing Checklist

### Phase 1: Critical Fixes

#### ✅ Data Consistency (Old vs New Format)
- [ ] **Test 1.1:** Process a new batch with size category from dropdown
  - Expected: Data saved with `size_category_id` and backward-compatible `size_category`
  - Verify in inventory view that size category displays correctly
  
- [ ] **Test 1.2:** Process a new batch with custom size category
  - Expected: Data saved with `size_category_custom` and `size_category_id` as null
  - Verify custom name displays in inventory
  
- [ ] **Test 1.3:** Edit an existing batch and change size category
  - Expected: Both old and new format fields updated
  - Verify display updates correctly

- [ ] **Test 1.4:** View old format data (if any exists)
  - Expected: Old format data displays correctly using fallback logic
  - No errors in console

#### ✅ Processing History Yield Calculation
- [ ] **Test 1.5:** Process 10 birds from a batch
  - Expected: Yield rate shows 100% (or actual processing efficiency)
  - Color: Green for 95-100%, Orange for <95%, Red for >100%
  
- [ ] **Test 1.6:** Check yield calculation accuracy
  - Formula: (dressed_count / birds_processed) * 100
  - Verify against manual calculation

#### ✅ Size Category Dropdown Population
- [ ] **Test 1.7:** Open processing modal
  - Expected: Dropdown shows all active size categories with weight ranges
  - "Custom Size" option available at bottom
  
- [ ] **Test 1.8:** Select "Custom Size"
  - Expected: Custom name input field appears
  - Field is required when custom selected

#### ✅ No Duplicate Code
- [ ] **Test 1.9:** Code review
  - Verify no duplicate `handleProcessChicken` function
  - Verify no duplicate `handleUpdateChicken` function

---

### Phase 2: State & Validation

#### ✅ Edit Modal State Management
- [ ] **Test 2.1:** Edit a dressed chicken record
  - Expected: All fields populate correctly
  - Average weight calculated from processing_quantity
  - No unused state variables in console

#### ✅ Validation
- [ ] **Test 2.2:** Try to submit processing form without size category
  - Expected: Error notification "Please select a size category"
  
- [ ] **Test 2.3:** Try to submit with custom size but no name
  - Expected: Error notification "Please enter a custom size name"
  
- [ ] **Test 2.4:** Try to process more birds than available
  - Expected: Error notification with available count
  
- [ ] **Test 2.5:** Enter negative part weights
  - Expected: Error notification "Part weights cannot be negative"
  
- [ ] **Test 2.6:** Enter feet count > birds * 2
  - Expected: Warning notification about high feet count

#### ✅ Error Handling & User Feedback
- [ ] **Test 2.7:** Submit processing form successfully
  - Expected: Success notification appears
  - Loading state shows "Processing..." on button
  - Button disabled during processing
  
- [ ] **Test 2.8:** Update a record successfully
  - Expected: Success notification "Dressed chicken record updated successfully"
  - Loading state shows "Saving..." on button
  
- [ ] **Test 2.9:** Delete a record
  - Expected: Confirmation dialog appears
  - Success notification after deletion
  - Record removed from list

#### ✅ Data Refresh
- [ ] **Test 2.10:** After processing, check inventory
  - Expected: New record appears immediately
  - No need to manually refresh page

---

### Phase 3: Features & Polish

#### ✅ Storage Location Management
- [ ] **Test 3.1:** Process batch with storage location
  - Expected: Storage location saved and displayed in inventory
  
- [ ] **Test 3.2:** Process batch without storage location
  - Expected: Shows "Not specified" in inventory
  
- [ ] **Test 3.3:** Edit storage location
  - Expected: Updates correctly in inventory view

#### ✅ Expiry Date Warnings
- [ ] **Test 3.4:** Open processing modal
  - Expected: Expiry date auto-populated to 3 months from processing date
  
- [ ] **Test 3.5:** Change processing date
  - Expected: Expiry date updates automatically
  
- [ ] **Test 3.6:** Create batch expiring in 5 days
  - Expected: Yellow row highlight in inventory
  - Warning notification on page load: "X batch(es) expiring within 7 days"
  
- [ ] **Test 3.7:** Create batch with past expiry date
  - Expected: Red row highlight in inventory
  - Error notification on page load: "X batch(es) have EXPIRED!"
  - "⚠️ EXPIRED" badge in expiry date column
  
- [ ] **Test 3.8:** Edit modal with expiring batch
  - Expected: Expiry status shown below date field with color coding

#### ✅ Batch Traceability
- [ ] **Test 3.9:** Click "🔍 Trace" button on a processed batch
  - Expected: Modal opens showing:
    - Dressed chicken batch details (batch ID, date, quantity, size, weight, storage, expiry, notes)
    - Source live chicken batch details (batch ID, breed, hatch date, birds processed)
    - Relationship information
  
- [ ] **Test 3.10:** View traceability for batch without source
  - Expected: Warning message "No source batch information available"

#### ✅ Notes Field
- [ ] **Test 3.11:** Add notes during processing
  - Expected: Notes saved and visible in traceability modal
  
- [ ] **Test 3.12:** Edit notes in edit modal
  - Expected: Notes update correctly

---

### Phase 4: Performance Optimization

#### ✅ Memoization
- [ ] **Test 4.1:** Open React DevTools Profiler
  - Process a batch
  - Expected: Only affected components re-render
  - InventoryView, ProcessingHistoryView, AnalyticsView should not re-render unnecessarily
  
- [ ] **Test 4.2:** Switch between tabs
  - Expected: Fast tab switching
  - No lag with large datasets
  
- [ ] **Test 4.3:** Analytics calculations
  - Expected: Calculations cached
  - No recalculation when switching tabs back and forth

---

## 2. Integration Testing Scenarios

### Scenario 1: Complete Processing Workflow
1. Navigate to Live Chickens page
2. Create a new live chicken batch (50 birds)
3. Navigate to Dressed Chicken Stock
4. Click "Process Chicken"
5. Select the batch, enter 20 birds to process
6. Select size category "Medium"
7. Enter storage location "Freezer A"
8. Enter parts data (neck: 20, feet: 40, gizzard: 20)
9. Add notes "First batch of the week"
10. Submit form
11. **Verify:**
    - Success notification appears
    - New record in inventory with correct data
    - Storage location shows "Freezer A"
    - Expiry date is 3 months from today
    - Live chicken batch count reduced by 20
    - Processing History tab shows the relationship
    - Analytics updated with new data

### Scenario 2: Expiry Warning System
1. Create a batch with expiry date 5 days from now
2. Refresh page
3. **Verify:**
    - Warning notification appears
    - Row highlighted in yellow
    - "⚠️ Expiring Soon" badge visible
4. Edit the batch, set expiry to yesterday
5. Save and refresh
6. **Verify:**
    - Error notification appears
    - Row highlighted in red
    - "⚠️ EXPIRED" badge visible

### Scenario 3: Batch Traceability
1. Process a batch from live chickens
2. Click "🔍 Trace" button
3. **Verify:**
    - Modal shows complete information
    - Source batch details correct
    - Relationship type is "partial_processed_from"
    - All data matches

### Scenario 4: Edit and Update
1. Select a dressed chicken record
2. Click Edit
3. Change current count, storage location, and notes
4. Save
5. **Verify:**
    - Success notification
    - Changes reflected immediately
    - Average weight recalculated if parts changed

---

## 3. Edge Cases & Error Scenarios

### Edge Case 1: Processing All Birds
- Process all remaining birds from a batch
- **Verify:** Source batch count becomes 0

### Edge Case 2: Custom Size Category
- Create batch with custom size "Farm Special"
- **Verify:** Displays correctly in all views

### Edge Case 3: No Parts Data
- Process batch with 0 for all parts
- **Verify:** Error message appears

### Edge Case 4: Network Error
- Disconnect network during save
- **Verify:** Error notification with helpful message

### Edge Case 5: Large Dataset
- Create 100+ dressed chicken records
- **Verify:** Performance remains good, no lag

---

## 4. Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if available)

---

## 5. Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Form labels properly associated
- [ ] Error messages announced
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

---

## 6. Performance Metrics

Target metrics:
- [ ] Initial load: < 2 seconds
- [ ] Tab switching: < 100ms
- [ ] Form submission: < 1 second
- [ ] Analytics calculation: < 500ms
- [ ] No memory leaks after 10 operations

---

## 7. Known Limitations

1. **Pagination:** Not implemented - may be slow with 1000+ records
2. **Search/Filter:** Not implemented - users must scroll to find records
3. **Bulk Operations:** Cannot process multiple batches at once
4. **Export:** No CSV/Excel export functionality

---

## 8. Test Results Summary

| Phase | Tests Passed | Tests Failed | Notes |
|-------|--------------|--------------|-------|
| Phase 1 | - | - | - |
| Phase 2 | - | - | - |
| Phase 3 | - | - | - |
| Phase 4 | - | - | - |

---

## 9. Sign-off

- [ ] All critical tests passed
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Ready for production

**Tested by:** _________________  
**Date:** _________________  
**Version:** _________________

