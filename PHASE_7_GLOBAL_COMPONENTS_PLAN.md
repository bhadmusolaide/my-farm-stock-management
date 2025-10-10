# Phase 7: Global Components & Utilities - Detailed Implementation Plan

## 🎯 Why Start with Phase 7?

Global components are used across ALL pages. Fixing them first will:
1. Reduce duplicate work across other phases
2. Establish consistent patterns
3. Fix multiple pages simultaneously
4. Create reusable solutions

---

## 📦 Components to Fix

### 1. DataTable Component
**Location**: `src/components/UI/DataTable.jsx` and `DataTable.css`
**Used By**: Chicken Orders, Feed Management, Reports, Live Chickens

#### Issues to Fix:
- [ ] Table background not using CSS variables
- [ ] Header row styling hardcoded
- [ ] Search input not optimized for dark mode
- [ ] Pagination controls need dark mode support
- [ ] Sorting indicators barely visible
- [ ] Row hover states not consistent

#### Implementation:
```css
/* Base Styles (Light Mode) */
.data-table-container {
  background-color: var(--card-background, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead th {
  background-color: var(--table-header-bg, #f5f5f5);
  color: var(--table-header-text, #555);
  padding: 1rem;
  border-bottom: 2px solid var(--table-border, #eee);
  font-weight: 600;
}

.data-table tbody td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--table-border, #eee);
  color: var(--text-color, #333);
}

.data-table tbody tr:hover {
  background-color: var(--table-row-hover, #f9f9f9);
}

.data-table-search {
  padding: 0.75rem;
  border: 1px solid var(--input-border, #ddd);
  border-radius: 4px;
  background-color: var(--input-background, #fff);
  color: var(--input-text, #333);
}

/* Dark Mode Overrides */
[data-theme="dark"] .data-table-container {
  background-color: var(--card-background) !important;
  border-color: var(--border-color) !important;
  box-shadow: var(--shadow) !important;
}

[data-theme="dark"] .data-table thead th {
  background-color: var(--table-header-bg) !important;
  color: var(--table-header-text) !important;
  border-color: var(--table-border) !important;
}

[data-theme="dark"] .data-table tbody td {
  color: var(--text-color) !important;
  border-color: var(--table-border) !important;
}

[data-theme="dark"] .data-table tbody tr:hover {
  background-color: var(--table-row-hover) !important;
}

[data-theme="dark"] .data-table-search {
  background-color: var(--input-background) !important;
  border-color: var(--input-border) !important;
  color: var(--input-text) !important;
}
```

---

### 2. Modal Component
**Location**: `src/components/Modal.jsx`, `src/components/UI/EnhancedModal.jsx`
**Used By**: All pages with forms

#### Issues to Fix:
- [ ] Modal overlay opacity not optimized
- [ ] Modal content background hardcoded
- [ ] Modal headers not using CSS variables
- [ ] Close button visibility issues
- [ ] Form sections inside modals need styling

#### Implementation:
```css
/* Base Styles (Light Mode) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--card-background, #fff);
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #ddd);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-color, #333);
  font-size: 1.5rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-light, #666);
  padding: 0.25rem;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text-color, #333);
}

/* Dark Mode Overrides */
[data-theme="dark"] .modal-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

[data-theme="dark"] .modal-content {
  background-color: var(--card-background) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
}

[data-theme="dark"] .modal-header {
  border-color: var(--border-color) !important;
}

[data-theme="dark"] .modal-header h2 {
  color: var(--text-color) !important;
}

[data-theme="dark"] .modal-close {
  color: var(--text-light) !important;
}

[data-theme="dark"] .modal-close:hover {
  color: var(--text-color) !important;
}
```

---

### 3. Form Components
**Location**: Various form inputs across components
**Used By**: All pages with forms

#### Issues to Fix:
- [ ] Input backgrounds hardcoded
- [ ] Label colors not using variables
- [ ] Select dropdowns need styling
- [ ] Textarea styling inconsistent
- [ ] Focus states not optimized
- [ ] Validation states need work

