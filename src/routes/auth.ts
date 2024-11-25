import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Models
import { userModel } from '../models/users.model.js';

// Controllers
import { 
    // signupController, 
    setPinCtr, 
    verifyUserExist,
    verifyUsernameExist,
    verifyPhoneNumberExist,

    loginController, 
    // updateUserProfileCtr, 
    changePasswordCtr,
    resetPasswordCtr,
    reValidateUserAuthCtrl,
    sendPasswordResetEmailCtr,
    verifyEmailTokenCtr,
    // verifyPhoneTokenCtr,
    sendPhoneVerificationTokenCtr,

    sendEmailVerificationMail,
    verifyEmailCodeTokenCtr,
    verifyPhoneCodeTokenCtr,
    verifyBvnNumberUsingBlusaltCtrl,
    createAccountCtrl,
    // appSettingsCtrl
} from './../controllers/authController.js';

// middleWares
import authMiddleware from '@/middleware/auth.js'
import routeValidationResult from '@/middleware/routeValidationResult.js'
import { getWaasAuthToken } from '@/middleware/psbAuth.js';


router.use(bodyParser.json());

// sendEmailVerificationCode
router.get(
    "/sendEmailVerificationCode",
    [
        query('email').trim()
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail(),

        routeValidationResult
    ],
    sendEmailVerificationMail
);

// verify code sent to email
router.post(
    '/verifyEmailCode',
    [
        body('code').trim()
            .notEmpty()
            .withMessage('verification code is required.'),

        routeValidationResult
    ],
    verifyEmailCodeTokenCtr
);

// sendPhoneVerificationCode
router.get(
    "/sendPhoneVerificationCode",
    [
        query('phoneNumber').trim()
            .notEmpty()
            .withMessage('Please enter a valid phone number'),

        routeValidationResult
    ],
    sendPhoneVerificationTokenCtr
);

// verifyPhoneNumberCode
router.post(
    '/verifyPhoneNumberCode',
    [
        body('code').trim()
            .notEmpty()
            .withMessage('verification code is required.'),

        routeValidationResult
    ],
    verifyPhoneCodeTokenCtr
);


const bvnVerificationLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3, // Limit each IP to 3 requests per 24 hours
    message: 'You have exceeded the request limit for bvn verification, please try again later.',
    // standardHeaders: true,
    // legacyHeaders: false,
});

// verifyBvnNumber
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

        body('gender')
            .isString().notEmpty()
            .withMessage('Gender is required'),

        body('dob')
            .isString().notEmpty()
            .withMessage('Date of birth is required'),

        body('country')
            .isString().notEmpty()
            .withMessage('Country is required'),

        routeValidationResult,
        // bvnVerificationLimiter
    ],
    verifyBvnNumberUsingBlusaltCtrl
);


router.get(
    "/verifyUsername",
    [

        query('username').trim().notEmpty()
            .withMessage('Username is required'),

        routeValidationResult
    ],
    verifyUsernameExist
);

// create-account
router.post(
    '/create-account',
    [
        // body('firstName').trim().not().isEmpty(),
        // body('middleName').trim(),
        // body('lastName').trim().not().isEmpty(),
        // body('gender').trim().notEmpty(),
        // body('dob').trim().notEmpty(),
        
        body('bvn').trim().notEmpty()
            .withMessage('BVN number is required.'),

        body('username').trim().notEmpty()
            .withMessage('username is required.'),

        body('email').trim()
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail(),

        body('phoneNumber').trim().notEmpty()
            .withMessage('Phone number is required'),

        body('country').trim().notEmpty()
            .withMessage('Country is required'),

        body('referredBy').trim(),
        body('password').trim().isLength({ min: 5}).notEmpty()
            .withMessage('password is required'),

        // body('tnc')
        // .custom((tnc) => {
        //     if (tnc != "true") return Promise.reject('Must accept terms and conditions before proceeding.');
        // }),
        
        routeValidationResult,
        getWaasAuthToken
    ],
    createAccountCtrl
);

