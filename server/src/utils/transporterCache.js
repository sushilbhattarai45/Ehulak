import nodemailer from "nodemailer";

const transportCache = new Map();

export const getTransporter = (smtpDetails) => {
  const cacheKey = smtpDetails.userId;

  if (transportCache.has(cacheKey)) {
    return transportCache.get(cacheKey);
  }

  const transporter = nodemailer.createTransport({
    host: smtpDetails.host,
    port: smtpDetails.port,
    secure: smtpDetails.port === 465,
    auth: {
      user: smtpDetails.username,
      pass: smtpDetails.password,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  transportCache.set(cacheKey, transporter);

  console.log(`Created SMTP transporter for ${cacheKey}`);

  return transporter;
};

export const deleteTransporter = (userId) => {
  const transporter = transportCache.get(userId);

  if (transporter) {
    transporter.close();
    transportCache.delete(userId);

    console.log(`Deleted SMTP transporter for ${userId}`);
  }
};

export const clearTransportCache = () => {
  for (const transporter of transportCache.values()) {
    transporter.close();
  }

  transportCache.clear();
};

export default transportCache;