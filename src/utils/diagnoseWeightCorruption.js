import { supabase } from './supabaseClient';

/**
 * Diagnostic utility to identify weight data corruption issues
 * This script checks for the specific pattern where 2.5kg shows as 0.33kg
 */
export async function diagnoseWeightCorruption() {
  console.log('🔍 Starting weight corruption diagnosis...');

  const results = {
    summary: {
      totalIssues: 0,
      corruptionPatterns: []
    },
    liveChickens: {
      suspiciousRecords: [],
      inconsistencyRecords: [],
      exactCorruptionMatches: []
    },
    weightHistory: {
      suspiciousRecords: []
    },
    dressedChickens: {
      suspiciousRecords: []
    },
    dataTypes: []
  };

  try {
    // 1. Check for suspicious weight patterns in live_chickens
    console.log('📊 Checking live_chickens table...');
    const { data: liveChickensData, error: liveChickensError } = await supabase
      .from('live_chickens')
      .select('*')
      .not('current_weight', 'is', null)
      .order('current_weight');

    if (liveChickensError) {
      console.error('❌ Error fetching live_chickens:', liveChickensError);
    } else {
      console.log(`✅ Found ${liveChickensData?.length || 0} live chicken records`);

      // Analyze weight patterns
      liveChickensData?.forEach(record => {
        const weight = parseFloat(record.current_weight);

        // Check for the exact corruption pattern (0.33kg)
        if (Math.abs(weight - 0.33) < 0.01) {
          results.liveChickens.exactCorruptionMatches.push({
            id: record.id,
            batch_id: record.batch_id,
            current_weight: weight,
            expected_weight: parseFloat(record.expected_weight) || null,
            potential_original: Math.round(weight * 7.57 * 100) / 100,
            created_at: record.created_at,
            updated_at: record.updated_at
          });
          results.summary.totalIssues++;
        }

        // Check for suspicious range (0.3-0.4kg)
        if (weight >= 0.3 && weight <= 0.4) {
          results.liveChickens.suspiciousRecords.push({
            id: record.id,
            batch_id: record.batch_id,
            current_weight: weight,
            expected_weight: parseFloat(record.expected_weight) || null
          });
        }
      });

      console.log(`🚨 Found ${results.liveChickens.exactCorruptionMatches.length} exact corruption matches (0.33kg)`);
      console.log(`⚠️ Found ${results.liveChickens.suspiciousRecords.length} suspicious records (0.3-0.4kg)`);
    }

    // 2. Check for weight inconsistencies
    console.log('🔍 Checking for weight inconsistencies...');
    const { data: inconsistencyData, error: inconsistencyError } = await supabase
      .from('live_chickens')
      .select('*')
      .not('current_weight', 'is', null)
      .not('expected_weight', 'is', null);

    if (inconsistencyError) {
      console.error('❌ Error checking inconsistencies:', inconsistencyError);
    } else {
      inconsistencyData?.forEach(record => {
        const current = parseFloat(record.current_weight);
        const expected = parseFloat(record.expected_weight);
        const difference = Math.abs(current - expected);

        // Look for the specific 2.5kg -> 0.33kg pattern
        if (Math.abs(expected - 2.5) < 0.01 && Math.abs(current - 0.33) < 0.01) {
          results.liveChickens.inconsistencyRecords.push({
            id: record.id,
            batch_id: record.batch_id,
            current_weight: current,
            expected_weight: expected,
            difference: difference,
            corruption_ratio: Math.round((current / expected) * 100) / 100
          });
          results.summary.totalIssues++;
        }

        // Check for large differences (>2kg)
        if (difference > 2.0) {
          results.liveChickens.inconsistencyRecords.push({
            id: record.id,
            batch_id: record.batch_id,
            current_weight: current,
            expected_weight: expected,
            difference: difference,
            issue: 'LARGE_DIFFERENCE'
          });
        }
      });

      console.log(`🚨 Found ${results.liveChickens.inconsistencyRecords.length} inconsistency records`);
    }

    // 3. Check weight_history table
    console.log('📚 Checking weight_history table...');
    const { data: weightHistoryData, error: weightHistoryError } = await supabase
      .from('weight_history')
      .select('*')
      .not('weight', 'is', null)
      .order('weight');

    if (weightHistoryError) {
      console.error('❌ Error fetching weight_history:', weightHistoryError);
    } else {
      console.log(`✅ Found ${weightHistoryData?.length || 0} weight history records`);

      weightHistoryData?.forEach(record => {
        const weight = parseFloat(record.weight);

        if (Math.abs(weight - 0.33) < 0.01) {
          results.weightHistory.suspiciousRecords.push({
            id: record.id,
            chicken_batch_id: record.chicken_batch_id,
            weight: weight,
            recorded_date: record.recorded_date,
            potential_original: Math.round(weight * 7.57 * 100) / 100
          });
          results.summary.totalIssues++;
        }
      });

      console.log(`🚨 Found ${results.weightHistory.suspiciousRecords.length} suspicious weight history records`);
    }

    // 4. Check dressed_chickens table
    console.log('🍗 Checking dressed_chickens table...');
    const { data: dressedChickensData, error: dressedChickensError } = await supabase
      .from('dressed_chickens')
      .select('*')
      .not('average_weight', 'is', null)
      .order('average_weight');

    if (dressedChickensError) {
      console.error('❌ Error fetching dressed_chickens:', dressedChickensError);
    } else {
      console.log(`✅ Found ${dressedChickensData?.length || 0} dressed chicken records`);

      dressedChickensData?.forEach(record => {
        const weight = parseFloat(record.average_weight);

        if (Math.abs(weight - 0.33) < 0.01) {
          results.dressedChickens.suspiciousRecords.push({
            id: record.id,
            batch_id: record.batch_id,
            average_weight: weight,
            processing_date: record.processing_date,
            potential_original: Math.round(weight * 7.57 * 100) / 100
          });
          results.summary.totalIssues++;
        }
      });

      console.log(`🚨 Found ${results.dressedChickens.suspiciousRecords.length} suspicious dressed chicken records`);
    }

    // 5. Check data types
    console.log('🔧 Checking data types...');
    const { data: columnsData, error: columnsError } = await supabase
      .rpc('get_table_columns', {
        table_name: 'live_chickens'
      });

    if (columnsError) {
      console.log('ℹ️ Using fallback method for data type checking...');
      // Fallback: describe the tables manually
      const tables = ['live_chickens', 'weight_history', 'dressed_chickens'];
      for (const table of tables) {
        const { data: tableInfo } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', table)
          .in('column_name', ['current_weight', 'expected_weight', 'weight', 'average_weight']);

        if (tableInfo) {
          results.dataTypes.push({
            table,
            columns: tableInfo
          });
        }
      }
    } else {
      results.dataTypes = columnsData;
    }

    // 6. Generate summary
    console.log('\n📋 DIAGNOSIS SUMMARY');
    console.log('===================');
    console.log(`🚨 Total Issues Found: ${results.summary.totalIssues}`);
    console.log(`🎯 Exact 0.33kg Matches: ${results.liveChickens.exactCorruptionMatches.length}`);
    console.log(`⚠️ Weight Inconsistencies: ${results.liveChickens.inconsistencyRecords.length}`);
    console.log(`📚 Weight History Issues: ${results.weightHistory.suspiciousRecords.length}`);
    console.log(`🍗 Dressed Chicken Issues: ${results.dressedChickens.suspiciousRecords.length}`);

    if (results.liveChickens.exactCorruptionMatches.length > 0) {
      console.log('\n🚨 CRITICAL CORRUPTION FOUND!');
      console.log('Affected batch IDs:', results.liveChickens.exactCorruptionMatches.map(r => r.batch_id));
    }

    return results;

  } catch (error) {
    console.error('❌ Diagnostic script failed:', error);
    throw error;
  }
}

