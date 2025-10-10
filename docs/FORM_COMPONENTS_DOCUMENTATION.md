# Form Components Documentation

## Overview

The Form Components library provides a comprehensive set of reusable form components designed for the Farm Stock Management application. These components follow consistent design patterns, accessibility standards, and provide extensive customization options.

## Architecture

The form components are organized into several categories:

### Base Components
- **FormField**: Wrapper for form inputs with label, error handling, and help text
- **FormGroup**: Groups related form fields with optional collapsible functionality
- **FormSection**: Major form sections with headers and actions
- **FormActions**: Standardized form action buttons with consistent spacing

### Input Components
- **TextInput**: Enhanced text input with icons, validation states, and formatting
- **NumberInput**: Number input with formatting, validation, and increment/decrement controls
- **SelectInput**: Advanced select with search, multi-select, grouping, and custom rendering

### Validation Components
- **ErrorMessage**: Displays validation errors with consistent styling
- **ValidationSummary**: Form-level validation summary with error navigation
- **FieldValidator**: Higher-order component for field-level validation

## Quick Start

```jsx
import {
  FormSection,
  FormGroup,
  FormField,
  TextInput,
  NumberInput,
  SelectInput,
  FormActions,
  SubmitButton,
  ResetButton
} from '../components/Forms';

const MyForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    category: ''
  });

  return (
    <form>
      <FormSection title="Personal Information" variant="card">
        <FormGroup title="Basic Details">
          <FormField label="Name" name="name" required>
            <TextInput
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter your name"
            />
          </FormField>
          
          <FormField label="Age" name="age">
            <NumberInput
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              min={0}
              max={120}
            />
          </FormField>
        </FormGroup>
      </FormSection>
      
      <FormActions alignment="right">
        <ResetButton>Reset</ResetButton>
        <SubmitButton>Submit</SubmitButton>
      </FormActions>
    </form>
  );
};
```

## Component API Reference

### FormField

Wrapper component for form inputs with label, error handling, and help text.

**Props:**
- `label` (string): Field label text
- `name` (string): Field name for form handling
- `required` (boolean): Whether the field is required
- `error` (string): Error message to display
- `helpText` (string): Help text below the input
- `inline` (boolean): Display label and input inline
- `disabled` (boolean): Disable the entire field
- `children` (ReactNode): The input component

**Example:**
```jsx
<FormField
  label="Email Address"
  name="email"
  required
  error={errors.email}
  helpText="We'll never share your email"
>
  <TextInput type="email" />
</FormField>
```

### FormGroup

Groups related form fields with optional title, description, and collapsible functionality.

**Props:**
- `title` (string): Group title
- `description` (string): Group description
- `collapsible` (boolean): Enable collapse/expand functionality
- `defaultCollapsed` (boolean): Start in collapsed state
- `required` (boolean): Mark group as required
- `disabled` (boolean): Disable all fields in group
- `children` (ReactNode): Form fields

**Example:**
```jsx
<FormGroup
  title="Contact Information"
  description="How we can reach you"
  collapsible
  required
>
  <FormField label="Phone" name="phone">
    <TextInput type="tel" />
  </FormField>
  <FormField label="Email" name="email">
    <TextInput type="email" />
  </FormField>
</FormGroup>
```

### FormSection

Major form section with header, optional actions, and content area.

**Props:**
- `title` (string): Section title
- `subtitle` (string): Section subtitle
- `icon` (ReactNode): Icon for the section
- `actions` (ReactNode): Action buttons in header
- `variant` ('default' | 'card' | 'bordered' | 'minimal'): Visual style
- `size` ('small' | 'medium' | 'large'): Section padding size
- `collapsible` (boolean): Enable collapse/expand
- `children` (ReactNode): Section content

**Example:**
```jsx
<FormSection
  title="Order Details"
  subtitle="Specify your order requirements"
  icon="🛒"
  variant="card"
  actions={<button>Clear</button>}
>
  {/* Form content */}
</FormSection>
```

### TextInput

Enhanced text input with validation states, icons, and formatting options.

**Props:**
- `type` ('text' | 'email' | 'password' | 'url' | 'tel' | 'search'): Input type
- `value` (string): Input value
- `onChange` (function): Change handler
- `placeholder` (string): Placeholder text
- `size` ('small' | 'medium' | 'large'): Input size
- `variant` ('default' | 'filled' | 'outlined'): Visual style
- `leftIcon` (ReactNode): Icon on the left
- `rightIcon` (ReactNode): Icon on the right
- `clearable` (boolean): Show clear button
- `loading` (boolean): Show loading spinner
- `error` (boolean): Error state styling
- `success` (boolean): Success state styling
- `disabled` (boolean): Disable input
- `readOnly` (boolean): Read-only state

**Example:**
```jsx
<TextInput
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Enter email address"
  leftIcon="✉"
  clearable
  error={!!emailError}
/>
```

### NumberInput

Number input with formatting, validation, and increment/decrement controls.

**Props:**
- `value` (string | number): Input value
- `onChange` (function): Change handler
- `min` (number): Minimum value
- `max` (number): Maximum value
- `step` (number): Increment/decrement step
- `precision` (number): Decimal places
- `allowNegative` (boolean): Allow negative numbers
- `allowDecimal` (boolean): Allow decimal numbers
- `thousandSeparator` (string): Thousand separator character
- `decimalSeparator` (string): Decimal separator character
- `prefix` (string): Text prefix (e.g., "$")
- `suffix` (string): Text suffix (e.g., "kg")
- `showControls` (boolean): Show increment/decrement buttons
- `formatOnBlur` (boolean): Format number on blur
- `parseOnFocus` (boolean): Parse to raw number on focus

