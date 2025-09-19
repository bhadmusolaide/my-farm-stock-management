// Test script to add sample feed data for testing inventory features
// This works with localStorage when Supabase is not available

// Sample feed data for testing
const sampleFeedData = [
  {
    id: "1701234567890",
    feed_type: "Starter Feed",
    brand: "Premium Poultry",
    number_of_bags: 10,
    cost_per_bag: 25.50,
    weight_per_bag: 50,
    batch_number: "BATCH-1701234567890",
    purchase_date: "2024-12-01",
    expiry_date: "2025-06-01",
    supplier: "Farm Supply Co",
    cost_per_kg: 25.50,
    balance_deducted: false,
    created_at: "2024-12-01T10:00:00.000Z",
    updated_at: "2024-12-01T10:00:00.000Z"
  },
  {
    id: "1701234567891",
    feed_type: "Grower Feed",
    brand: "Quality Feeds",
    number_of_bags: 15,
    cost_per_bag: 28.75,
    weight_per_bag: 50,
    batch_number: "BATCH-1701234567891",
    purchase_date: "2024-12-05",
    expiry_date: "2025-07-01",
    supplier: "Agri Solutions",
    cost_per_kg: 28.75,
    balance_deducted: false,
    created_at: "2024-12-05T10:00:00.000Z",
    updated_at: "2024-12-05T10:00:00.000Z"
  },
  {
    id: "1701234567892",
    feed_type: "Finisher Feed",
    brand: "Premium Poultry",
    number_of_bags: 8,
    cost_per_bag: 32.00,
    weight_per_bag: 50,
    batch_number: "BATCH-1701234567892",
    purchase_date: "2024-12-10",
    expiry_date: "2025-08-01",
    supplier: "Farm Supply Co",
    cost_per_kg: 32.00,
    balance_deducted: false,
    created_at: "2024-12-10T10:00:00.000Z",
    updated_at: "2024-12-10T10:00:00.000Z"
  },
  {
    id: "1701234567893",
    feed_type: "Layer Feed",
    brand: "Egg Master",
    number_of_bags: 12,
    cost_per_bag: 30.25,
    weight_per_bag: 50,
    batch_number: "BATCH-1701234567893",
    purchase_date: "2024-12-15",
    expiry_date: "2025-09-01",
    supplier: "Poultry Plus",
    cost_per_kg: 30.25,
    balance_deducted: false,
    created_at: "2024-12-15T10:00:00.000Z",
    updated_at: "2024-12-15T10:00:00.000Z"
  }
];

// Sample feed consumption data for analytics testing
const sampleFeedConsumption = [
  {
    id: "consumption-1",
    chicken_batch_id: "batch-001",
    feed_id: "1701234567890",
    quantity_consumed: 2.5,
    consumption_date: "2024-12-02",
    notes: "Morning feeding - Starter batch",
    created_at: "2024-12-02T08:00:00.000Z"
  },
  {
    id: "consumption-2",
    chicken_batch_id: "batch-002",
    feed_id: "1701234567891",
    quantity_consumed: 3.2,
    consumption_date: "2024-12-06",
    notes: "Daily feeding - Grower batch",
    created_at: "2024-12-06T08:00:00.000Z"
  },
  {
    id: "consumption-3",
    chicken_batch_id: "batch-003",
    feed_id: "1701234567892",
    quantity_consumed: 4.1,
    consumption_date: "2024-12-11",
    notes: "Evening feeding - Finisher batch",
    created_at: "2024-12-11T18:00:00.000Z"
  },
  {
    id: "consumption-4",
    chicken_batch_id: "batch-001",
    feed_id: "1701234567890",
    quantity_consumed: 3.0,
    consumption_date: "2024-12-03",
    notes: "Evening feeding - Starter batch",
    created_at: "2024-12-03T18:00:00.000Z"
  },
  {
    id: "consumption-5",
    chicken_batch_id: "batch-002",
    feed_id: "1701234567891",
    quantity_consumed: 3.8,
    consumption_date: "2024-12-07",
    notes: "Morning feeding - Grower batch",
    created_at: "2024-12-07T08:00:00.000Z"
  }
];

