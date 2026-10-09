/* Server-only configuration. Nothing in here is allowed to reach the browser. */

export const BACKEND_URL = (process.env.PLATA_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
