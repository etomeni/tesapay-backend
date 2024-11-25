export interface settingsInterface {
    savings: settingSavingsInterface,
    isAppDisabled: boolean
}

interface settingSavingsInterface {
    interestRate: number,
    minDuration: number,
    maxDuration: number,
    status: boolean,
}
