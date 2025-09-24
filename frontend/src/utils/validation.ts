export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

export const validateOECNumber = (oecNumber: string): boolean => {
  // OEC numbers typically follow a specific format
  const oecRegex = /^OEC-\d{4}-\d{3,6}$/;
  return oecRegex.test(oecNumber);
};

export const validateEReceiptNumber = (eReceiptNumber: string): boolean => {
  // E-Receipt numbers typically follow a specific format
  const eReceiptRegex = /^ER-\d{4}-\d{3,6}$/;
  return eReceiptRegex.test(eReceiptNumber);
};
