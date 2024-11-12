import crypto from "node:crypto";

const ALGORITHM = "aes-256-cbc";

// 加密数据
export const encrypt = (data: string, password: string): string => {
  const key = crypto.scryptSync(password, "salt", 32);
  const iv = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

// 解密数据
export const decrypt = (encryptedData: string, password: string): string => {
  const key = crypto.scryptSync(password, "salt", 32);
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
