import React from 'react';
import { useForm } from '../../../hooks';
import {
  FormSection,
  FormGroup,
  FormField,
  FormActions,
  TextInput,
  NumberInput,
  SelectInput,
  SubmitButton,
  ResetButton,
  ValidationSummary,
  FieldError
} from '../index';

/**
 * ChickenOrderForm - Example form using the new form components
 */
const ChickenOrderForm = ({ onSubmit, initialValues = {}, loading = false }) => {
  // Form validation schema
  const validationSchema = {
    customer: {
      required: true,
      minLength: 2,
      minLengthMessage: 'Customer name must be at least 2 characters'
    },
    phone: {
      required: true,
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      patternMessage: 'Please enter a valid phone number'
    },
    email: {
      email: true,
      emailMessage: 'Please enter a valid email address'
    },
    inventoryType: {
      required: true,
      requiredMessage: 'Please select an inventory type'
    },
    count: {
      required: true,
      custom: (value) => {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
          return 'Count must be a positive number';
        }
        if (num > 1000) {
          return 'Count cannot exceed 1000';
        }
        return null;
      }
    },
    size: {
      required: true,
      custom: (value, allValues) => {
        if (allValues.inventoryType === 'live' && Number(value) < 0.5) {
          return 'Live chicken size must be at least 0.5 kg';
        }
        return null;
      }
    },
    price: {
      required: true,
      custom: (value) => {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
          return 'Price must be a positive number';
        }
        return null;
      }
    }
  };

  // Initialize form with custom hook
  const form = useForm(
    {
      customer: '',
      phone: '',
      email: '',
      address: '',
      inventoryType: '',
      count: '',
      size: '',
      price: '',
      notes: '',
      ...initialValues
    },
    {
      validationSchema,
      onSubmit: async (values) => {
        try {
          await onSubmit(values);
          form.reset();
        } catch (error) {
          console.error('Form submission error:', error);
        }
      },
      validateOnBlur: true,
      validateOnChange: false
    }
  );

  // Inventory type options
  const inventoryOptions = [
    { value: 'live', label: 'Live Chickens' },
    { value: 'dressed', label: 'Dressed Chickens' },
    { value: 'parts', label: 'Chicken Parts' }
  ];

  // Calculate total amount
  const totalAmount = React.useMemo(() => {
    const count = Number(form.values.count) || 0;
    const size = Number(form.values.size) || 0;
    const price = Number(form.values.price) || 0;
    return count * size * price;
  }, [form.values.count, form.values.size, form.values.price]);

  return (
    <form onSubmit={form.handleSubmit} className="chicken-order-form">
      {/* Validation Summary */}
      <ValidationSummary
        form={form}
        title="Please correct the following errors:"
        variant="default"
        showFieldNames={true}
        dismissible={true}
      />

      {/* Customer Information Section */}
      <FormSection
        title="Customer Information"
        subtitle="Enter customer details for the order"
        icon="👤"
        variant="card"
      >
        <FormGroup title="Contact Details" required>
          <FormField
            label="Customer Name"
            name="customer"
            required
            error={form.touched.customer && form.errors.customer}
          >
            <TextInput
              {...form.getFieldProps('customer')}
              placeholder="Enter customer name"
              size="medium"
              clearable
            />
          </FormField>

          <FormField
            label="Phone Number"
            name="phone"
            required
            error={form.touched.phone && form.errors.phone}
            helpText="Include country code if international"
          >
            <TextInput
              {...form.getFieldProps('phone')}
              type="tel"
              placeholder="+1234567890"
              size="medium"
              leftIcon="📞"
            />
          </FormField>

          <FormField
            label="Email Address"
            name="email"
            error={form.touched.email && form.errors.email}
            helpText="Optional - for order confirmations"
          >
            <TextInput
              {...form.getFieldProps('email')}
              type="email"
              placeholder="customer@example.com"
              size="medium"
              leftIcon="✉"
            />
          </FormField>
        </FormGroup>

        <FormGroup title="Address">
          <FormField
            label="Delivery Address"
            name="address"
            error={form.touched.address && form.errors.address}
          >
            <TextInput
              {...form.getFieldProps('address')}
              placeholder="Enter delivery address"
              size="medium"
              leftIcon="📍"
            />
          </FormField>
        </FormGroup>
      </FormSection>

      {/* Order Details Section */}
      <FormSection
        title="Order Details"
        subtitle="Specify the chicken order requirements"
        icon="🐔"
        variant="card"
      >
        <FormGroup title="Product Selection" required>
          <FormField
            label="Inventory Type"
            name="inventoryType"
            required
            error={form.touched.inventoryType && form.errors.inventoryType}
          >
            <SelectInput
              {...form.getFieldProps('inventoryType')}
              options={inventoryOptions}
              placeholder="Select inventory type"
              size="medium"
              clearable
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <FormField
              label="Count"
              name="count"
              required
              error={form.touched.count && form.errors.count}
              helpText="Number of chickens"
            >
              <NumberInput
                {...form.getFieldProps('count')}
                placeholder="0"
                min={1}
                max={1000}
                step={1}
                precision={0}
                showControls
                size="medium"
                suffix=" pcs"
              />
            </FormField>

            <FormField
              label="Size (kg)"
              name="size"
              required
              error={form.touched.size && form.errors.size}
              helpText="Average weight per chicken"
            >
              <NumberInput
                {...form.getFieldProps('size')}
                placeholder="0.0"
                min={0.1}
                max={10}
                step={0.1}
                precision={1}
                showControls
                size="medium"
                suffix=" kg"
              />
            </FormField>

            <FormField
              label="Price per kg (₦)"
              name="price"
              required
              error={form.touched.price && form.errors.price}
              helpText="Price per kilogram"
            >
              <NumberInput
                {...form.getFieldProps('price')}
                placeholder="0.00"
                min={0.01}
                step={0.01}
                precision={2}
                showControls
                size="medium"
                prefix="₦"
              />
            </FormField>
          </div>
        </FormGroup>

        {/* Order Summary */}
        {totalAmount > 0 && (
          <FormGroup title="Order Summary">
            <div className="order-summary">
              <div className="summary-row">
                <span>Total Quantity:</span>
                <span>{form.values.count} × {form.values.size} kg = {(Number(form.values.count) * Number(form.values.size)).toFixed(1)} kg</span>
              </div>
              <div className="summary-row">
                <span>Unit Price:</span>
                <span>₦{Number(form.values.price).toFixed(2)} per kg</span>
              </div>
              <div className="summary-row total">
                <span><strong>Total Amount:</strong></span>
                <span><strong>₦{totalAmount.toFixed(2)}</strong></span>
              </div>
            </div>
          </FormGroup>
        )}

        <FormGroup title="Additional Information">
          <FormField
            label="Notes"
            name="notes"
            error={form.touched.notes && form.errors.notes}
            helpText="Any special instructions or requirements"
          >
            <TextInput
              {...form.getFieldProps('notes')}
              placeholder="Enter any additional notes..."
              size="medium"
            />
          </FormField>
        </FormGroup>
      </FormSection>

      {/* Form Actions */}
      <FormActions alignment="right" spacing="medium">
        <ResetButton
          form={form}
          confirmReset={form.isDirty}
          confirmMessage="Are you sure you want to reset the form? All entered data will be lost."
        >
          Reset Form
        </ResetButton>
        
        <SubmitButton
          form={form}
          loading={loading}
          loadingText="Creating Order..."
        >
          Create Order
        </SubmitButton>
      </FormActions>
    </form>
  );
};

export default ChickenOrderForm;
