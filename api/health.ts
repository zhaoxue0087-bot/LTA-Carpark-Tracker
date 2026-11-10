import type { Request, Response } from 'express';

/**
 * Serverless / API Route: /api/health
 * Returns service health status and checks if LTA DataMall AccountKey is configured in environment.
 * Zero hardcoded keys.
 */
export default async function handler(req: Request, res: Response) {
  const hasAccountKey = Boolean(
    process.env.LTA_ACCOUNT_KEY || 
    process.env.LTA_DATAMALL_KEY ||
    req.headers['x-account-key'] ||
    req.headers['accountkey']
  );

  return res.status(200).json({
    status: 'ok',
    service: 'SG Carpark Tracker - LTA DataMall Serverless API',
    endpoint: '/api/health',
    timestamp: new Date().toISOString(),
    hasAccountKeyConfigured: hasAccountKey,
    environment: process.env.NODE_ENV || 'development',
  });
}