**Example:**
```jsx
<NumberInput
  value={price}
  onChange={(e) => setPrice(e.target.value)}
  min={0}
  step={0.01}
  precision={2}
  prefix="$"
  showControls
  thousandSeparator=","
/>
```

### SelectInput

Advanced select with search, multi-select, grouping, and custom rendering.

**Props:**
- `options` (array): Array of options
- `value` (string | number | array): Selected value(s)
- `onChange` (function): Change handler
- `multiple` (boolean): Enable multi-select
- `searchable` (boolean): Enable search functionality
- `clearable` (boolean): Show clear button
- `loading` (boolean): Show loading state
- `placeholder` (string): Placeholder text
- `groupBy` (string | function): Group options by property
- `renderOption` (function): Custom option renderer
- `renderValue` (function): Custom value renderer
- `filterOption` (function): Custom filter function
- `noOptionsMessage` (string): Message when no options
- `maxHeight` (number): Dropdown max height

**Example:**
```jsx
<SelectInput
  options={[
    { value: 'live', label: 'Live Chickens' },
    { value: 'dressed', label: 'Dressed Chickens' }
  ]}
  value={selectedType}
  onChange={(e) => setSelectedType(e.target.value)}
  searchable
  clearable
  placeholder="Select chicken type"
/>
```

## Validation System

### FieldValidator

Higher-order component that adds validation to form fields.

**Props:**
- `name` (string): Field name
- `value` (any): Field value
- `rules` (object): Validation rules
- `customValidator` (function): Custom validation function
- `validateOnChange` (boolean): Validate on every change
- `validateOnBlur` (boolean): Validate on blur
- `validateOnMount` (boolean): Validate on component mount
- `dependencies` (array): Fields that trigger re-validation

**Validation Rules:**
- `required`: Field is required
- `minLength`: Minimum string length
- `maxLength`: Maximum string length
- `min`: Minimum numeric value
- `max`: Maximum numeric value
- `pattern`: RegExp pattern
- `email`: Email validation
- `url`: URL validation
- `number`: Number validation
- `integer`: Integer validation
- `custom`: Custom validation function

**Example:**
```jsx
<FieldValidator
  name="email"
  value={email}
  rules={{
    required: true,
    email: true,
    minLength: 5
  }}
  validateOnBlur
>
  <TextInput
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</FieldValidator>
```

### ValidationSummary

Displays a summary of all validation errors in a form.

**Props:**
- `form` (object): Form object with errors
- `errors` (object): Error object
- `title` (string): Summary title
- `showFieldNames` (boolean): Include field names in errors
- `showOnlyTouched` (boolean): Only show errors for touched fields
- `groupByField` (boolean): Group errors by field
- `maxErrors` (number): Maximum errors to display
- `variant` ('default' | 'compact' | 'detailed'): Display style
- `dismissible` (boolean): Allow dismissing the summary
- `onErrorClick` (function): Handler for error item clicks

**Example:**
```jsx
<ValidationSummary
  form={form}
  title="Please correct the following errors:"
  showFieldNames
  dismissible
  onErrorClick={(field) => focusField(field)}
/>
```

## Styling and Theming

The form components use CSS custom properties for theming:

```css
:root {
  --form-spacing-xs: 0.25rem;
  --form-spacing-sm: 0.5rem;
  --form-spacing-md: 1rem;
  --form-spacing-lg: 1.5rem;
  --form-spacing-xl: 2rem;
  
  --form-border-radius: 0.375rem;
  --form-border-color: #d1d5db;
  --form-border-color-focus: #3b82f6;
  --form-border-color-error: #ef4444;
  
  --form-bg-color: #ffffff;
  --form-text-color: #374151;
  --form-text-color-error: #dc2626;
}
```

### Dark Mode Support

Dark mode is supported through the `[data-theme="dark"]` attribute:

```css
[data-theme="dark"] {
  --form-bg-color: #1f2937;
  --form-text-color: #f9fafb;
  --form-border-color: #374151;
}
```

## Accessibility

All form components follow accessibility best practices:

- **ARIA attributes**: Proper `aria-invalid`, `aria-describedby`, `role` attributes
- **Keyboard navigation**: Full keyboard support for all interactive elements
- **Focus management**: Proper focus indicators and focus trapping
- **Screen reader support**: Semantic HTML and descriptive labels
- **Error announcements**: Errors are announced via `role="alert"`

## Best Practices

1. **Always use FormField wrapper** for consistent styling and accessibility
2. **Group related fields** with FormGroup for better organization
3. **Provide helpful error messages** that guide users to fix issues
4. **Use appropriate input types** for better mobile experience
5. **Include help text** for complex or important fields
6. **Test with keyboard navigation** to ensure accessibility
7. **Validate on blur** rather than on every keystroke for better UX
8. **Use ValidationSummary** for forms with multiple fields

## Integration with Custom Hooks

The form components work seamlessly with the custom hooks from Phase 4:

```jsx
import { useForm } from '../hooks';

const MyForm = () => {
  const form = useForm(
    { name: '', email: '' },
    {
      validationSchema: {
        name: { required: true, minLength: 2 },
        email: { required: true, email: true }
      }
    }
  );

  return (
    <form onSubmit={form.handleSubmit}>
      <FormField label="Name" error={form.errors.name}>
        <TextInput {...form.getFieldProps('name')} />
      </FormField>
      
      <FormActions>
        <SubmitButton form={form}>Submit</SubmitButton>
      </FormActions>
    </form>
  );
};
```

This documentation provides a comprehensive guide to using the form components effectively in the Farm Stock Management application.
