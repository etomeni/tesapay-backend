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
    getTranactionsCtrl
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

export default router;