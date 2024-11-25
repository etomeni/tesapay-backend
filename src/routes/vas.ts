import express from 'express';
import { body, query  } from 'express-validator';
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
    getBillersCtrl,
    getBillerFieldsCtrl,
    validateBillPaymentCtrl,
    initiateBillsPaymentCtrl,
    // getBetBillersCtrl,
    getUserReferralsCtrl
} from '../controllers/vasController.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';


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

// airtimeTopup
router.post(
    "/airtimeTopup",
    [
        authMiddleware,
        getVasAuthToken
    ],
    airtimeTopupCtrl
);

// getBettingBillers
router.get(
    "/getBillers",
    [
        authMiddleware,
        getVasAuthToken
    ],
    getBillersCtrl
);

// getBillerFields/:billerId
router.get(
    "/getBillerFields/:billerId",
    [
        authMiddleware,
        getVasAuthToken
    ],
    getBillerFieldsCtrl
);

// validateBillPayment
router.post(
    "/validateBillPayment",
    [
        authMiddleware,
        getVasAuthToken
    ],
    validateBillPaymentCtrl
);

// initiateBillsPayment
router.post(
    "/initiateBillsPayment",
    [
        authMiddleware,
        getVasAuthToken
    ],
    initiateBillsPaymentCtrl
);

// getReferrals
router.get(
    "/getReferrals",
    [
        query('page')
            .isNumeric().notEmpty()
            .withMessage('Page number is required.'),
            
        query('limit')
            .isNumeric().notEmpty()
            .withMessage('Limit is required.'),

        routeValidationResult,
        authMiddleware,
        // getVasAuthToken
    ],
    getUserReferralsCtrl
);


export default router;