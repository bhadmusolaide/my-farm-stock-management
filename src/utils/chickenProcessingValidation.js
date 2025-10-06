/**
 * Chicken Processing Validation and Business Logic Utilities
 * Handles validation and consistency checks for chicken processing data
 */

// Validate whole chicken count
export const validateWholeChickenCount = (count, context = 'general') => {
  const errors = []

  if (count === null || count === undefined || count === '') {
    if (context === 'required') {
      errors.push('Whole chicken count is required')
    }
  } else {
    const numCount = parseInt(count)
    if (isNaN(numCount)) {
      errors.push('Whole chicken count must be a valid number')
    } else if (numCount < 0) {
      errors.push('Whole chicken count cannot be negative')
    } else if (numCount > 10000) {
      errors.push('Whole chicken count seems unusually high (>10,000)')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate parts count consistency with whole chicken count
export const validatePartsConsistency = (wholeCount, partsCount, partsWeight, partTypes) => {
  const errors = []
  const warnings = []

  if (!wholeCount || wholeCount <= 0) {
    return { isValid: true, errors: [], warnings: [] } // Skip validation if no whole count
  }

  // Check each part type
  partTypes.forEach(partType => {
    const partName = partType.name.toLowerCase()
    const count = partsCount[partName] || 0
    const weight = partsWeight[partName] || 0

    // Check if count is reasonable relative to whole chicken count
    const expectedCount = Math.round(wholeCount * (partType.default_count_per_bird || 1))

    if (count > wholeCount * 3) {
      warnings.push(`${partType.name} count (${count}) seems high for ${wholeCount} whole chickens`)
    }

    if (count < 0) {
      errors.push(`${partType.name} count cannot be negative`)
    }

    // Check weight consistency
    if (weight < 0) {
      errors.push(`${partType.name} weight cannot be negative`)
    }

    if (weight > 0 && count === 0) {
      warnings.push(`${partType.name} has weight but no count specified`)
    }

    if (count > 0 && weight === 0) {
      warnings.push(`${partType.name} has count but no weight specified`)
    }

    // Check for reasonable weight per unit
    if (count > 0 && weight > 0) {
      const weightPerUnit = weight / count
      if (weightPerUnit > 5) {
        warnings.push(`${partType.name} weight per unit (${weightPerUnit.toFixed(2)}kg) seems unusually high`)
      }
      if (weightPerUnit < 0.001) {
        warnings.push(`${partType.name} weight per unit (${weightPerUnit.toFixed(4)}kg) seems unusually low`)
      }
    }
  })

  // Check total parts weight vs expected based on whole chicken count
  const totalPartsWeight = Object.values(partsWeight).reduce((sum, w) => sum + w, 0)
  const expectedTotalWeight = wholeCount * 1.8 // Rough estimate: ~1.8kg per chicken

  if (totalPartsWeight > expectedTotalWeight * 1.5) {
    warnings.push(`Total parts weight (${totalPartsWeight.toFixed(2)}kg) seems high for ${wholeCount} chickens`)
  }

  if (totalPartsWeight < expectedTotalWeight * 0.5) {
    warnings.push(`Total parts weight (${totalPartsWeight.toFixed(2)}kg) seems low for ${wholeCount} chickens`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Validate size category selection
export const validateSizeCategory = (sizeCategoryId, sizeCategoryCustom, chickenSizeCategories) => {
  const errors = []

  if (sizeCategoryId === 'custom' && !sizeCategoryCustom.trim()) {
    errors.push('Custom size name is required when custom size is selected')
  }

  if (sizeCategoryId && sizeCategoryId !== 'custom') {
    const exists = chickenSizeCategories.some(sc => sc.id === sizeCategoryId && sc.is_active)
    if (!exists) {
      errors.push('Selected size category is not available or inactive')
    }
  }

  if (sizeCategoryId && sizeCategoryId !== 'custom' && sizeCategoryCustom) {
    errors.push('Cannot specify both predefined size category and custom size name')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate processing configuration
export const validateProcessingConfig = (config) => {
  const errors = []

  if (!config.config_name || config.config_name.trim().length < 3) {
    errors.push('Configuration name must be at least 3 characters long')
  }

  if (config.config_type === 'seasonal') {
    if (!config.season_start_month || !config.season_end_month) {
      errors.push('Both start and end months are required for seasonal configuration')
    } else if (config.season_start_month === config.season_end_month) {
      errors.push('Season start and end months cannot be the same')
    }
  }

  if (config.config_type === 'breed_specific' && !config.breed) {
    errors.push('Breed must be specified for breed-specific configuration')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate weight standards
export const validatePartStandard = (standard, chickenSizeCategories, chickenPartTypes) => {
  const errors = []

  if (!standard.breed) {
    errors.push('Breed is required')
  }

  if (!standard.part_type_id) {
    errors.push('Part type is required')
  } else {
    const partTypeExists = chickenPartTypes.some(pt => pt.id === standard.part_type_id && pt.is_active)
    if (!partTypeExists) {
      errors.push('Selected part type is not available or inactive')
    }
  }

  if (standard.size_category_id) {
    const sizeCategoryExists = chickenSizeCategories.some(sc => sc.id === standard.size_category_id && sc.is_active)
    if (!sizeCategoryExists) {
      errors.push('Selected size category is not available or inactive')
    }
  }

  if (!standard.standard_weight_kg || standard.standard_weight_kg <= 0) {
    errors.push('Standard weight must be greater than 0')
  }

  if (standard.standard_weight_kg > 10) {
    errors.push('Standard weight seems unusually high (>10kg)')
  }

  if (standard.weight_variance_percent !== undefined) {
    if (standard.weight_variance_percent < 0 || standard.weight_variance_percent > 100) {
      errors.push('Weight variance must be between 0% and 100%')
    }
  }

  if (standard.sample_size !== undefined && standard.sample_size < 1) {
    errors.push('Sample size must be at least 1')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Calculate expected total weight from parts
export const calculateExpectedTotalWeight = (partsCount, partsWeight) => {
  return Object.values(partsWeight).reduce((sum, weight) => sum + weight, 0)
}

// Calculate average weight per chicken
export const calculateAverageWeightPerChicken = (totalPartsWeight, wholeCount) => {
  if (wholeCount <= 0) return 0
  return totalPartsWeight / wholeCount
}

// Validate that dressed chicken data is consistent
export const validateDressedChickenData = (data, chickenSizeCategories, chickenPartTypes) => {
  const allErrors = []
  const allWarnings = []

  // Validate whole chicken count
  const countValidation = validateWholeChickenCount(data.current_count, 'required')
  allErrors.push(...countValidation.errors)

  // Validate size category if specified
  if (data.size_category_id || data.size_category_custom) {
    const sizeValidation = validateSizeCategory(
      data.size_category_id,
      data.size_category_custom,
      chickenSizeCategories
    )
    allErrors.push(...sizeValidation.errors)
  }

  // Validate parts consistency if parts data exists
  if (data.parts_count && data.parts_weight && chickenPartTypes.length > 0) {
    const partsValidation = validatePartsConsistency(
      data.current_count,
      data.parts_count,
      data.parts_weight,
      chickenPartTypes
    )
    allErrors.push(...partsValidation.errors)
    allWarnings.push(...partsValidation.warnings)
  }

  // Validate average weight makes sense
  if (data.average_weight && data.current_count) {
    const totalExpectedWeight = data.current_count * data.average_weight
    const totalPartsWeight = calculateExpectedTotalWeight(data.parts_count, data.parts_weight)

    if (totalPartsWeight > 0) {
      const variance = Math.abs(totalExpectedWeight - totalPartsWeight) / totalExpectedWeight
      if (variance > 0.5) { // 50% variance
        allWarnings.push(`Large variance (${(variance * 100).toFixed(1)}%) between expected total weight and parts weight`)
      }
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
}

// Get validation summary for display
export const getValidationSummary = (validation) => {
  return {
    isValid: validation.isValid,
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
    summary: validation.isValid
      ? 'All validations passed'
      : `${validation.errors.length} error(s), ${validation.warnings.length} warning(s)`
  }
}

// Business logic: Auto-suggest size category based on weight
export const suggestSizeCategory = (weight, chickenSizeCategories) => {
  if (!weight || !chickenSizeCategories.length) return null

  return chickenSizeCategories.find(sc =>
    weight >= sc.min_weight && weight <= sc.max_weight && sc.is_active
  ) || null
}

// Business logic: Calculate optimal part counts based on whole chicken count and part standards
export const calculateOptimalPartCounts = (wholeCount, breed, sizeCategoryId, chickenPartStandards, chickenPartTypes) => {
  const partCounts = {}

  chickenPartTypes.forEach(partType => {
    const standard = chickenPartStandards.find(ps =>
      ps.breed === breed &&
      ps.size_category_id === sizeCategoryId &&
      ps.part_type_id === partType.id &&
      ps.is_active
    )

    if (standard) {
      partCounts[partType.name.toLowerCase()] = Math.round(wholeCount * (partType.default_count_per_bird || 1))
    } else {
      // Default calculation
      partCounts[partType.name.toLowerCase()] = Math.round(wholeCount * (partType.default_count_per_bird || 1))
    }
  })

  return partCounts
}

// Business logic: Calculate expected part weights based on standards
export const calculateExpectedPartWeights = (partCounts, breed, sizeCategoryId, chickenPartStandards, chickenPartTypes) => {
  const partWeights = {}

  chickenPartTypes.forEach(partType => {
    const partName = partType.name.toLowerCase()
    const count = partCounts[partName] || 0

    if (count > 0) {
      const standard = chickenPartStandards.find(ps =>
        ps.breed === breed &&
        ps.size_category_id === sizeCategoryId &&
        ps.part_type_id === partType.id &&
        ps.is_active
      )

      if (standard) {
        const weightPerUnit = standard.standard_weight_kg * (partType.default_count_per_bird || 1)
        partWeights[partName] = parseFloat((weightPerUnit * (count / (partType.default_count_per_bird || 1))).toFixed(3))
      } else {
        // Default weight calculation
        switch (partName) {
          case 'neck':
            partWeights.neck = parseFloat((count * 0.15).toFixed(3))
            break
          case 'feet':
            partWeights.feet = parseFloat((count * 0.1).toFixed(3))
            break
          case 'gizzard':
            partWeights.gizzard = parseFloat((count * 0.05).toFixed(3))
            break
          case 'liver':
            partWeights.liver = parseFloat((count * 0.04).toFixed(3))
            break
          case 'dog_food':
            partWeights.dog_food = parseFloat((count * 0.3).toFixed(3))
            break
          default:
            partWeights[partName] = 0
        }
      }
    } else {
      partWeights[partName] = 0
    }
  })

  return partWeights
}

// Export default validation utility
export default {
  validateWholeChickenCount,
  validatePartsConsistency,
  validateSizeCategory,
  validateProcessingConfig,
  validatePartStandard,
  validateDressedChickenData,
  getValidationSummary,
  suggestSizeCategory,
  calculateOptimalPartCounts,
  calculateExpectedPartWeights,
  calculateExpectedTotalWeight,
  calculateAverageWeightPerChicken
}