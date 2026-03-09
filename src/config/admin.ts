const adminEmailsEnv = process.env.ADMIN_EMAILS || '';

export const ADMIN_EMAILS: string[] = adminEmailsEnv
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