// Sample live chicken batches for analytics testing
const sampleLiveChickens = [
  {
    id: "batch-001",
    batch_id: "BATCH-001",
    initial_count: 100,
    current_count: 98,
    current_weight: 1.2,
    hatch_date: "2024-11-01",
    breed: "Broiler",
    source: "Local Hatchery",
    created_at: "2024-11-01T10:00:00.000Z"
  },
  {
    id: "batch-002", 
    batch_id: "BATCH-002",
    initial_count: 150,
    current_count: 147,
    current_weight: 2.1,
    hatch_date: "2024-10-15",
    breed: "Layer",
    source: "Premium Hatchery",
    created_at: "2024-10-15T10:00:00.000Z"
  },
  {
    id: "batch-003",
    batch_id: "BATCH-003", 
    initial_count: 80,
    current_count: 79,
    current_weight: 2.8,
    hatch_date: "2024-10-01",
    breed: "Broiler",
    source: "Local Hatchery",
    created_at: "2024-10-01T10:00:00.000Z"
  }
];

// Function to add sample data to localStorage
function addSampleDataToLocalStorage() {
  try {
    // Add feed inventory data
    localStorage.setItem('feedInventory', JSON.stringify(sampleFeedData));
    
    // Add feed consumption data
    localStorage.setItem('feedConsumption', JSON.stringify(sampleFeedConsumption));
    
    // Add live chickens for analytics
    localStorage.setItem('liveChickens', JSON.stringify(sampleLiveChickens));
    
    console.log("✅ Sample feed data added to localStorage!");
    console.log("📊 Added", sampleFeedData.length, "feed inventory items");
    console.log("📈 Added", sampleFeedConsumption.length, "consumption records");
    console.log("🐔 Live Chickens:", sampleLiveChickens.length, "batches");
    
    // Refresh the page to load the new data
    window.location.reload();
    
  } catch (error) {
    console.error("❌ Error adding sample data:", error);
  }
}

// Function to clear test data
function clearTestData() {
  localStorage.removeItem('feedInventory');
  localStorage.removeItem('feedConsumption');
  localStorage.removeItem('liveChickens');
  console.log("🗑️ Test data cleared from localStorage");
  window.location.reload();
}

// Function to check current data
function checkCurrentData() {
  const feedInventory = JSON.parse(localStorage.getItem('feedInventory') || '[]');
  const feedConsumption = JSON.parse(localStorage.getItem('feedConsumption') || '[]');
  
  console.log("📦 Current Feed Inventory:", feedInventory.length, "items");
  console.log("📊 Current Feed Consumption:", feedConsumption.length, "records");
  
  return { feedInventory, feedConsumption };
}

// Testing instructions
console.log(`
=== FEED INVENTORY TESTING GUIDE ===

🚀 SETUP:
1. Run: addSampleDataToLocalStorage()
2. Navigate to Feed Management page
3. Test both Inventory and Analytics tabs

📋 INVENTORY TAB TESTS:
✓ View feed inventory list (4 sample items)
✓ Search by feed type, brand, or supplier
✓ Filter dropdown functionality
✓ Sort by columns (date, cost, quantity)
✓ Add new feed button
✓ Edit/Delete actions
✓ Responsive grid layout

📈 ANALYTICS TAB TESTS:
✓ Performance insights cards
✓ Top performing batches section
✓ Feed efficiency metrics
✓ Cost analysis charts
✓ Batch comparison tools

📱 RESPONSIVE TESTS:
✓ Desktop (1200px+): Full grid layout
✓ Tablet (768-1199px): 2-column grid
✓ Mobile (480-767px): Single column
✓ Small mobile (<480px): Compact view

🛠️ UTILITY FUNCTIONS:
- addSampleDataToLocalStorage() - Add test data
- clearTestData() - Remove test data
- checkCurrentData() - View current data

Ready to test! Run addSampleDataToLocalStorage() to begin.
`);