#### Implementation:
```css
/* Base Styles (Light Mode) */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color, #555);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--input-border, #ddd);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--input-background, #fff);
  color: var(--input-text, #333);
  transition: all 0.2s ease;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--input-placeholder, #999);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color, #4caf50);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background-color: var(--disabled-background, #f5f5f5);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Dark Mode Overrides */
[data-theme="dark"] .form-group label {
  color: var(--text-color) !important;
}

[data-theme="dark"] .form-group input,
[data-theme="dark"] .form-group select,
[data-theme="dark"] .form-group textarea {
  background-color: var(--input-background) !important;
  border-color: var(--input-border) !important;
  color: var(--input-text) !important;
}

[data-theme="dark"] .form-group input::placeholder,
[data-theme="dark"] .form-group textarea::placeholder {
  color: var(--input-placeholder) !important;
}

[data-theme="dark"] .form-group input:disabled,
[data-theme="dark"] .form-group select:disabled,
[data-theme="dark"] .form-group textarea:disabled {
  background-color: var(--disabled-background) !important;
}
```

---

### 4. Tab Navigation
**Location**: `src/components/UI/TabNavigation.jsx`
**Used By**: Chicken Orders, Feed Management, Live Chickens

#### Issues to Fix:
- [ ] Tab background not using variables
- [ ] Active tab indicator barely visible
- [ ] Badge styling needs work
- [ ] Hover states not optimized

#### Implementation:
```css
/* Base Styles (Light Mode) */
.tab-navigation {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--border-color, #ddd);
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-light, #666);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: var(--text-color, #333);
  background-color: var(--hover-background, rgba(0, 0, 0, 0.05));
}

.tab-button.active {
  color: var(--primary-color, #4caf50);
  border-bottom-color: var(--primary-color, #4caf50);
}

.tab-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
  background-color: var(--badge-background, #e0e0e0);
  color: var(--badge-text, #555);
}

.tab-button.active .tab-badge {
  background-color: var(--primary-color, #4caf50);
  color: white;
}

/* Dark Mode Overrides */
[data-theme="dark"] .tab-navigation {
  border-color: var(--border-color) !important;
}

[data-theme="dark"] .tab-button {
  color: var(--text-light) !important;
}

[data-theme="dark"] .tab-button:hover {
  color: var(--text-color) !important;
  background-color: var(--hover-background) !important;
}

[data-theme="dark"] .tab-button.active {
  color: var(--primary-color) !important;
}

[data-theme="dark"] .tab-badge {
  background-color: var(--badge-background) !important;
  color: var(--badge-text) !important;
}
```

---

## 🔧 Implementation Steps

### Step 1: Update DataTable Component
1. Open `src/components/UI/DataTable.css`
2. Replace hardcoded colors with CSS variables
3. Add dark mode overrides to `DarkModeOverride.css`
4. Test on Chicken Orders page
5. Verify on Feed Management page

### Step 2: Update Modal Components
1. Open `src/components/Modal.jsx` and related CSS
2. Update EnhancedModal component
3. Add dark mode overrides
4. Test all modals across pages

### Step 3: Standardize Form Inputs
1. Create global form styles in `theme.css`
2. Update all form components
3. Add dark mode overrides
4. Test all forms

### Step 4: Fix Tab Navigation
1. Update TabNavigation component
2. Add dark mode styles
3. Test on all pages using tabs

---

## ✅ Testing Checklist

After implementing each component:

- [ ] Toggle between light and dark modes
- [ ] Test all interactive states (hover, focus, active)
- [ ] Verify on all pages that use the component
- [ ] Check responsive behavior
- [ ] Test keyboard navigation
- [ ] Verify accessibility (contrast ratios)
- [ ] Check for console errors
- [ ] Test on different browsers

---

## 📊 Expected Impact

Fixing these global components will automatically improve:
- ✅ Chicken Orders page (tables, modals, forms, tabs)
- ✅ Feed Management page (tables, modals, forms, tabs)
- ✅ Live Chickens page (tables, modals, forms)
- ✅ Reports page (tables, modals)
- ✅ Processing pages (modals, forms)
- ✅ Lifecycle page (modals, forms)

**Estimated Pages Fixed**: 6 out of 7 (85% of application)

---

## 🚀 Next Steps

After Phase 7 is complete:
1. Review all pages to identify remaining issues
2. Move to Phase 1 (Chicken Orders - remaining work)
3. Continue with other phases as needed
4. Document any page-specific quirks

