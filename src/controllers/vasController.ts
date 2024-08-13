import fs from "fs";
import { Request, Response, NextFunction } from "express-serve-static-core";
import bcryptjs from "bcryptjs";
import { validationResult } from "express-validator";
import { v4 as uuidv4 } from 'uuid';
import Jwt from "jsonwebtoken";
// import axios from "axios";
import nodemailer from 'nodemailer';

// import path from "path";

// models
import { userModel } from '../models/users.model.js';
import { getSampleNetworkNumber, psbVasEndpoint } from "@/util/resources.js";
import axios from "axios";


// const secretForToken = process.env.JWT_SECRET;


export const getDataPlansCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const network = req.query.network;

        if (!network) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'Network name is required.',
            });
        }

        const phoneNumber = getSampleNetworkNumber(network.toString().toUpperCase());

        const accessToken = req.body.psbVas.vasAccessToken;

        const response = (await axios.get(
            `${psbVasEndpoint}/topup/dataPlans?phone=${phoneNumber}`, 
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        console.log(response); 

        if (response.data.length && response.responseCode == "200" ) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: response.data,
                message: response.message || 'Successfull'
            });
        }

        return res.status(400).json({
            status: false,
            statusCode: 400,
            message: response.message || 'Error getting data plans.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const dataPlanTopupCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const network = req.query.network;
        const phoneNumber = req.body.phoneNumber;
        const amount = req.body.amount;
        const debitAccount = req.body.debitAccount;
        const network = req.body.network;
        const productId = req.body.productId;
        const transactionReference = req.body.transactionReference;

        const email = req.body.middlewareParam.email;
        const userId = req.body.middlewareParam.userId;
        const username = req.body.middlewareParam.username;

        if (!phoneNumber || !amount || !debitAccount || !network || !productId || !transactionReference) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'All params are required.',
            });
        }

        const accessToken = req.body.psbVas.vasAccessToken;

        const response = (await axios.post(
            `${psbVasEndpoint}/topup/data`, 
            {
                phoneNumber, amount, debitAccount,
                network, productId, transactionReference,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        console.log(response); 

        if (response.data && response.responseCode == "200" ) {
            // TODO::::
            // save transcaction the data to the database


            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: response.data,
                message: response.message || 'Successfull'
            });
        }

        return res.status(400).json({
            status: false,
            statusCode: 400,
            message: response.message || 'Error purchasing data plans.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

export const airtimeTopupCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const phoneNumber = req.body.phoneNumber;
        const network = req.body.network;
        const amount = req.body.amount;
        const debitAccount = req.body.debitAccount;

        const transactionReference = `VASTESAPAY${Date.now()}`;

        const _id = req.body.middlewareParam._id;
        const email = req.body.middlewareParam.email;
        const userId = req.body.middlewareParam.userId;

        if (!phoneNumber || !amount || !debitAccount || !network) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'All params are required.',
            });
        }

        const accessToken = req.body.psbVas.vasAccessToken;

        const response = (await axios.post(
            `${psbVasEndpoint}/topup/airtime`, 
            {
                phoneNumber, amount, debitAccount,
                network, transactionReference,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )).data;

        console.log(response); 

        if (response.data && response.responseCode == "200" ) {
            // TODO::::
            // save transcaction the data to the database


            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: response.data,
                message: response.message || 'Successfull'
            });
        }

        return res.status(400).json({
            status: false,
            statusCode: 400,
            message: response.message || 'Error purchasing airtime.',
        });
        
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}
