import express from 'express';
import { body  } from 'express-validator';
import bodyParser from 'body-parser';
// import Jwt  from "jsonwebtoken";
// import { Request, Response, NextFunction } from "express-serve-static-core";

const router = express.Router();

// middleWares
import authMiddleware from '../middleware/auth.js';
import { getVasAuthToken } from '@/middleware/psbAuth.js';

// Controllers
import { 
    getDataPlansCtrl,
    dataPlanTopupCtrl,
    airtimeTopupCtrl,
    getElectricBillersCtrl,
    getBillerFieldsCtrl,
    validateBillPaymentCtrl,
    initiateBillsPaymentCtrl
} from '../controllers/vasController.js';


router.use(bodyParser.json());


router.get(
    "/getDataPlans",
    [
        authMiddleware,
        getVasAuthToken
    ],
    getDataPlansCtrl
);

router.post(
    "/dataPlanTopup",
    [
        authMiddleware,
        getVasAuthToken
    ],
    dataPlanTopupCtrl
);

router.post(
    "/airtimeTopup",
    [
        authMiddleware,
        getVasAuthToken
    ],
    airtimeTopupCtrl
);

router.get(
    "/getElectricBillers",
    [
        authMiddleware,
        getVasAuthToken
    ],
    getElectricBillersCtrl
);

router.get(
    "/getBillerFields/:billerId",
    [
        authMiddleware,
        getVasAuthToken
    ],
    getBillerFieldsCtrl
);

router.post(
    "/validateBillPayment",
    [
        authMiddleware,
        getVasAuthToken
    ],
    validateBillPaymentCtrl
);

router.post(
    "/initiateBillsPayment",
    [
        authMiddleware,
        getVasAuthToken
    ],
    initiateBillsPaymentCtrl
);


export default router;