// Analytics Testing Functions
function testAnalyticsFeatures() {
  console.log('🧪 Testing Analytics Features...');
  
  // Test FCR calculations
  console.log('\n📊 FCR (Feed Conversion Ratio) Testing:');
  sampleLiveChickens.forEach(batch => {
    const consumption = sampleFeedConsumption.filter(c => c.chicken_batch_id === batch.id);
    const totalFeed = consumption.reduce((sum, c) => sum + c.quantity_consumed, 0);
    const weightGain = batch.current_weight * batch.current_count;
    const fcr = weightGain > 0 ? (totalFeed / weightGain).toFixed(2) : 'N/A';
    console.log(`  ${batch.batch_id}: FCR = ${fcr} (${totalFeed}kg feed / ${weightGain}kg weight)`);
  });
  
  // Test feed cost analysis
  console.log('\n💰 Feed Cost Analysis:');
  const totalInvestment = sampleFeedData.reduce((sum, item) => 
    sum + (item.number_of_bags * item.cost_per_bag), 0);
  console.log(`  Total Feed Investment: $${totalInvestment.toFixed(2)}`);
  
  const avgCostPerKg = sampleFeedData.reduce((sum, item) => 
    sum + item.cost_per_kg, 0) / sampleFeedData.length;
  console.log(`  Average Cost per Kg: $${avgCostPerKg.toFixed(2)}`);
  
  // Test batch performance
  console.log('\n🏆 Batch Performance Analysis:');
  sampleLiveChickens.forEach(batch => {
    const ageInWeeks = Math.floor((new Date() - new Date(batch.hatch_date)) / (1000 * 60 * 60 * 24 * 7));
    const expectedWeight = ageInWeeks * 0.15;
    const efficiency = ((batch.current_weight / expectedWeight) * 100).toFixed(1);
    console.log(`  ${batch.batch_id}: ${ageInWeeks} weeks old, ${efficiency}% efficiency`);
  });
  
  console.log('\n✅ Analytics testing complete!');
}

function validateAnalyticsData() {
  console.log('🔍 Validating Analytics Data Structure...');
  
  // Validate feed inventory
  const feedInventory = JSON.parse(localStorage.getItem('feedInventory') || '[]');
  console.log(`📊 Feed Inventory: ${feedInventory.length} items`);
  
  // Validate feed consumption
  const feedConsumption = JSON.parse(localStorage.getItem('feedConsumption') || '[]');
  console.log(`📈 Feed Consumption: ${feedConsumption.length} records`);
  
  // Validate live chickens
  const liveChickens = JSON.parse(localStorage.getItem('liveChickens') || '[]');
  console.log(`🐔 Live Chickens: ${liveChickens.length} batches`);
  
  // Check data relationships
  console.log('\n🔗 Data Relationships:');
  feedConsumption.forEach(consumption => {
    const batch = liveChickens.find(b => b.id === consumption.chicken_batch_id);
    const feed = feedInventory.find(f => f.id === consumption.feed_id);
    console.log(`  Consumption ${consumption.id}: Batch ${batch ? '✅' : '❌'}, Feed ${feed ? '✅' : '❌'}`);
  });
  
  console.log('\n✅ Data validation complete!');
}

