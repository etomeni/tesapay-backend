import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// Models
// import { userModel } from '../models/users.model.js';

// Controllers
import { 
    appSettingsCtrl,
    getAllSettingsCtrl,
    getSettingsCtrl,
    updateSavingsCtrl,
    disabledAppSettingsCtrl
} from '../controllers/admin/settingsController.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// middleWares
// import authMiddleware from '../middleware/auth.js'


router.use(bodyParser.json());


router.get(
    "/settings",
    getSettingsCtrl
);

router.get(
    "/isAppDisabled",
    [
        query('isAppDisabled')
            .isBoolean().notEmpty()
            .withMessage('isAppDisabled state is required.'),
            
        routeValidationResult,
    ],
    disabledAppSettingsCtrl
);


export default router;