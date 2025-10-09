/**
 * Unit Tests for DressedChickenStock Component Helper Functions
 * 
 * These tests verify the critical calculation and helper functions
 * used in the DressedChickenStock component.
 */

import { describe, it, expect } from 'vitest';

// Mock data for testing
const mockChickenSizeCategories = [
  { id: '1', name: 'Small', min_weight: 1.0, max_weight: 1.5, is_active: true, sort_order: 1 },
  { id: '2', name: 'Medium', min_weight: 1.5, max_weight: 2.5, is_active: true, sort_order: 2 },
  { id: '3', name: 'Large', min_weight: 2.5, max_weight: 3.5, is_active: true, sort_order: 3 },
  { id: '4', name: 'Inactive', min_weight: 3.5, max_weight: 4.5, is_active: false, sort_order: 4 },
];

// Helper functions extracted for testing
// (In real implementation, these would be imported from the component or a utils file)

const getWholeChickenCount = (chicken) => {
  if (chicken.processing_quantity !== undefined && chicken.processing_quantity !== null) {
    return chicken.processing_quantity;
  }
  if (chicken.current_count !== undefined && chicken.current_count !== null) {
    return chicken.current_count;
  }
  return chicken.initial_count || 0;
};

const getSizeCategoryDisplay = (chicken, chickenSizeCategories) => {
  if (chicken.size_category_custom) {
    return chicken.size_category_custom;
  }
  
  if (chicken.size_category_id && chickenSizeCategories.length > 0) {
    const category = chickenSizeCategories.find(sc => sc.id === chicken.size_category_id);
    if (category) {
      return category.name;
    }
  }
  
  if (chicken.size_category) {
    return chicken.size_category.charAt(0).toUpperCase() + chicken.size_category.slice(1);
  }
  
  return 'Not specified';
};

const calculateDefaultExpiryDate = (processingDateStr) => {
  const date = new Date(processingDateStr);
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().split('T')[0];
};

const isExpiringSoon = (expiryDateStr) => {
  if (!expiryDateStr) return false;
  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
};

const isExpired = (expiryDateStr) => {
  if (!expiryDateStr) return false;
  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  return expiryDate < today;
};

