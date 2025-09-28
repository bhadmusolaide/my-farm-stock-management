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

// Feed plans based on breed and age
export const FEED_PLANS = {
  'Broiler': [
    {
      stage: 'Starter',
      feedType: 'Starter',
      duration: '0-4 weeks',
      bagsPerBatch: 2,
      description: 'High protein feed for rapid growth'
    },
    {
      stage: 'Finisher',
      feedType: 'Finisher',
      duration: '4-6 weeks',
      bagsPerBatch: 4,
      description: 'Balanced nutrition for final growth phase'
    }
  ],
  'Layer': [
    {
      stage: 'Starter',
      feedType: 'Starter',
      duration: '0-6 weeks',
      bagsPerBatch: 2,
      description: 'High protein feed for chick development'
    },
    {
      stage: 'Grower',
      feedType: 'Grower',
      duration: '6-18 weeks',
      bagsPerBatch: 3,
      description: 'Balanced nutrition for growing pullets'
    },
    {
      stage: 'Layer',
      feedType: 'Layer',
      duration: '18+ weeks',
      bagsPerBatch: 4,
      description: 'Calcium-rich feed for egg production'
    }
  ]
}

// Low stock threshold (in kg)
export const LOW_STOCK_THRESHOLD = 50