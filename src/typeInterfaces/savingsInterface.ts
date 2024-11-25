export interface newSavingsDataPreviewInterface {
    name: string;
    amount: number;
    duration: number;
    paybackDate: string;
    interestRate: number;
    interestGain: number;
    totalPayback: number;
}


export interface savingsInterface {
    _id?: string,
    user_id: string,
    userEmail: string,

    name: string;
    amount: number;
    duration: number;
    paybackDate: string;
    interestRate: number;
    interestGain: number;
    totalPayback: number;

    transactionReference: string,

    transaction_id: string,

    status: string, // "Completed" | "Active" | "Liquidated" | "Processing"
    closedDate?: string,
  
    createdAt?: string;
    updatedAt?: string;

}
