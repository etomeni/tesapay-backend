// export interface VoucherInterface extends Document {
export interface VoucherInterface {
    voucherCode: string;
    amount: number;
    totalAmount: number;
    numberOfUse: number; // maxRedemptions
    remainingUses: number;
    redeemedCount: number;
    message: string;

    isEnded: boolean;
    ended?: {
        refundFee: number;
        remainingAmount: number;
        refundedAmount: number;
        transaction_id: string;
        transactionReference: string;
        endedAt: Date
    }
  
    createdBy: {
        user: VoucherUserInterface,
        transaction_id: string;
        transactionReference: string;
    };
    redeemedBy: {
        user: VoucherUserInterface,
        transaction_id: string;
        transactionReference: string;
        redeemedAt: Date
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}
  
interface VoucherUserInterface {
    _id: string;
    userId: string;
    username: string;
    email: string;
    lastName: string;
    otherNames: string;
  
    gender: string;
    bvn: string;
    accountNumber: string;
    account_id: string;
}