// setPin
router.post(
    "/setPin",
    [
        body('pin').trim().notEmpty()
            .withMessage('Transaction pin is required.'),

        body('email').trim().notEmpty()
            .withMessage('email is required.'),

        authMiddleware,
    ],
    setPinCtr
);



// verify sent email reset password token
router.post(
    '/verifyEmailToken',
    verifyEmailTokenCtr
);


// // signup
// router.post(
//     '/signup',
//     [
//         body('firstName').trim().not().isEmpty(),
//         body('middleName').trim(),
//         body('lastName').trim().not().isEmpty(),
//         body('gender').trim().not().isEmpty(),
//         body('dob').trim().not().isEmpty(),
//         body('country').trim().not().isEmpty(),
//         // body('pin').not().isEmpty(),

//         body('username').trim().not().isEmpty()
//         .custom(async (username) => {
//             try {
//                 const userExist = await userModel.findOne({ username });

//                 if (userExist) {
//                     return Promise.reject('Username already exist');
//                 }
//             } catch (error) {
//                 return Promise.reject(error);
//                 // return Promise.reject('server error occured');
//             }
//         }),

//         body('email').trim()
//         .isEmail().withMessage('Please enter a valid email')
//         .custom(async (email) => {
//             try {
//                 const userExist = await userModel.findOne({ email });

//                 if (userExist) {
//                     return Promise.reject('Email Address already exist!');
//                 }
//             } catch (error) {
//                 return Promise.reject(error);
//                 // return Promise.reject('server error occured ');
//             }
//         }).normalizeEmail(),

//         body('phoneNumber').trim().not().isEmpty()
//         .custom(async (phoneNumber) => {
//             try {
//                 const userExist = await userModel.findOne({ phoneNumber });
                
//                 if (userExist) {
//                     return Promise.reject('Phone number already exist!');
//                 }
//             } catch (error) {
//                 return Promise.reject(error);
//                 // return Promise.reject('server error occured ');
//             }
//         }),


//         // body('tnc')
//         // .custom((tnc) => {
//         //     if (tnc != "true") return Promise.reject('Must accept terms and conditions before proceeding.');
//         // }),

//         body('location').not().isEmpty(), // an object of userLocationInterface

//         body('referredBy').trim(),

//         body('password').trim().isLength({ min: 5}).not().isEmpty(),
//     ],
//     signupController
// );


router.post(
    "/verifyUser",
    verifyUserExist
);

// router.get(
//     "/verifyEmail",
//     verifyEmailExist
// );


router.get(
    "/verifyPhoneNumber",
    verifyPhoneNumberExist
);


// Login
router.post(
    '/login',
    [
        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),

        body('password').trim().not().isEmpty()
    ],
    loginController
);

// reValidateUserAuth
router.get(
    "/reValidateUserAuth",
    reValidateUserAuthCtrl
)

// // update User Profile
// router.post(
//     '/updateUserProfile',
//     authMiddleware,
//     updateUserProfileCtr
// );

// change User password
router.post(
    '/changePassword',
    authMiddleware,
    changePasswordCtr
);

// send Password Reset Email
router.post(
    '/sendPasswordResetEmail',
    [
        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    ],
    sendPasswordResetEmailCtr
);



// reset password
router.post(
    '/resetPassword',
    [
        body('password').trim()
        .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/)
        .isLength({ min: 6}).not().isEmpty(),
        
        body('confirmPassword').trim()
        .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/)
        .isLength({ min: 6}).not().isEmpty(),

        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    ],
    resetPasswordCtr
);

// app settings
// router.get(
//     '/settings',
//     appSettingsCtrl
// );

// // verification for auto login
// router.post(
//     '/verify',
//     authMiddleware,
//     async (req, res) => {
//         return res.status(200).json({
//             message: "Authenticated Successfully!",
//             statusCode: 200,
//             token: req.body
//         });
//     }
// );

export default router;