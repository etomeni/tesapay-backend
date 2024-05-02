import { Request, Response, NextFunction } from "express-serve-static-core";

export const get404 = (req: Request, res: Response, next: NextFunction) => {
    const error: any = new Error(" Not Found.");
    error.statusCode = 404;
    next(error);
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
