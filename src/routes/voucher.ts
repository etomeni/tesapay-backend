import express from 'express';
import { body  } from 'express-validator';
import bodyParser from 'body-parser';

// middleWares
import authMiddleware from '../middleware/auth.js';
import { getWaasAuthToken } from '@/middleware/psbAuth.js';

// Controllers
import { 
    createVoucherCtrl,
    redeemVoucherCtrl,
    getCreatedVouchers,
    getRedeemedVouchers,
    endGiveAwayCtrl
} from '../controllers/voucherController.js';

const router = express.Router();

router.use(bodyParser.json());

// create a voucher
router.post(
    "/createVoucher",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    createVoucherCtrl
);

// redeem a voucher
router.post(
    "/redeemVoucher",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    redeemVoucherCtrl
);

// Get all vouchers created by a user
router.get(
    "/getCreated",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    getCreatedVouchers
);

// Get all vouchers redeemed by a user
router.get(
    "/getRedeemed",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    getRedeemedVouchers
);

// end voucher give away
router.post(
    "/endGiveAway",
    [
        authMiddleware,
        getWaasAuthToken
    ],
    endGiveAwayCtrl
);

export default router;