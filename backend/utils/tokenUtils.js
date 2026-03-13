import crypto from 'crypto';

/**
 * Generate a secure verification token
 * @returns {string} 32-byte hex token
 */
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get expiry time for verification token (15 minutes from now)
 * @returns {Date} expiry timestamp
 */
export const getTokenExpiry = () => {
  const now = new Date();
  return new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
};

/**
 * Check if verification token is expired
 * @param {Date} expiryTime - token expiry time
 * @returns {boolean} true if expired
 */
export const isTokenExpired = (expiryTime) => {
  return new Date() > new Date(expiryTime);
};

export default { generateVerificationToken, getTokenExpiry, isTokenExpired };
