/**
 * Payment Calculator for Scoopify Club
 * Calculates scooper payments based on referral model:
 * 1. Customer pays monthly → Stripe fees deducted
 * 2. Referral fee deducted → sent to referrer (customer or business)
 * 3. Platform keeps 25% → stays in account
 * 4. Remaining 75% divided by 4 services → scooper payment per service
 */

// Stripe fee calculation (2.9% + $0.30)
const STRIPE_FEE_PERCENTAGE = 0.029;
const STRIPE_FEE_FIXED = 0.30;

// Referral fees per active referral
const CUSTOMER_REFERRAL_FEE = 5.00; // $5/month for customer referrals
const BUSINESS_REFERRAL_FEE = 5.00; // $5/month for business referrals (same as customers)

// Platform cut percentage
const PLATFORM_CUT_PERCENTAGE = 0.25;

/**
 * Calculate scooper payment for monthly subscription services
 * @param {number} monthlyPrice - Monthly subscription price
 * @param {string} referralType - Type of referral: 'CUSTOMER', 'BUSINESS', or null
 * @returns {Object} Payment breakdown
 */
export function calculateMonthlyServicePayment(monthlyPrice, referralType = null) {
  // Step 1: Money comes in, Stripe fees deducted
  const stripeFees = (monthlyPrice * STRIPE_FEE_PERCENTAGE) + STRIPE_FEE_FIXED;
  const netAfterStripe = monthlyPrice - stripeFees;
  
  // Step 2: Referral fee deducted (if applicable)
  let referralFee = 0;
  if (referralType === 'CUSTOMER') {
    referralFee = CUSTOMER_REFERRAL_FEE;
  } else if (referralType === 'BUSINESS') {
    referralFee = BUSINESS_REFERRAL_FEE;
  }
  
  const afterReferral = netAfterStripe - referralFee;
  
  // Step 3: Platform keeps 25%
  const platformCut = afterReferral * PLATFORM_CUT_PERCENTAGE;
  const forScoopers = afterReferral - platformCut;
  
  // Step 4: Divide remaining 75% by 4 services
  const scooperPaymentPerService = forScoopers / 4;
  
  return {
    monthlyPrice,
    stripeFees: parseFloat(stripeFees.toFixed(2)),
    netAfterStripe: parseFloat(netAfterStripe.toFixed(2)),
    referralType,
    referralFee: parseFloat(referralFee.toFixed(2)),
    afterReferral: parseFloat(afterReferral.toFixed(2)),
    platformCut: parseFloat(platformCut.toFixed(2)),
    forScoopers: parseFloat(forScoopers.toFixed(2)),
    scooperPaymentPerService: parseFloat(scooperPaymentPerService.toFixed(2)),
    totalScooperPayout: parseFloat((scooperPaymentPerService * 4).toFixed(2))
  };
}

/**
 * Calculate scooper payment for one-time services
 * @param {number} servicePrice - One-time service price
 * @param {string} referralType - Type of referral: 'CUSTOMER', 'BUSINESS', or null
 * @returns {Object} Payment breakdown
 */
export function calculateOneTimeServicePayment(servicePrice, referralType = null) {
  // For one-time services, referral fee is deducted from the single service
  const stripeFees = (servicePrice * STRIPE_FEE_PERCENTAGE) + STRIPE_FEE_FIXED;
  const netAfterStripe = servicePrice - stripeFees;
  
  // Referral fee deducted
  let referralFee = 0;
  if (referralType === 'CUSTOMER') {
    referralFee = CUSTOMER_REFERRAL_FEE;
  } else if (referralType === 'BUSINESS') {
    referralFee = BUSINESS_REFERRAL_FEE;
  }
  
  const afterReferral = netAfterStripe - referralFee;
  
  // Platform keeps 25%
  const platformCut = afterReferral * PLATFORM_CUT_PERCENTAGE;
  const scooperPayment = afterReferral - platformCut;
  
  return {
    servicePrice,
    stripeFees: parseFloat(stripeFees.toFixed(2)),
    netAfterStripe: parseFloat(netAfterStripe.toFixed(2)),
    referralType,
    referralFee: parseFloat(referralFee.toFixed(2)),
    afterReferral: parseFloat(afterReferral.toFixed(2)),
    platformCut: parseFloat(platformCut.toFixed(2)),
    scooperPayment: parseFloat(scooperPayment.toFixed(2))
  };
}

