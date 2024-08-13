export type signupInterface = {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  email: string;
  username: string;
  dob: string;
  country: string,
  phoneNumber: string;
  password: string;
  referredBy?: string;
  tnc: boolean;
  location: userLocationInterface;
};

export type userInterface = {
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  email: string;
  username: string;
  dob: string;
  country: string,
  phoneNumber: string;
  password: string;
  pin?: string;
  referredBy?: string;
  // referralCode: string;
  // account: userAccount[];
  // tnc: boolean;
  status: boolean;

  role?: string,
  location: userLocationInterface;
  isEmailVerified?: boolean;
  isPhoneNumberVerified?: boolean;
  NIN?: number;
  isNINverified?: boolean;
  BVN?: bvnInterface;
  isBVNverified?: boolean;
  address?: userAddress;
  isAddressVerified?: boolean;
  idImage?: string;
  isDeleted?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
};



export type accountInterface = {
  userId: string,
  userEmail: string,
  // transactionTrackingRef: "tesapay/waas/66a52e3ba0efbcdba1514ecf",
  lastName: string,
  otherNames: string,
  // accountName: "Kathryn Kuhlm",
  phoneNo: string,
  gender: number,
  dateOfBirth: string,
  email: string,
  bvn: string, 
  // customerID: "66a52e3ba0efbcdba1514ecf",
  walletType: string,
  
  accountNumber: string,
  customerID: string,
  accountName: string,
  accountRef: string,
  status: string, // "InActive" || "SUSPENDED"

  tier: string,
  
  ngn: {
    availableBalance: number,
    number: string,
    pndstatus: string,
    name: string,
    productCode: string,
    lienStatus: string,
    freezeStatus: string,
    ledgerBalance: number,
    maximumBalance: number,
    nuban: string,
    provider: string
  },

  otherCurrencies?: object,

  createdAt?: string;
  updatedAt?: string;
};

type bvnInterface = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;

  number: string,
  isBvnPhoneVerified: boolean
};

type userAddress = {
  ip: string;
  street: string;
  city: string;
  region: string;
  country: string;
};

export type userLocationInterface = {
  ip: string;
  lastUsedIps: string[];
  country: string;
  region: string;
  city: string;
  isp: string;
  lat: number;
  lon: number;
};

// export type userAccount = {
//   currency: string;
//   balance: number;
//   accountNumber?: number;
//   accountName?: string;
//   bank?: string;
//   default: boolean;
// };



export interface countryInterface {
  name: {
    common: string;
    official: string;
  };
  flags: {
    png: string;
    svg: string;
    alt: string;
  };
  idd: {
    root: string;
    suffixes: string[];
  };
}

export interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}


export enum conditionType {
  "!=" = "!=",
  "<" = "<",
  "<=" = "<=",
  "==" = "==",
  ">" = ">",
  ">=" = ">=",
  "array-contains" = "array-contains",
  "array-contains-any" = "array-contains-any",
  "in" = "in",
  "not-in" = "not-in",
}

export interface whereCondition {
  property: string;
  condition:
    | "!="
    | "<"
    | "<="
    | "=="
    | ">"
    | ">="
    | "array-contains"
    | "array-contains-any"
    | "in"
    | "not-in";
  value: string | number | boolean;
}
