"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function successResponse(data) {
    return {
        success: true,
        data,
    };
}
function errorResponse(code, message) {
    return {
        success: false,
        error: {
            code,
            message,
        },
    };
}
//# sourceMappingURL=response.js.map