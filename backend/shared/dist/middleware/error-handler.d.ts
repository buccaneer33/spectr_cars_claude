import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, code: string, message: string);
}
export declare function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=error-handler.d.ts.map