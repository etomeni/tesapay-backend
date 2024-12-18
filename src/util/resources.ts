export const termiSendSmsEndpoint = "https://api.ng.termii.com/api/sms/send";
export const premblyIdentityEndpoint = " https://api.prembly.com";


export const psbEndpoint = " http://102.216.128.75:9090";
export const psbVasEndpoint = " http://102.216.128.75:9090/vas/api/v1";
export const psbWaasEndpoint = " http://102.216.128.75:9090/waas/api/v1";


export function getSampleNetworkNumber(network: string) {
    if (network == 'MTN') return '08031000300';

    if (network == 'AIRTEL') return '08021500300';

    if (network == '9MOBILE') return '08090000300';

    if (network == 'GLO') return '08055575910';
    return ''
}

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


export function isNumeric(str: string) {
    // Use regular expression to check if the string contains only digits
    const regex = /^\d+$/;
    return regex.test(str);
    // This test will return false if it contains a decimal point
}

export function normalizePhoneNumber(phoneString: string) {
    // Step 1: Remove all non-numeric characters
    let cleaned = phoneString.replace(/\D/g, '');
  
    // Step 2: Handle cases where the number starts with '234' or '2340'
    if (cleaned.startsWith('2340')) {
        cleaned = cleaned.replace('2340', '0');
    } else if (cleaned.startsWith('234')) {
        cleaned = cleaned.replace('234', '0');
    }
  
    // Step 3: Ensure the number starts with '0'
    if (!cleaned.startsWith('0')) {
        cleaned = '0' + cleaned;
    }
  
    // Step 4: Ensure the result is 11 digits
    return cleaned.length === 11 ? cleaned : cleaned.slice(0, 11);
}