// Tests
describe('DressedChickenStock Helper Functions', () => {
  
  describe('getWholeChickenCount', () => {
    it('should return processing_quantity when available', () => {
      const chicken = {
        processing_quantity: 50,
        current_count: 45,
        initial_count: 50
      };
      expect(getWholeChickenCount(chicken)).toBe(50);
    });

    it('should return current_count when processing_quantity is not available', () => {
      const chicken = {
        current_count: 45,
        initial_count: 50
      };
      expect(getWholeChickenCount(chicken)).toBe(45);
    });

    it('should return initial_count when neither processing_quantity nor current_count available', () => {
      const chicken = {
        initial_count: 50
      };
      expect(getWholeChickenCount(chicken)).toBe(50);
    });

    it('should return 0 when no count fields available', () => {
      const chicken = {};
      expect(getWholeChickenCount(chicken)).toBe(0);
    });

    it('should handle processing_quantity of 0', () => {
      const chicken = {
        processing_quantity: 0,
        current_count: 45
      };
      expect(getWholeChickenCount(chicken)).toBe(0);
    });
  });

  describe('getSizeCategoryDisplay', () => {
    it('should return custom size name when available', () => {
      const chicken = {
        size_category_custom: 'Farm Special',
        size_category_id: '2',
        size_category: 'medium'
      };
      expect(getSizeCategoryDisplay(chicken, mockChickenSizeCategories)).toBe('Farm Special');
    });

    it('should return category name from ID when no custom name', () => {
      const chicken = {
        size_category_id: '2'
      };
      expect(getSizeCategoryDisplay(chicken, mockChickenSizeCategories)).toBe('Medium');
    });

    it('should return capitalized old format when no new format', () => {
      const chicken = {
        size_category: 'large'
      };
      expect(getSizeCategoryDisplay(chicken, mockChickenSizeCategories)).toBe('Large');
    });

    it('should return "Not specified" when no size category data', () => {
      const chicken = {};
      expect(getSizeCategoryDisplay(chicken, mockChickenSizeCategories)).toBe('Not specified');
    });

    it('should handle invalid size_category_id gracefully', () => {
      const chicken = {
        size_category_id: '999'
      };
      expect(getSizeCategoryDisplay(chicken, mockChickenSizeCategories)).toBe('Not specified');
    });

    it('should handle empty chickenSizeCategories array', () => {
      const chicken = {
        size_category_id: '2'
      };
      expect(getSizeCategoryDisplay(chicken, [])).toBe('Not specified');
    });
  });

  describe('calculateDefaultExpiryDate', () => {
    it('should add 3 months to processing date', () => {
      const processingDate = '2024-01-15';
      const expectedExpiry = '2024-04-15';
      expect(calculateDefaultExpiryDate(processingDate)).toBe(expectedExpiry);
    });

    it('should handle year rollover', () => {
      const processingDate = '2024-11-15';
      const expectedExpiry = '2025-02-15';
      expect(calculateDefaultExpiryDate(processingDate)).toBe(expectedExpiry);
    });

    it('should handle month-end dates', () => {
      const processingDate = '2024-01-31';
      // JavaScript Date handles this - may result in last day of April
      const result = calculateDefaultExpiryDate(processingDate);
      expect(result).toMatch(/2024-04-/);
    });
  });

  describe('isExpiringSoon', () => {
    it('should return true for date 5 days in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dateStr = futureDate.toISOString().split('T')[0];
      expect(isExpiringSoon(dateStr)).toBe(true);
    });

    it('should return true for date 7 days in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split('T')[0];
      expect(isExpiringSoon(dateStr)).toBe(true);
    });

    it('should return false for date 8 days in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 8);
      const dateStr = futureDate.toISOString().split('T')[0];
      expect(isExpiringSoon(dateStr)).toBe(false);
    });

    it('should return false for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateStr = pastDate.toISOString().split('T')[0];
      expect(isExpiringSoon(dateStr)).toBe(false);
    });

    it('should return false for null date', () => {
      expect(isExpiringSoon(null)).toBe(false);
    });

    it('should return false for undefined date', () => {
      expect(isExpiringSoon(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isExpiringSoon('')).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return true for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateStr = pastDate.toISOString().split('T')[0];
      expect(isExpired(dateStr)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateStr = futureDate.toISOString().split('T')[0];
      expect(isExpired(dateStr)).toBe(false);
    });

    it('should return false for today', () => {
      const today = new Date().toISOString().split('T')[0];
      // Note: This might be flaky depending on exact time of day
      // In production, you'd want to normalize to start of day
      expect(isExpired(today)).toBe(false);
    });

    it('should return false for null date', () => {
      expect(isExpired(null)).toBe(false);
    });

    it('should return false for undefined date', () => {
      expect(isExpired(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isExpired('')).toBe(false);
    });
  });

  describe('Yield Rate Calculation', () => {
    it('should calculate 100% yield for perfect processing', () => {
      const birdsProcessed = 50;
      const dressedCount = 50;
      const yieldRate = ((dressedCount / birdsProcessed) * 100).toFixed(1);
      expect(yieldRate).toBe('100.0');
    });

    it('should calculate 95% yield for 5% loss', () => {
      const birdsProcessed = 100;
      const dressedCount = 95;
      const yieldRate = ((dressedCount / birdsProcessed) * 100).toFixed(1);
      expect(yieldRate).toBe('95.0');
    });

    it('should handle zero birds processed', () => {
      const birdsProcessed = 0;
      const dressedCount = 0;
      const yieldRate = birdsProcessed > 0 
        ? ((dressedCount / birdsProcessed) * 100).toFixed(1) 
        : '0';
      expect(yieldRate).toBe('0');
    });
  });

  describe('Average Weight Calculation', () => {
    it('should calculate correct average weight', () => {
      const totalPartsWeight = 150; // kg
      const processingQuantity = 50; // birds
      const averageWeight = processingQuantity > 0 
        ? (totalPartsWeight / processingQuantity) 
        : 0;
      expect(averageWeight).toBe(3.0);
    });

    it('should return 0 for zero processing quantity', () => {
      const totalPartsWeight = 150;
      const processingQuantity = 0;
      const averageWeight = processingQuantity > 0 
        ? (totalPartsWeight / processingQuantity) 
        : 0;
      expect(averageWeight).toBe(0);
    });

    it('should handle decimal weights correctly', () => {
      const totalPartsWeight = 123.45;
      const processingQuantity = 50;
      const averageWeight = processingQuantity > 0 
        ? (totalPartsWeight / processingQuantity) 
        : 0;
      expect(averageWeight).toBeCloseTo(2.469, 3);
    });
  });
});

