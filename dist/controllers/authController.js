import fs from "fs";
import bcryptjs from "bcryptjs";
import { validationResult } from "express-validator";
import { v4 as uuidv4 } from 'uuid';
import Jwt from "jsonwebtoken";
// import axios from "axios";
import nodemailer from 'nodemailer';
// import path from "path";
// models
import { userModel } from '../models/users.model.js';
import { maskPhoneNumber, termiSendSmsEndpoint } from "../util/resources.js";
import axios from "axios";
const secretForToken = process.env.JWT_SECRET;
export const signupController = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Form Validation Error!',
                ...errors
            });
        }
        ;
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        error.message = "sent data validation error";
        next(error);
    }
    try {
        if (req.body.tnc != true) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Must accept terms and conditions before proceeding.'
            });
        }
        const getLast10Chars = (str) => {
            // Handle short strings
            if (str.length <= 10)
                return str;
            // Extract the last 10 characters
            return str.slice(-10);
        };
        const hashedPassword = await bcryptjs.hash(req.body.password, 12);
        const userDetails = {
            userId: await uuidv4(),
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            gender: req.body.gender,
            dob: req.body.dob,
            // pin: req.body.pin,
            username: req.body.username,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            country: req.body.country,
            password: hashedPassword,
            // account: [getAccountDetails],
            status: true,
            location: req.body.location,
            referredBy: req.body.referredBy,
            // pin: 0,
            // NIN: 0,
            // BVN: {},
            idImage: '',
            isAddressVerified: false,
            isBVNverified: false,
            isEmailVerified: false,
            isNINverified: false,
            isPhoneNumberVerified: false,
            address: {
                ip: '',
                street: '',
                city: '',
                region: '',
                country: '',
            }
        };
        const newUser = new userModel(userDetails);
        const result = await newUser.save();
        if (result._id) {
            // Send a mail verification code.
            const mailRes = sendEmailVerificationCode(userDetails.email, `${userDetails.firstName} ${userDetails.middleName || ''} ${userDetails.lastName}`);
            if (!mailRes.status) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: mailRes.message,
                    error: mailRes.error
                });
            }
            const token = Jwt.sign({
                username: userDetails.username,
                email: userDetails.email,
                userId: userDetails.userId,
                _id: result._id
            }, `${secretForToken}`, { expiresIn: '7d' });
            return res.status(201).json({
                status: true,
                statusCode: 201,
                token,
                verificationToken: mailRes.token,
                userId: userDetails.userId,
                resultData: result,
                message: 'User registered successfully!'
            });
        }
        return res.status(500).json({
            status: 500,
            message: 'unable to register new user.'
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const verifyUserExist = async (req, res, next) => {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const phoneNumber = req.body.phoneNumber;
        const userExist = await userModel.findOne({
            $or: [
                { username: username },
                { email: email },
                { phoneNumber: phoneNumber }
            ]
        });
        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'User already exist'
            });
        }
        else {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'successfully'
            });
        }
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const verifyUsernameExist = async (req, res, next) => {
    try {
        const username = req.query.username;
        const userExist = await userModel.findOne({ username });
        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Username already exist.'
            });
        }
        else {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'successfully'
            });
        }
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const verifyEmailExist = async (req, res, next) => {
    try {
        const email = req.query.email;
        // const userDele = await userModel.deleteOne({ email });
        const userExist = await userModel.findOne({ email });
        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Email address already exist'
            });
        }
        else {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'successfully'
            });
        }
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const verifyPhoneNumberExist = async (req, res, next) => {
    try {
        const phoneNumber = req.query.phoneNumber;
        const userExist = await userModel.findOne({ phoneNumber });
        if (userExist) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Phone number already exist'
            });
        }
        else {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'successfully'
            });
        }
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const loginController = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Incorrect email or password!',
                errors
            });
        }
        ;
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        error.message = "sent data validation error";
        next(error);
    }
    try {
        const email = req.body.email;
        const sentPassword = req.body.password;
        const user = await userModel.findOne({ email });
        if (!user?._id || user?.isDeleted) {
            const error = new Error('A user with this username or email could not be found!');
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Incorrect email or password!"
            });
        }
        ;
        const isPassEqual = await bcryptjs.compare(sentPassword, user.password);
        if (!isPassEqual) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Incorrect email or password!"
            });
        }
        if (user?.status == false) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "This account has been disabled, if you believe this is a mistake please contact support to resolve."
            });
        }
        ;
        const token = Jwt.sign({
            username: user.username,
            email: user.email,
            userId: user.userId,
            _id: user._id
        }, `${secretForToken}`, { expiresIn: '7d' });
        return res.status(201).json({
            status: true,
            statusCode: 201,
            message: 'Login successful',
            token: token,
            resultData: user,
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
// export const updateUserProfileCtr = async (req, res, next) => {
//     try {
//         const userId = req.body.userId;
//         const password = req.body.password;
//         const formData = req.body.formData;
//         // const formKeys = req.body.formKeys;
//         // const formValues = req.body.formValues;
//         const user = await auth.findByID(userId);
//         if (user && user.status == false) {
//             const error = new Error('A user with this ID could not be found!');
//             error.statusCode = 401;
//             error.message = "unable to verify user's ID, please refreash and try again!!!";
//             return res.status(401).json({
//                 error,
//                 statusCode: error.statusCode,
//                 msg: error.message
//             });
//         };
//         const isPassEqual = await bcryptjs.compare(password, user.password);
//         if (!isPassEqual) {
//             const error = new Error('Wrong password!');
//             error.statusCode = 401;
//             error.message = 'Wrong password!';
//             // throw error;
//             return res.status(401).json({
//                 error,
//                 statusCode: error.statusCode,
//                 msg: error.message
//             });
//         };
//         // const updatedUser = await userModel.findOneAndUpdate(
//         //     { email: user.email }, 
//         //     { password: hashedPassword },
//         //     {
//         //         runValidators: true,
//         //         returnOriginal: false,
//         //     }
//         // );
//         // if (updatedUser) {
//         //     return res.status(201).json({
//         //         status: 201,
//         //         message: 'Password Changed successfully!',
//         //     });
//         // }
//         // return res.status(500).json({
//         //     status: 500,
//         //     message: 'Ooopps unable to update password.',
//         // });
//         const updatedUser = await auth.updateUser( userId, formData);
//         if (updatedUser && updatedUser.status == false) {
//             return res.status(500).json({
//                 status: 500,
//                 message: updatedUser.message,
//             });
//         }
//         // const newUserData = await auth.findByID(userId);
//         return res.status(201).json({
//             status: 201,
//             message: 'Profile details updated successfully!',
//             // user: newUserData[0][0],
//             user: updatedUser,
//         });
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }
export const changePasswordCtr = async (req, res, next) => {
    try {
        // const userId = req.body.userId;
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmNewPassword = req.body.confirmNewPassword;
        const userDataParam = req.body.middlewareParam;
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "passwords doesn't match."
            });
        }
        const user = await userModel.findOne({ email: userDataParam.email });
        if (!user?._id) {
            return res.status(401).json({
                message: "A user with this ID could not be found!",
                status: false,
                statusCode: 401,
            });
        }
        ;
        const isPassEqual = await bcryptjs.compare(currentPassword, user.password);
        if (!isPassEqual) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Wrong password!"
            });
        }
        const hashedPassword = await bcryptjs.hash(newPassword, 12);
        const updatedUser = await userModel.findOneAndUpdate({ userId: user.userId }, { password: hashedPassword });
        if (!updatedUser?._id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Ooopps unable to update password.',
            });
        }
        return res.status(201).json({
            status: true,
            statusCode: 201,
            message: 'Password Changed successfully!',
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const sendPasswordResetEmailCtr = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'User with this Email Address does not exist!',
                errors
            });
        }
        ;
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        error.message = "sent data validation error";
        next(error);
    }
    try {
        const email = req.body.email;
        const uzer = await userModel.findOne({ email });
        console.log(uzer);
        if (!uzer?.email) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'User with this Email Address does not exist!',
            });
        }
        const mailResponse = sendEmailVerificationCode(email, `${uzer.firstName} ${uzer.middleName || ''} ${uzer.lastName}`, "Password Reset - Email Verification Code.");
        if (!mailResponse.status) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: mailResponse.message,
                error: mailResponse.error
            });
        }
        return res.status(201).json({
            statusCode: 201,
            status: true,
            token: mailResponse.token,
            message: 'Password reset Email sent, kindly check your mail for verification code.',
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const resendEmailVerificationTokenCtr = async (req, res, next) => {
    try {
        const email = req.body.email || "";
        const firstName = req.body.firstName || "";
        const middleName = req.body.middleName || "";
        const lastName = req.body.lastName || "";
        const mailRes = sendEmailVerificationCode(email, `${firstName} ${middleName || ''} ${lastName}`);
        if (!mailRes.status) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: mailRes.message,
                error: mailRes.error
            });
        }
        return res.status(201).json({
            status: true,
            statusCode: 201,
            verificationToken: mailRes.token,
            message: 'User registered successfully!'
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const sendPhoneVerificationTokenCtr = async (req, res, next) => {
    try {
        const phoneNumber = req.body.phoneNumber;
        const codeLength = 6;
        const code = Math.floor(Math.random() * Math.pow(10, codeLength)).toString().padStart(codeLength, '0');
        const jwt_token = Jwt.sign({ code, phoneNumber }, `${code}`, { expiresIn: '30m' });
        // Remove any non-digit characters from the input
        const cleanedNumber = phoneNumber.replace(/\D/g, '');
        const msg = `Your TesaPay verification code is: ${code}. \nPlease do not share this code with anyone, no staff of TesaPay will ask for this code. `;
        const msg2send = {
            to: cleanedNumber,
            // to: '2347019055569',
            from: "N-Alert",
            sms: msg,
            type: "plain",
            channel: "dnd",
            api_key: process.env.TERMII_API_KEY,
        };
        const response = (await axios.post(`${termiSendSmsEndpoint}`, msg2send)).data;
        // console.log(response);
        if (!response.message_id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                error: response,
                message: "unabl to send otp code"
            });
        }
        return res.status(201).json({
            status: true,
            statusCode: 201,
            messageId: response.message_id,
            verificationToken: jwt_token,
            message: `Verification code sent to ${maskPhoneNumber(phoneNumber)}. Enter the code to verify.`,
        });
    }
    catch (err) {
        const error = err.response.data ?? err;
        if (!error.statusCode)
            error.statusCode = 500;
        next(error);
    }
};
export const verifyPhoneTokenCtr = async (req, res, next) => {
    try {
        const code = req.body.code;
        // const token = req.body.token;
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            const error = new Error("Not authenticated!");
            return res.status(401).json({
                message: "No authentication token, Please try again.",
                status: false,
                statusCode: 401,
                error
            });
        }
        ;
        const token = authHeader.split(' ')[1];
        const verifyRes = verifyEmailToken(code, token);
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'wrong Verification Code!',
            });
        }
        const uzer = await userModel.findOneAndUpdate({ phoneNumber: verifyRes.decodedToken.phoneNumber }, // Query to find the user
        { $set: { isPhoneNumberVerified: true } });
        if (!uzer) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'server error. unable to update verification status.',
            });
        }
        return res.status(201).json({
            statusCode: 201,
            status: true,
            decodedToken: verifyRes.decodedToken,
            message: 'Phone number verified!',
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
};
export const verifyEmailTokenCtr = async (req, res, next) => {
    try {
        const code = req.body.code;
        // const email = req.body.email;
        // const token = req.body.token;
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            const error = new Error("Not authenticated!");
            return res.status(401).json({
                message: "No authentication token, Please try again.",
                status: false,
                statusCode: 401,
                error
            });
        }
        ;
        const token = authHeader.split(' ')[1];
        const verifyRes = verifyEmailToken(code, token);
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'wrong Verification Code!',
            });
        }
        // console.log(verifyRes);
        const uzer = await userModel.findOneAndUpdate({ email: verifyRes.decodedToken.email }, // Query to find the user
        { $set: { isEmailVerified: true } });
        if (!uzer) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'server error. unable to update verification status.',
            });
        }
        // TODO:: send an email to the user notifying them that the mail has been verified
        return res.status(201).json({
            statusCode: 201,
            status: true,
            decodedToken: verifyRes.decodedToken,
            message: 'Email verified!',
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
};
export const setPinCtr = async (req, res, next) => {
    try {
        const pin = req.body.pin;
        const email = req.body.email;
        // const token = req.body.token;
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            const error = new Error("Not authenticated!");
            return res.status(401).json({
                message: "No authentication token, Please try again.",
                status: false,
                statusCode: 401,
                error
            });
        }
        ;
        // TODO::: validate the authentication header
        // console.log(verifyRes);
        const uzer = await userModel.findOneAndUpdate({ email }, // Query to find the user
        { $set: { pin: pin } });
        if (!uzer) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'user with this email does not exist',
            });
        }
        // TODO:: send an email to the user notifying them that the their transactional pin has been set
        return res.status(201).json({
            statusCode: 201,
            status: true,
            message: 'Email verified!',
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
};
export const resetPasswordCtr = async (req, res, next) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({
                statusCode: 400,
                status: false,
                message: 'password Error!',
                error
            });
        }
        ;
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        error.status = false;
        error.message = "sent data validation error";
        next(error);
    }
    try {
        const email = req.body.email;
        const newPassword = req.body.password;
        const confirmPassword = req.body.confirmPassword;
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'password does not match.',
            });
        }
        const hashedPassword = await bcryptjs.hash(newPassword, 12);
        const updatedUser = await userModel.findOneAndUpdate({ email: email }, { password: hashedPassword }, {
            runValidators: true,
            returnOriginal: false,
        });
        // TODO:: send email to user about the changed password.
        if (updatedUser) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                message: 'Password Changed successfully!',
            });
        }
        return res.status(500).json({
            status: false,
            statusCode: 500,
            message: 'Ooopps unable to update password.',
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const reValidateUserAuthCtrl = async (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            return res.status(401).json({
                message: "Not authenticated! Please login and try again.",
                statusCode: 401,
                status: false,
            });
        }
        const token = authHeader.split(' ')[1];
        let decodedToken;
        try {
            const secretForToken = process.env.JWT_SECRET;
            decodedToken = Jwt.verify(token, `${secretForToken}`);
        }
        catch (error) {
            return res.status(500).json({
                message: "wrong authentication token",
                statusCode: 500,
                status: false,
                error
            });
        }
        if (!decodedToken) {
            return res.status(401).json({
                message: "Not authenticated! unable to verify user authtentication token.",
                status: false,
                statusCode: 401,
            });
        }
        const result = {
            isLoggedin: true,
            userId: decodedToken.userId,
            email: decodedToken.email,
            username: decodedToken.username
        };
        return res.status(201).json({
            status: true,
            statusCode: 201,
            resultData: result,
            message: 'success!',
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};
export const sendEmailVerificationCode = (email, name = "", subject = "Email Verification Code") => {
    try {
        const codeLength = 6;
        const code = Math.floor(Math.random() * Math.pow(10, codeLength)).toString().padStart(codeLength, '0');
        const jwt_token = Jwt.sign({ code, email }, `${code}`, { expiresIn: '30m' });
        const mailTransporter = nodemailer.createTransport({
            // service: "gmail",
            host: process.env.HOST_SENDER,
            port: 465,
            auth: {
                user: process.env.HOST_EMAIL,
                pass: process.env.HOST_PASSWORD
            }
        });
        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/emailVerification.html", 'utf8');
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name).replace(/{{code}}/g, code);
        // console.log(Htmltemplate);
        const mailText = `
            Email Verification


            Hi ${name},
            Please use this code below to verify your email address.
            
            ${code}
            
            
            Thanks for choosing TesaPay.
            
            Best wishes,
            TesaPay
        `;
        const details = {
            from: `TesaPay <${process.env.HOST_EMAIL}>`,
            to: `${email}`,
            subject,
            text: mailText,
            html: Htmltemplate
        };
        mailTransporter.sendMail(details, (err) => {
            if (err) {
                return {
                    status: false,
                    err,
                    message: 'an error occured while sending verification mail.',
                };
            }
        });
        return {
            status: true,
            token: jwt_token,
            message: 'Email sent successfully.',
        };
    }
    catch (error) {
        return {
            status: false,
            error,
            message: 'an error occured while sending verification email.',
        };
    }
};
export const verifyEmailToken = (code, token) => {
    try {
        let decodedToken = Jwt.verify(token, `${code}`);
        // console.log(decodedToken);
        if (!decodedToken || decodedToken.code != code) {
            return {
                status: false,
                // decodedToken,
                message: 'wrong Verification Code!',
            };
        }
        return {
            status: true,
            decodedToken,
            message: 'Email verified!',
        };
    }
    catch (error) {
        return {
            status: false,
            message: 'unable to verify Verification Code!',
        };
    }
};
