import fs from "fs";
import Jwt from "jsonwebtoken";
// import axios from "axios";
import nodemailer from 'nodemailer';
import moment from 'moment';

const year = moment().format("YYYY");


const mailTransporter = () => {
    const mailTransporter = nodemailer.createTransport({
        // service: "gmail",
        host:  process.env.HOST_SENDER,
        port: 465,
        auth: {
            user: process.env.HOST_EMAIL,
            pass: process.env.HOST_PASSWORD
        }
    });

    return mailTransporter;
}

export const sendEmailVerificationCode = (email: string, subject = "Email Verification Code - TesaPay") => {
    try {
        const codeLength = 4;
        const code = Math.floor(Math.random() * Math.pow(10, codeLength)).toString().padStart(codeLength, '0');
    
        const jwt_token = Jwt.sign(
            { code, email },
            `${code}`,
            { expiresIn: '30m' }
        );

        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/emailVerification.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{code}}/g, code)
        .replace(/{{year}}/g, year);
        
        // console.log(Htmltemplate);
        
        const mailText = `
            Hello,

            Thank you for signing up for TesaPay! Please verify your email address to complete your registration. Use the verification code below:

            ${code}

            If you didn't request this, please ignore this email.

            Best regards,  
            TesaPay  

            © ${year} TesaPay. All rights reserved.
        `;

        const details = {
            from: `TesaPay <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject,
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter().sendMail(details, (err) => {
            if (err) {
                return {
                    status: false,
                    error: err,
                    message: 'an error occured while sending verification mail.',
                }
            }
        });
        
        return {
            status: true,
            code: code,
            jwt_token: jwt_token,
            message: 'Email sent successfully.',
        }
    } catch (error) {
        return {
            status: false,
            error,
            message: 'an error occured while sending verification email.',
        }
    }
}
