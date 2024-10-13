import express from 'express';
import { body  } from 'express-validator';
import bodyParser from 'body-parser';
// import Jwt  from "jsonwebtoken";
// import { Request, Response, NextFunction } from "express-serve-static-core";

// middleWares
import authMiddleware from '../middleware/auth.js';
import { getWaasAuthToken } from '@/middleware/psbAuth.js';

// Controllers
import { 
    openWalletCtrl,
    getWalletDetailsCtrl,
    getTranactionsCtrl,
    getBanksCtrl,
    banksEnquiryCtrl,
    ngnTransfer2OtherBanksCtrl,
    searchUserAccountCtrl
} from '../controllers/waasController.js';

const router = express.Router();

router.use(bodyParser.json());


router.post(
    "/openWallet",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    openWalletCtrl
);

router.get(
    "/getWalletDetails",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    getWalletDetailsCtrl
);

router.get(
    "/getTranactionHistory",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    getTranactionsCtrl
);

router.get(
    "/getBanks",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    getBanksCtrl
);

router.post(
    "/banksEnquiry",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    banksEnquiryCtrl
);

router.post(
    "/ngnTransferToOtherBanks",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    ngnTransfer2OtherBanksCtrl
);

router.get(
    "/searchUserAccount",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    searchUserAccountCtrl
);

export default router;