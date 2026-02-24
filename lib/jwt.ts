import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-in-production";

console.log("JWT Secret Key loaded:", SECRET_KEY ? "✓" : "✗");

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export type TokenPayloadCompat = {
  userId: number | string;
  email: string;
  role: string;
};

export function generateToken(payload: TokenPayloadCompat): string {
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
  console.log("Token generated with secret:", SECRET_KEY.substring(0, 5) + "...");
  return token;
}

export function verifyToken(token: string): TokenPayloadCompat | null {
  try {
    console.log("Verifying token with secret:", SECRET_KEY.substring(0, 5) + "...");
    const decoded = jwt.verify(token, SECRET_KEY) as TokenPayloadCompat;
    console.log("Token verified successfully");
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
