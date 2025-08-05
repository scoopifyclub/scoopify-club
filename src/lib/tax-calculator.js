// Tax Calculator for Scoopify Club - Peyton, Colorado
// Based on Colorado state and local tax requirements

class TaxCalculator {
  constructor() {
    // Colorado State Sales Tax Rate (2024)
    this.stateTaxRate = 0.029; // 2.9%
    
    // El Paso County Sales Tax Rate (includes Peyton)
    this.countyTaxRate = 0.01; // 1.0%
    
    // Special District Tax Rates (if applicable)
    this.specialDistrictRates = {
      // Add any special district taxes that apply to Peyton
      // These would be specific to your service area
    };
    
    // Service-specific tax exemptions
    this.taxExemptions = {
      // Some services may be exempt from certain taxes
      // Check with Colorado Department of Revenue for specifics
    };
    
    // Minimum taxable amount
    this.minimumTaxableAmount = 0.50; // $0.50 minimum
  }

  /**
   * Calculate taxes for a service amount
   * @param {number} subtotal - Service amount before taxes
   * @param {string} serviceType - Type of service (e.g., 'weekly', 'one-time')
   * @param {string} customerType - Type of customer (e.g., 'residential', 'commercial')
   * @returns {Object} Tax breakdown
   */
  calculateTaxes(subtotal, serviceType = 'weekly', customerType = 'residential') {
    if (subtotal <= 0) {
      return {
        subtotal: 0,
        stateTax: 0,
        countyTax: 0,
        specialDistrictTax: 0,
        totalTax: 0,
        total: 0,
        breakdown: []
      };
    }

    // Calculate individual tax components
    const stateTax = this.calculateStateTax(subtotal, serviceType, customerType);
    const countyTax = this.calculateCountyTax(subtotal, serviceType, customerType);
    const specialDistrictTax = this.calculateSpecialDistrictTax(subtotal, serviceType, customerType);
    
    const totalTax = stateTax + countyTax + specialDistrictTax;
    const total = subtotal + totalTax;

    // Create detailed breakdown
    const breakdown = [
      {
        name: 'Subtotal',
        amount: subtotal,
        rate: 0,
        description: 'Service amount before taxes'
      },
      {
        name: 'Colorado State Tax',
        amount: stateTax,
        rate: this.stateTaxRate,
        description: 'Colorado state sales tax (2.9%)'
      },
      {
        name: 'El Paso County Tax',
        amount: countyTax,
        rate: this.countyTaxRate,
        description: 'El Paso County sales tax (1.0%)'
      }
    ];

    // Add special district taxes if applicable
    if (specialDistrictTax > 0) {
      breakdown.push({
        name: 'Special District Tax',
        amount: specialDistrictTax,
        rate: this.getSpecialDistrictRate(serviceType),
        description: 'Local special district tax'
      });
    }

    breakdown.push({
      name: 'Total Tax',
      amount: totalTax,
      rate: totalTax / subtotal,
      description: 'Total tax amount'
    });

    breakdown.push({
      name: 'Total',
      amount: total,
      rate: 0,
      description: 'Final amount including taxes'
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      stateTax: Math.round(stateTax * 100) / 100,
      countyTax: Math.round(countyTax * 100) / 100,
      specialDistrictTax: Math.round(specialDistrictTax * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      total: Math.round(total * 100) / 100,
      breakdown: breakdown,
      taxRate: totalTax / subtotal,
      location: 'Peyton, Colorado',
      effectiveDate: new Date().toISOString()
    };
  }

  /**
   * Calculate Colorado state sales tax
   */
  calculateStateTax(subtotal, serviceType, customerType) {
    // Check if service is exempt from state tax
    if (this.isStateTaxExempt(serviceType, customerType)) {
      return 0;
    }

    return subtotal * this.stateTaxRate;
  }

  /**
   * Calculate El Paso County sales tax
   */
  calculateCountyTax(subtotal, serviceType, customerType) {
    // Check if service is exempt from county tax
    if (this.isCountyTaxExempt(serviceType, customerType)) {
      return 0;
    }

    return subtotal * this.countyTaxRate;
  }

  /**
   * Calculate special district taxes
   */
  calculateSpecialDistrictTax(subtotal, serviceType, customerType) {
    const rate = this.getSpecialDistrictRate(serviceType);
    return subtotal * rate;
  }

  /**
   * Get special district tax rate for service type
   */
  getSpecialDistrictRate(serviceType) {
    // Add logic for special district taxes if applicable
    // This would depend on specific districts in your service area
    return 0;
  }

  /**
   * Check if service is exempt from state tax
   */
  isStateTaxExempt(serviceType, customerType) {
    // Some services may be exempt from state tax
    // Check Colorado Department of Revenue guidelines
    return false;
  }

  /**
   * Check if service is exempt from county tax
   */
  isCountyTaxExempt(serviceType, customerType) {
    // Some services may be exempt from county tax
    // Check El Paso County guidelines
    return false;
  }

  /**
   * Validate tax calculation
   */
  validateTaxCalculation(taxResult) {
    const { subtotal, totalTax, total } = taxResult;
    
    // Check if total matches subtotal + tax
    const calculatedTotal = subtotal + totalTax;
    const difference = Math.abs(total - calculatedTotal);
    
    if (difference > 0.01) {
      throw new Error(`Tax calculation validation failed. Expected: ${calculatedTotal}, Got: ${total}`);
    }
    
    return true;
  }

  /**
   * Get tax summary for display
   */
  getTaxSummary(taxResult) {
    const { subtotal, totalTax, total, taxRate } = taxResult;
    const taxPercentage = (taxRate * 100).toFixed(1);
    
    return {
      subtotal: `$${subtotal.toFixed(2)}`,
      taxAmount: `$${totalTax.toFixed(2)}`,
      taxRate: `${taxPercentage}%`,
      total: `$${total.toFixed(2)}`,
      location: 'Peyton, Colorado'
    };
  }

  /**
   * Get tax rates for display
   */
  getTaxRates() {
    return {
      state: {
        name: 'Colorado State Tax',
        rate: this.stateTaxRate,
        percentage: `${(this.stateTaxRate * 100).toFixed(1)}%`
      },
      county: {
        name: 'El Paso County Tax',
        rate: this.countyTaxRate,
        percentage: `${(this.countyTaxRate * 100).toFixed(1)}%`
      },
      total: {
        name: 'Total Tax Rate',
        rate: this.stateTaxRate + this.countyTaxRate,
        percentage: `${((this.stateTaxRate + this.countyTaxRate) * 100).toFixed(1)}%`
      }
    };
  }

  /**
   * Calculate taxes for multiple services
   */
  calculateTaxesForServices(services) {
    const results = services.map(service => ({
      ...service,
      taxes: this.calculateTaxes(service.amount, service.type, service.customerType)
    }));

    const totalSubtotal = results.reduce((sum, service) => sum + service.amount, 0);
    const totalTax = results.reduce((sum, service) => sum + service.taxes.totalTax, 0);
    const total = totalSubtotal + totalTax;

    return {
      services: results,
      summary: {
        subtotal: totalSubtotal,
        totalTax: totalTax,
        total: total
      }
    };
  }
}

// Create singleton instance
const taxCalculator = new TaxCalculator();

// Export functions
export const calculateTaxes = (subtotal, serviceType, customerType) => 
  taxCalculator.calculateTaxes(subtotal, serviceType, customerType);

export const getTaxRates = () => taxCalculator.getTaxRates();

export const getTaxSummary = (taxResult) => taxCalculator.getTaxSummary(taxResult);

export const calculateTaxesForServices = (services) => 
  taxCalculator.calculateTaxesForServices(services);

export const validateTaxCalculation = (taxResult) => 
  taxCalculator.validateTaxCalculation(taxResult);

export default taxCalculator; 