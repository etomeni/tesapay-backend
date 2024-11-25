import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// Models
// import { userModel } from '../models/users.model.js';

// Controllers
import { 
    sendEmailVerificationMail,

    
    verifyUserExist,
    verifyEmailExist,
    verifyUsernameExist,
    verifyPhoneNumberExist,

    verifyEmailTokenCtr,
    verifyPhoneTokenCtr,
    resendEmailVerificationTokenCtr,
    sendPhoneVerificationTokenCtr,
    verifyBvnNumberCtrl,
    verifyBvnNumberUsingBlusaltCtrl
} from '../controllers/verificationController.js';

// middleWares
// import authMiddleware from '../middleware/auth.js'


router.use(bodyParser.json());


router.get(
    "/verifyEmail",
    [
        query('email').trim()
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail(),
    ],
    sendEmailVerificationMail
);

router.post(
    "/verifyBvnNumber",
    [
        body('bvn')
            .isString().notEmpty()
            .withMessage('bvn number is required'),

        body('email')
            .isString().notEmpty()
            .withMessage('Email address is required'),

        body('phoneNumber')
            .isString().notEmpty()
            .withMessage('Phone number is required'),
    ],
    verifyBvnNumberUsingBlusaltCtrl
);

// this is no longer needed
router.patch(
    "/verifyBvnNumber",
    verifyBvnNumberCtrl
);

router.post(
    "/verifyUser",
    verifyUserExist
);


router.get(
    "/verifyUsername",
    verifyUsernameExist
);

router.get(
    "/verifyPhoneNumber",
    verifyPhoneNumberExist
);


// verify sent email reset password token
router.post(
    '/verifyEmailToken',
    // [
    //     body('email').trim()
    //         .isEmail().withMessage('Please enter a valid email')
    //         .normalizeEmail(),
    // ],
    verifyEmailTokenCtr
);

router.post(
    '/verifyPhoneToken',
    verifyPhoneTokenCtr
);

router.post(
    '/resendEmailVerificationToken',
    resendEmailVerificationTokenCtr
);

router.post(
    '/sendPhoneVerificationToken',
    sendPhoneVerificationTokenCtr
);


export default router;