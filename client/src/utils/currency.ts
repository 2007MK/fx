/**
 * Format a number as currency
 * @param value The number to format
 * @param currencyCode The currency code (e.g., USD, EUR)
 * @param showCurrencySymbol Whether to show the currency symbol or not
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string, 
  currencyCode: string = 'USD', 
  showCurrencySymbol: boolean = true
): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return showCurrencySymbol ? '$0.00' : '0.00';
  }
  
  // For most currencies, we'll use 2 decimal places
  let fractionDigits = 2;
  
  // Some currencies like JPY typically don't use decimal places
  if (currencyCode === 'JPY') {
    fractionDigits = 0;
  }
  
  try {
    if (showCurrencySymbol) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
      }).format(numericValue);
    } else {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
      }).format(numericValue);
    }
  } catch (e) {
    // Fall back to a simpler format if the currency code is invalid
    return showCurrencySymbol 
      ? `$${numericValue.toFixed(fractionDigits)}` 
      : numericValue.toFixed(fractionDigits);
  }
}

/**
 * Format a percentage
 * @param value The percentage value (e.g., 5 for 5%)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '' : '-'}${Math.abs(value).toFixed(2)}%`;
}

/**
 * Calculate the average buying price when adding more inventory
 * @param currentAmount Current amount in inventory
 * @param currentAvgPrice Current average buying price
 * @param newAmount New amount being added
 * @param newPrice Price of the new amount
 * @returns New average buying price
 */
export function calculateAverageBuyPrice(
  currentAmount: number,
  currentAvgPrice: number,
  newAmount: number,
  newPrice: number
): number {
  const currentTotalValue = currentAmount * currentAvgPrice;
  const newTotalValue = newAmount * newPrice;
  const totalAmount = currentAmount + newAmount;
  
  if (totalAmount === 0) return 0;
  
  return (currentTotalValue + newTotalValue) / totalAmount;
}

/**
 * Calculate profit from a sell transaction
 * @param amount Amount being sold
 * @param sellPrice Selling price
 * @param avgBuyPrice Average buying price
 * @returns Profit amount (negative for loss)
 */
export function calculateProfit(
  amount: number,
  sellPrice: number,
  avgBuyPrice: number
): number {
  return amount * (sellPrice - avgBuyPrice);
}
