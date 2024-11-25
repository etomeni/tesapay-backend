import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

// middleWares
import authMiddleware from '../middleware/auth.js';
import { getWaasAuthToken } from '@/middleware/psbAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js'

// Controllers
import { 
    createNewSavingsCtrl,
    getSavingsCtrl,
    liquidateSavingsCtrl
} from '../controllers/waasSavingsController.js';

const router = express.Router();

router.use(bodyParser.json());

// create a new savings
// createSavings
router.post(
    "/createSavings",
    [
        body('name')
            .isString().trim()
            .withMessage("Saving's name is required."),

        body('amount')
            .isNumeric().notEmpty()
            .withMessage('Amount is required.'),

        body('duration')
            .isNumeric().notEmpty()
            .withMessage('Duration is required.'),

        body('duration')
            .isNumeric().notEmpty()
            .withMessage('Duration is required.'),

        body('paybackDate')
            .isString().trim()
            .withMessage('Payback date is required.'),

        body('interestRate')
            .isNumeric().notEmpty()
            .withMessage('Interest rate is required.'),

        body('interestGain')
            .isNumeric().notEmpty()
            .withMessage('Interest gained is required.'),

        body('totalPayback')
            .isNumeric().notEmpty()
            .withMessage('Total payback amount is required.'),

        // body('action')
        //     .isString().trim()
        //     .isIn(['block', 'remove'])
        //     .withMessage('action must be either "block" or "remove".'),
        
        routeValidationResult,
        authMiddleware,
        getWaasAuthToken
    ],
    createNewSavingsCtrl
);


// Get paginated savings created by a user
// getSavings
router.get(
    "/getSavings",
    [
        query('page')
            .isNumeric().notEmpty()
            .withMessage('Page number is required.'),
            
        query('limit')
            .isNumeric().notEmpty()
            .withMessage('Limit is required.'),
            
        routeValidationResult,
        authMiddleware,
        // getWaasAuthToken
    ],
    getSavingsCtrl
);

// liquidate
router.post(
    "/liquidate",
    [
        body('_id')
            .isString().trim()
            .withMessage("Saving's id is required."),
            
        routeValidationResult,
        authMiddleware,
        // getWaasAuthToken
    ],
    liquidateSavingsCtrl
);


export default router;