/**
 * Creates a correction script for identified corruption issues
 */
export function generateCorrectionScript(diagnosisResults) {
  console.log('🔧 Generating correction script...');

  const corrections = [];

  // Generate corrections for exact corruption matches
  diagnosisResults.liveChickens.exactCorruptionMatches.forEach(record => {
    const correctedWeight = Math.round(record.potential_original * 100) / 100;

    corrections.push({
      type: 'UPDATE',
      table: 'live_chickens',
      id: record.id,
      updates: {
        current_weight: correctedWeight,
        updated_at: new Date().toISOString()
      },
      reason: `Correct 0.33kg -> ${correctedWeight}kg (division by 7.57 corruption)`
    });
  });

  // Generate corrections for weight history
  diagnosisResults.weightHistory.suspiciousRecords.forEach(record => {
    const correctedWeight = Math.round(record.potential_original * 100) / 100;

    corrections.push({
      type: 'UPDATE',
      table: 'weight_history',
      id: record.id,
      updates: {
        weight: correctedWeight,
        updated_at: new Date().toISOString()
      },
      reason: `Correct 0.33kg -> ${correctedWeight}kg (division by 7.57 corruption)`
    });
  });

  return corrections;
}

/**
 * Apply corrections to the database
 */
export async function applyCorrections(corrections) {
  console.log(`🔧 Applying ${corrections.length} corrections...`);

  for (const correction of corrections) {
    try {
      const { error } = await supabase
        .from(correction.table)
        .update(correction.updates)
        .eq('id', correction.id);

      if (error) {
        console.error(`❌ Failed to apply correction for ${correction.table} ${correction.id}:`, error);
      } else {
        console.log(`✅ Applied correction: ${correction.reason}`);
      }
    } catch (error) {
      console.error(`❌ Error applying correction for ${correction.table} ${correction.id}:`, error);
    }
  }

  console.log('🔧 Correction process completed');
}