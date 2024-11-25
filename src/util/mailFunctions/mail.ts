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

export const sendUserContactMailAutoResponse = (email: string, name: string, message: string) => {
    try {
        const mailTransporter = nodemailer.createTransport({
            // service: "gmail",
            host:  process.env.HOST_SENDER,
            port: 465,
            auth: {
                user: process.env.HOST_EMAIL,
                pass: process.env.HOST_PASSWORD
            }
        });

        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/contactUs_UserAutoResMail.html", 'utf8');
        

        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{year}}/g, year)
        .replace(/{{message}}/g, message);
        
        // console.log(Htmltemplate);
        
        const mailText = `
            Hi ${name},

            Thank you for reaching out to us through our website's contact form. We have received your message and our team will review it shortly. One of our representatives will get back to you as soon as possible.

            Here are the details of your submission:

            Name: ${name}
            Email: ${email}
            Message: ${message}
            If you have any urgent questions, feel free to reply to this email or contact us directly at help@soundmuve.com.

            Thank you again for getting in touch!

            Best regards,
            Soundmuve
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "Thank You for Contacting Us - We've Received Your Message!",
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter.sendMail(details, (err) => {
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

export const sendAdminUserContactUsNotification = (email: string, name: string, message: string) => {
    try {
        const mailTransporter = nodemailer.createTransport({
            // service: "gmail",
            host:  process.env.HOST_SENDER,
            port: 465,
            auth: {
                user: process.env.HOST_EMAIL,
                pass: process.env.HOST_PASSWORD
            }
        });

        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/contactUs_NotifyAdminMail.html", 'utf8');
        

        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{year}}/g, year)
        .replace(/{{message}}/g, message);
        
        
        const mailText = `
            Hello Admin,

            You have received a new contact form submission on Soundmuve.com. Below are the details:

            Name: ${name}
            Email: ${email}
            Message: ${message}
            Please review the message and take appropriate action.

            Thank you.
            Soundmuve
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `help@soundmuve.com`,
            subject: "New Contact Form Submission",
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter.sendMail(details, (err) => {
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
