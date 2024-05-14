export const termiSendSmsEndpoint = "https://api.ng.termii.com/api/sms/send";

export function maskPhoneNumber(phoneNumber: string) {
    // Remove any non-digit characters from the input
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
  
    // Check if the cleaned number has at least 4 digits
    if (cleanedNumber.length < 4) {
        return phoneNumber;
        // return 'Invalid phone number';
    }
  
    // Extract the last 4 digits
    const lastFourDigits = cleanedNumber.slice(-4);
  
    // Create a masked version with asterisks
    const maskedNumber = '*'.repeat(cleanedNumber.length - 4) + lastFourDigits;
  
    return maskedNumber;
}

export function maskEmailAddress(email: string) {
    // Split the email address into username and domain parts
    const [username, domain] = email.split('@');
  
    const lastThreeCharacters = username.slice(-3);
    const firstTwoCharacters = username.slice(0, 2);
  
  
    // Mask the username part
    const maskedUsername = firstTwoCharacters + '*'.repeat(username.length - 5) + lastThreeCharacters;
  
    // // Extract the last 3 characters before the @ symbol
    // const maskedDomain = domain.slice(0, domain.length - 3) + '*'.repeat(3);
  
    // Combine the masked parts to form the masked email
    const maskedEmail = `${maskedUsername}@${domain}`;
  
    return maskedEmail;
}