import express from 'express';
import { body  } from 'express-validator';
import bodyParser from 'body-parser';
// import Jwt  from "jsonwebtoken";
// import { Request, Response, NextFunction } from "express-serve-static-core";

const router = express.Router();

// Models
import { userModel } from '../models/users.model.js';

// Controllers
import { 
    signupController, 
    setPinCtr, 
    verifyUserExist,
    verifyEmailExist,
    verifyUsernameExist,
    verifyPhoneNumberExist,

    loginController, 
    // updateUserProfileCtr, 
    changePasswordCtr,
    resetPasswordCtr,
    reValidateUserAuthCtrl,
    sendPasswordResetEmailCtr,
    verifyEmailTokenCtr,
    resendEmailVerificationTokenCtr,
    sendPhoneVerificationTokenCtr
} from './../controllers/authController.js';

// middleWares
import authMiddleware from './../middleware/auth.js'


router.use(bodyParser.json());

// signup
router.post(
    '/signup',
    [
        body('firstName').trim().not().isEmpty(),
        body('middleName').trim(),
        body('lastName').trim().not().isEmpty(),
        body('gender').trim().not().isEmpty(),
        body('dob').trim().not().isEmpty(),
        body('country').trim().not().isEmpty(),
        // body('pin').not().isEmpty(),

        body('username').trim().not().isEmpty()
        .custom(async (username) => {
            try {
                const userExist = await userModel.findOne({ username });

                if (userExist) {
                    return Promise.reject('Username already exist');
                }
            } catch (error) {
                return Promise.reject(error);
                // return Promise.reject('server error occured');
            }
        }),

        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .custom(async (email) => {
            try {
                const userExist = await userModel.findOne({ email });

                if (userExist) {
                    return Promise.reject('Email Address already exist!');
                }
            } catch (error) {
                return Promise.reject(error);
                // return Promise.reject('server error occured ');
            }
        }).normalizeEmail(),

        body('phoneNumber').trim().not().isEmpty()
        .custom(async (phoneNumber) => {
            try {
                const userExist = await userModel.findOne({ phoneNumber });

                if (userExist) {
                    return Promise.reject('Phone number already exist!');
                }
            } catch (error) {
                return Promise.reject(error);
                // return Promise.reject('server error occured ');
            }
        }),


        // body('tnc')
        // .custom((tnc) => {
        //     if (tnc != "true") return Promise.reject('Must accept terms and conditions before proceeding.');
        // }),

        body('location').not().isEmpty(), // an object of userLocationInterface

        body('referredBy').trim(),

        body('password').trim().isLength({ min: 5}).not().isEmpty(),
    ],
    signupController
);

router.post(
    "/setPin",
    setPinCtr
);

router.post(
    "/verifyUser",
    verifyUserExist
);

router.post(
    "/verifyEmail",
    verifyEmailExist
);

router.post(
    "/verifyUsername",
    verifyUsernameExist
);

router.post(
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

// verify sent email reset password token
router.post(
    '/verifyEmailToken',
    verifyEmailTokenCtr
);

router.post(
    '/resendEmailVerificationToken',
    resendEmailVerificationTokenCtr
);

router.post(
    '/sendPhoneVerificationToken',
    sendPhoneVerificationTokenCtr
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