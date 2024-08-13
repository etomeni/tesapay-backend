import { Request, Response, NextFunction } from "express-serve-static-core";
import { sendEmailVerificationCode, verifyEmailTokenCtr } from "./authController.js";

export const get404 = (req: Request, res: Response, next: NextFunction) => {
    // sendEmailVerificationCode("sundadddddd@gmail.com");
    // const code = "820157";
    // const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2RlIjoiODIwMTU3IiwiZW1haWwiOiJzdW5kYWRkZGRkZEBnbWFpbC5jb20iLCJpYXQiOjE3MTQ2NjQ1NjYsImV4cCI6MTcxNDY2NjM2Nn0._cbzu8CjoVqLLvmGxGTm_vZ10Wbg91N66_FPADzl1nM";
    // sendEmailVerificationCode("sundaywht@gmail.com", "Etom");

    
    // const error: any = new Error("Not Found.");
    // error.status = false;
    // error.statusCode = 404;
    // error.message = 'Path Not Found.';
    // next(error);


    // next({
    //     status: false,
    //     statusCode: 404,
    //     message: 'Path Not Found.',
    // });

    return res.status(404).json({
        status: false,
        statusCode: 404, 
        message: 'Endpoint url resource Not Found.'
    });
}

export const get500 = (error: any, req:Request, res: Response, next: NextFunction) => {
    const data = error.data;

    return res.status(error.statusCode || 500).json({
        error: {
            message: error.message,
            data: data
        }
    });
}
