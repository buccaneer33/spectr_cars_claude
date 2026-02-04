"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = exports.createSessionSchema = void 0;
const zod_1 = require("zod");
exports.createSessionSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
});
exports.sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Message cannot be empty'),
});
