/**
 * Generates a short, readable order number from a UUID
 * Format: OPSL + last 6 characters of UUID (uppercase)
 * Example: OPSL-A3B2C1
 */
export function formatOrderId(orderId: string): string {
  if (!orderId) return 'N/A';
  
  // Extract last 6 characters of UUID (after removing dashes)
  const cleanId = orderId.replace(/-/g, '').toUpperCase();
  const shortId = cleanId.slice(-6);
  
  return `OPSL-${shortId}`;
}

/**
 * Generates a short order number with sequential format
 * Format: OPSL + padded number
 * Example: OPSL-0001, OPSL-0002
 * 
 * Note: This requires storing order_number in database for sequential numbering
 * For now, we'll use the UUID-based format above
 */
export function formatOrderIdSequential(orderNumber: number): string {
  if (!orderNumber) return 'N/A';
  return `OPSL-${String(orderNumber).padStart(4, '0')}`;
}