/**
 * Get payment breakdown for all service plans
 * @returns {Object} All service plan payment calculations
 */
export function getAllServicePlanPayments() {
  return {
    monthly: {
      '1 Dog ($55/month)': calculateMonthlyServicePayment(55.00, null),
      '1 Dog with Customer Referral ($55/month)': calculateMonthlyServicePayment(55.00, 'CUSTOMER'),
      '1 Dog with Business Referral ($55/month)': calculateMonthlyServicePayment(55.00, 'BUSINESS'),
      '2 Dogs ($70/month)': calculateMonthlyServicePayment(70.00, null),
      '2 Dogs with Customer Referral ($70/month)': calculateMonthlyServicePayment(70.00, 'CUSTOMER'),
      '2 Dogs with Business Referral ($70/month)': calculateMonthlyServicePayment(70.00, 'BUSINESS'),
      '3+ Dogs ($100/month)': calculateMonthlyServicePayment(100.00, null),
      '3+ Dogs with Customer Referral ($100/month)': calculateMonthlyServicePayment(100.00, 'CUSTOMER'),
      '3+ Dogs with Business Referral ($100/month)': calculateMonthlyServicePayment(100.00, 'BUSINESS')
    },
    oneTime: {
      '1 Dog ($50)': calculateOneTimeServicePayment(50.00, null),
      '1 Dog with Customer Referral ($50)': calculateOneTimeServicePayment(50.00, 'CUSTOMER'),
      '1 Dog with Business Referral ($50)': calculateOneTimeServicePayment(50.00, 'BUSINESS'),
      '2 Dogs ($50)': calculateOneTimeServicePayment(50.00, null),
      '2 Dogs with Customer Referral ($50)': calculateOneTimeServicePayment(50.00, 'CUSTOMER'),
      '2 Dogs with Business Referral ($50)': calculateOneTimeServicePayment(50.00, 'BUSINESS'),
      '3+ Dogs ($75)': calculateOneTimeServicePayment(75.00, null),
      '3+ Dogs with Customer Referral ($75)': calculateOneTimeServicePayment(75.00, 'CUSTOMER'),
      '3+ Dogs with Business Referral ($75)': calculateOneTimeServicePayment(75.00, 'BUSINESS'),
      'Initial Cleanup ($32)': calculateOneTimeServicePayment(32.00, null),
      'Initial Cleanup with Customer Referral ($32)': calculateOneTimeServicePayment(32.00, 'CUSTOMER'),
      'Initial Cleanup with Business Referral ($32)': calculateOneTimeServicePayment(32.00, 'BUSINESS')
    }
  };
}

/**
 * Calculate referral earnings for customers
 * @param {number} monthlyPrice - Monthly subscription price
 * @returns {number} Monthly referral earnings
 */
export function calculateCustomerReferralEarnings(monthlyPrice) {
  // Customer referrers get $5 minus their share of Stripe fees
  const referralStripeFees = (CUSTOMER_REFERRAL_FEE * STRIPE_FEE_PERCENTAGE) + STRIPE_FEE_FIXED;
  const referralEarnings = CUSTOMER_REFERRAL_FEE - referralStripeFees;
  
  return parseFloat(referralEarnings.toFixed(2));
}

/**
 * Calculate referral earnings for business partners
 * @param {number} monthlyPrice - Monthly subscription price
 * @returns {number} Monthly referral earnings
 */
export function calculateBusinessReferralEarnings(monthlyPrice) {
  // Business partners get $5 minus their share of Stripe fees
  const referralStripeFees = (BUSINESS_REFERRAL_FEE * STRIPE_FEE_PERCENTAGE) + STRIPE_FEE_FIXED;
  const referralEarnings = BUSINESS_REFERRAL_FEE - referralStripeFees;
  
  return parseFloat(referralEarnings.toFixed(2));
}

/**
 * Calculate referral earnings based on referral type
 * @param {number} monthlyPrice - Monthly subscription price
 * @param {string} referralType - Type of referral: 'CUSTOMER' or 'BUSINESS'
 * @returns {number} Monthly referral earnings
 */
export function calculateReferralEarnings(monthlyPrice, referralType = 'CUSTOMER') {
  if (referralType === 'BUSINESS') {
    return calculateBusinessReferralEarnings(monthlyPrice);
  }
  return calculateCustomerReferralEarnings(monthlyPrice);
}
