  
export interface transactionsInterface {
    _id?: string,
    user_id: string,
    userEmail: string,
    category: "VAS" | "WAAS",
    type: "credit" | "debit" | "airtime" | "data" | "electricity" | "Betting" | "TV" | "Exams" | "Internet",
  
    // data: vasBillsTransactionInterface | airtimeTransactionInterface | 
    //       dataTransactionInterface | creditTransactionInterface,
  
    data: {
        bills?: vasBillsTransactionInterface,
        topup?: topupTransactionInterface,
        credit?: debitTransactionInterface,
        debit?: debitTransactionInterface,
    },
  
    accountNo: string,
    amount: number,
    transactionReference: string,
    status: string,
  
    createdAt?: string;
    updatedAt?: string;
}
  
// export interface creditTransactionInterface {
export interface debitTransactionInterface {
    // accountNo: string,
    // totalAmount: number,
    // transactionId: string,
    transactionType: string,
  
    // this is for the result of the transaction
    reference: string,
    sessionId: string,
  
  
    customerAccount: {
        number: string,
        bank: string,
        bankName: string,
        name: string,
        senderaccountnumber: string,
        sendername: string
    },
  
    order: {
        amount: string,
        currency: string,
        description: string,
        country: string
    },
    narration: string,
    merchant: {
        isFee: false,
        merchantFeeAccount: string,
        merchantFeeAmount: string
    },
}
  
  
export interface topupTransactionInterface {
    phoneNumber: string,
    network: string,
    productId?: string,
  
    // this is for the result of the transaction
    dataPlan?: string,
    reference: string
}

// export interface dataTransactionInterface {
//     phoneNumber: string,
//     network: string,
//     productId: string,

//     // this is for the result of the transaction
//     dataPlan: string
//     reference: string
// }

// export interface airtimeTransactionInterface {
//     phoneNumber: string,
//     network: string,
//     // this is for the result of the transaction
//     reference: string
// }

export interface vasBillsTransactionInterface {
    customerId: string;
    otherField: string,
    billerName: string, 
    billerId: string,
    itemId?: string, 
    itemName?: string, 
  
    customerPhone: string, 
    customerName: string, 
    // address?: string,
    units?: string,
    token?: string,
    isToken: string,
    reference?: string
}


export interface transactionStatusInterface {
    transactionId: string,
    amount: string | number,
    transactionType: string,
    transactionDate: string,
    accountNo: string | number,
}


export interface wallet2otherBanksInterface {
    transaction: { 
        reference: string
    },
    order: {
        amount: string | number,
        currency: string,
        description: string,
        country: string,
    },
    customer: {
        account: {
            number: string | number,
            bank: string,
            name: string,
            senderaccountnumber: string | number,
            sendername: string,
        }
    },
    merchant: { 
        isFee: false, 
        merchantFeeAccount: string, 
        merchantFeeAmount: string 
    },
    transactionType: string,
    narration: string,
}

export interface debitTransactionResponseInterface {
    transaction: { 
        reference: string,
        sessionId: string,
    },
    order: {
        amount: string | number,
        currency: string,
        description: string,
        country: string,
    },
    customer: {
        account: {
            number: string | number,
            bank: string,
            name: string,
            senderaccountnumber: string | number,
            sendername: string,
        }
    },
    merchant: { 
        isFee: false, 
        merchantFeeAccount: string, 
        merchantFeeAmount: string 
    },
    // transactionType: string,
    narration: string,
}