// import nodemailer from 'nodemailer';
import axios from "axios";
import { transactionModel } from "@/models/transactions.model.js";
import { 
    debitTransactionInterface, debitTransactionResponseInterface, transactionsInterface, 
    transactionStatusInterface, wallet2otherBanksInterface 
} from "@/typeInterfaces/transactions.js";
import { psbWaasEndpoint } from "@/util/resources.js";
import { dateFormat } from "@/util/dateTime.js";


export async function getWaasTransactionStatus(transactionData: transactionStatusInterface, accessToken: string) {
    try {
        const statusResponse = (await axios.post(
            `${psbWaasEndpoint}/wallet_requery`, transactionData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;
        // console.log(statusResponse);

        if (statusResponse.status.toLowerCase().includes("success")) {
            return {
                state: true,
                status: statusResponse.data.status,
                description: statusResponse.data.responseMessage,
            }
        }

        return {
            state: false,
            status: '',
            description: '',
        }
    } catch (error) {
        return {
            state: false,
            status: '',
            description: '',
        }
    }
    
}

export const handleDebitTransactions = async (
    accessToken: string, data2send: wallet2otherBanksInterface,
    user_id: string, user_email: string, bankName: string
) => {
    try {
        // send out the transfer
        const response = (await axios.post(
            `${psbWaasEndpoint}/wallet_other_banks`, data2send,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;
        console.log(response);
    
        // checks if the transfer is not successful
        if (!response.status.toLowerCase().includes("success") || response.responseCode != "00" ) {
            return {
                status: false,
                statusCode: 400,
                result: {
                    ref: data2send.transaction.reference
                },
                // result: ,
                message: response.message
            };
        }
    
    
        const transactionStatusData: transactionStatusInterface = {
            transactionId: data2send.transaction.reference,
            amount: data2send.order.amount,
            transactionType: data2send.transactionType,
            transactionDate: dateFormat(),
            accountNo: data2send.customer.account.senderaccountnumber,
        };
        console.log(transactionStatusData);
        const statusResponse = await getWaasTransactionStatus(transactionStatusData, accessToken);
    
    
        let dbTransactionData: debitTransactionInterface = {
            // transactionId: '',
            transactionType: "debit",
            reference: response.data.transaction.reference,
            sessionId: response.data.transaction.sessionId,
            customerAccount: {
                number: response.data.customer.account.number,
                bank: response.data.customer.account.bank,
                bankName: bankName,
                name: response.data.customer.account.name,
                senderaccountnumber: response.data.customer.account.senderaccountnumber,
                sendername: response.data.customer.account.sendername
            },
            order: {
                amount: response.data.order.amount,
                currency: response.data.order.currency,
                description: response.data.order.description,
                country: response.data.order.country
            },
            narration: response.data.narration,
            merchant: {
                isFee: response.data.merchant.isFee,
                merchantFeeAccount: response.data.merchant.merchantFeeAccount,
                merchantFeeAmount: response.data.merchant.merchantFeeAmount
            }
        };
    
    
        const transactionDetails: transactionsInterface = {
            user_id: user_id,
            userEmail: user_email,
            category: "WAAS",
            type: "debit",
            data: {
                debit: dbTransactionData
            },
            accountNo: `${data2send.customer.account.senderaccountnumber}`,
            amount: Number(data2send.order.amount),
            transactionReference: data2send.transaction.reference,
            // reference: response.data && response.responseCode == "200" ? response.data.transactionReference : '',
            status: statusResponse.state ? statusResponse.status : response.status || "pending",
        };
        const newTransaction = new transactionModel(transactionDetails);
        const result = await newTransaction.save();
        
        if (!result._id) {
            return {
                status: false,
                statusCode: 202,
                result: {
                    ref: data2send.transaction.reference
                },
                message: 'unable to update the transactions record.',
            };
        };
    
    
        const debitTransactionRes:debitTransactionResponseInterface = response.data;
            
        return {
            status: true,
            statusCode: 201,
            result: {
                transactionResponse: debitTransactionRes,
                dbTransactionRecord: result,
                ref: data2send.transaction.reference
            },
            message: 'Successful'
        };
        
    } catch (error: any) {
        const err = error.response && error.response.data ? error.response.data : error;

        return {
            status: false,
            statusCode: 500,
            result: {
                ref: '',
                error: err
            },
            message: err.message || 'server error',
        };
    }

}


export const getCustomer2holdingAccDetail = (
    amount: string | number, description: string,
    customerAccountNo: string, 
    customerAccountName: string,

    service: string = 'give away',

    holdingAcctNumber: string = "1100033694",
    holdingAcctName: string = "MARK SPENCER",

) => {
    const transactionReference = `WAASTESAPAY${Date.now()}`; //WAASTESAPAY

    const data2send: wallet2otherBanksInterface = {
        transaction: {
            reference: transactionReference
        },
        order: {
            amount: amount,
            currency: "NGN",
            description: `${description}/WAAS/${service}`,
            country: "NG"
        },
        customer: {
            account: {
                number: holdingAcctNumber,
                bank: '120001',
                name: holdingAcctName,
                senderaccountnumber: customerAccountNo,
                sendername: customerAccountName
            }
        },
        merchant: {
            isFee: false,
            merchantFeeAccount: "",
            merchantFeeAmount: ""
        },
        transactionType: "OTHER_BANKS",
        narration: `${description}/${service}/${transactionReference}`
    };
    
    return data2send;
}

export const getHolding2customerAccDetail = (
    amount: string | number, description: string,
    customerAccountNo: string, 
    customerAccountName: string,

    service: string = 'give away',

    holdingAcctNumber: string = "1100033694",
    holdingAcctName: string = "MARK SPENCER",

) => {
    const transactionReference = `WAASTESAPAY${Date.now()}`; //WAASTESAPAY

    const data2send: wallet2otherBanksInterface = {
        transaction: {
            reference: transactionReference
        },
        order: {
            amount: amount,
            currency: "NGN",
            description: `${description}/WAAS/${service}`,
            country: "NG"
        },
        customer: {
            account: {
                number: customerAccountNo,
                bank: '120001',
                name: customerAccountName,
                senderaccountnumber: holdingAcctNumber,
                sendername: holdingAcctName,
            }
        },
        merchant: {
            isFee: false,
            merchantFeeAccount: "",
            merchantFeeAmount: ""
        },
        transactionType: "OTHER_BANKS",
        narration: `${description}/${service}/${transactionReference}`
    };
    
    return data2send;
}