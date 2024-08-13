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
    verifyUserExist,
    verifyEmailExist,
    verifyUsernameExist,
    verifyPhoneNumberExist,

    verifyEmailTokenCtr,
    verifyPhoneTokenCtr,
    resendEmailVerificationTokenCtr,
    sendPhoneVerificationTokenCtr,
    verifyBvnNumberCtrl
} from '../controllers/verificationController.js';

// middleWares
import authMiddleware from '../middleware/auth.js'


router.use(bodyParser.json());




router.post(
    "/verifyBvnNumber",
    verifyBvnNumberCtrl
);

router.post(
    "/verifyUser",
    verifyUserExist
);

router.get(
    "/verifyEmail",
    verifyEmailExist
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