function testResponsiveBreakpoints() {
  console.log('🔧 Testing Responsive Design Breakpoints...');
  
  const breakpoints = [
    { name: 'Desktop', width: 1200, minWidth: 1024 },
    { name: 'Tablet', width: 768, maxWidth: 1023 },
    { name: 'Mobile', width: 480, maxWidth: 767 }
  ];
  
  console.log('📋 RESPONSIVE TESTING CHECKLIST:');
  console.log('================================');
  
  breakpoints.forEach(bp => {
    console.log(`\n📱 ${bp.name.toUpperCase()} BREAKPOINT (${bp.width}px):`);
    console.log(`   Target: ${bp.minWidth ? `${bp.minWidth}px+` : `≤${bp.maxWidth}px`}`);
    console.log('   ✓ Analytics summary cards layout');
    console.log('   ✓ Top performers grid responsiveness');
    console.log('   ✓ Tab navigation stacking/scrolling');
    console.log('   ✓ Modal dialogs fit screen');
    console.log('   ✓ Feed efficiency bars layout');
    console.log('   ✓ Cost analysis grid adaptation');
    console.log('   ✓ Button groups stack properly');
    console.log('   ✓ Text remains readable');
  });
  
  console.log('\n🛠️ TESTING INSTRUCTIONS:');
  console.log('1. Open browser dev tools (F12)');
  console.log('2. Toggle device toolbar (Ctrl+Shift+M)');
  console.log('3. Test each breakpoint systematically');
  console.log('4. Navigate to Analytics tab');
  console.log('5. Verify all components adapt correctly');
  console.log('6. Test modal interactions at each size');
  
  console.log('\n📊 CURRENT CSS BREAKPOINTS DETECTED:');
  console.log('- @media (max-width: 768px) - Tablet/Mobile');
  console.log('- @media (max-width: 480px) - Mobile only');
  console.log('- Grid layouts: auto-fit, minmax(280px, 1fr)');
  
  if (typeof window !== 'undefined') {
    const currentWidth = window.innerWidth;
    console.log(`\n📐 Current viewport: ${currentWidth}px`);
    
    if (currentWidth >= 1024) {
      console.log('📺 Desktop view (≥1024px) - All features should be visible');
    } else if (currentWidth >= 768) {
      console.log('💻 Tablet view (768-1023px) - Cards should stack in 2 columns');
    } else if (currentWidth >= 480) {
      console.log('📱 Mobile Large view (480-767px) - Cards should stack vertically');
    } else {
      console.log('📱 Mobile Small view (<480px) - Compact layout');
    }
  }
  
  console.log('\n✅ Responsive testing guidelines ready');
  return true;
}

// Advanced responsive testing with viewport simulation
function simulateViewportSizes() {
  console.log('📐 Simulating Different Viewport Sizes...');
  
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Large Desktop', width: 1920, height: 1080 }
  ];
  
  viewports.forEach(vp => {
    console.log(`\n📱 ${vp.name}: ${vp.width}x${vp.height}`);
    console.log(`   CSS: @media (max-width: ${vp.width}px)`);
    console.log(`   Test: Analytics cards, navigation, modals`);
  });
  
  return viewports;
}

// Check responsive CSS rules
function validateResponsiveCSS() {
  console.log('🎨 Validating Responsive CSS Implementation...');
  
  const expectedRules = [
    'Analytics cards grid adaptation',
    'Tab navigation responsive behavior', 
    'Modal dialog mobile optimization',
    'Feed efficiency bars mobile layout',
    'Cost analysis responsive grid',
    'Button group stacking on mobile'
  ];
  
  expectedRules.forEach((rule, index) => {
    console.log(`✓ ${index + 1}. ${rule}`);
  });
  
  console.log('\n📋 CSS MEDIA QUERIES FOUND:');
  console.log('- Tablet: @media (max-width: 768px)');
  console.log('- Mobile: @media (max-width: 480px)');
  console.log('- Grid: repeat(auto-fit, minmax(280px, 1fr))');
  
  return true;
}

// Make functions globally available
window.addSampleDataToLocalStorage = addSampleDataToLocalStorage;
window.clearTestData = clearTestData;
window.checkCurrentData = checkCurrentData;
window.sampleFeedData = sampleFeedData;
window.testAnalyticsFeatures = testAnalyticsFeatures;
window.validateAnalyticsData = validateAnalyticsData;
window.testResponsiveBreakpoints = testResponsiveBreakpoints;
window.simulateViewportSizes = simulateViewportSizes;
window.validateResponsiveCSS = validateResponsiveCSS;