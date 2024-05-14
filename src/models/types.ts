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
  pin?: number;
  referredBy?: string;
  // referralCode: string;
  account: userAccount[];
  // tnc: boolean;
  status: boolean;

  role?: string,
  location: userLocationInterface;
  isEmailVerified?: boolean;
  isPhoneNumberVerified?: boolean;
  NIN?: number;
  isNINverified?: boolean;
  BVN?: number;
  isBVNverified?: boolean;
  address?: userAddress;
  isAddressVerified?: boolean;
  idImage?: string;
  isDeleted?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
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

export type userAccount = {
  currency: string;
  balance: number;
  accountNumber?: number;
  accountName?: string;
  bank?: string;
  default: boolean;
};



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
