const crypto = require("crypto");

const hashToken = (token = "") =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

const generateMfaSecret = () => crypto.randomBytes(20).toString("hex");

const generateTotpCode = (secret, timestampMs = Date.now(), stepSeconds = 30) => {
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter % 0x100000000, 4);

  const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"));
  hmac.update(buffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const code = (binaryCode % 1000000).toString().padStart(6, "0");
  return code;
};

const verifyTotpCode = (secret, otp, window = 1) => {
  if (!secret || !otp) return false;
  const cleanOtp = String(otp).trim();
  for (let diff = -window; diff <= window; diff += 1) {
    const candidate = generateTotpCode(secret, Date.now() + diff * 30000);
    if (candidate === cleanOtp) return true;
  }
  return false;
};

module.exports = {
  hashToken,
  generateMfaSecret,
  generateTotpCode,
  verifyTotpCode,
};
