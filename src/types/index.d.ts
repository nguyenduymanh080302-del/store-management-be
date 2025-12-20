export * from "./token"
export * from "./api"
import express from "express";

declare global {
    namespace Express {
        interface Request {
            user?: Record<string, any>
        }
    }
}
