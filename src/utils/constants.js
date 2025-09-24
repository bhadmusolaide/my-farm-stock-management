// Application constants for consistent values across the application

// Feed conversion constants
// 1 bag = 25kg (standard feed bag weight)
export const KG_PER_BAG = 25

// Helper function to convert kg to bags
export const kgToBags = (kg) => kg / KG_PER_BAG

// Helper function to convert bags to kg
export const bagsToKg = (bags) => bags * KG_PER_BAG

// Feed brand constants
export const FEED_BRANDS = [
  'New Hope',
  'BreedWell',
  'Ultima',
  'Happy Chicken',
  'Chikum',
  'Others'
]

// Feed type constants
export const FEED_TYPES = [
  'Starter',
  'Grower',
  'Finisher',
  'Layer',
  'Broiler'
]

// Low stock threshold (in kg)
export const LOW_STOCK_THRESHOLD = 50