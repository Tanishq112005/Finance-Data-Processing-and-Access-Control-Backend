"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiError {
    success;
    errors;
    message;
    constructor(message = "Something went wrong", errors = {}) {
        this.success = false;
        this.message = message;
        this.errors = errors;
    }
}
exports.default = ApiError;
