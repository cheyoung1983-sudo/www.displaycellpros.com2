# Production Operations Guide - Display & Cell Pros

This document outlines the essential procedures for maintaining, monitoring, and troubleshooting the production environment on Vercel.

## 🛠️ Operational Procedures

### 1. Rollback Strategy
If a deployment causes a critical failure, use the Vercel CLI or Dashboard to rollback instantly.
- **CLI**: `vercel rollback [deployment-url]`
- **Dashboard**: Go to the **Deployments** tab, find the last stable build, click the three dots, and select **Redeploy**.

### 2. Promoting Deployments
- **Preview**: Push to any branch other than `main` to create a preview URL.
- **Production**: Push to the `main` branch or run `.\vercel-deploy.ps1` and select option **2 (Production)**.

## 🔍 Monitoring & Logging

### 1. Health Monitoring
The application exposes a health check endpoint at:
`https://www.displaycellpros.com/api/health`
- **Use case**: Configure an external uptime monitor (e.g., UptimeRobot, Better Stack) to ping this URL every 5 minutes.
- **Expectation**: Status `200 OK` with JSON payload `{ "status": "OK", ... }`.

### 2. Log Analysis
Vercel logs are ephemeral. For production analysis:
- **Real-time**: Access the **Logs** tab in the Vercel Dashboard.
- **Historical**: Configure **Log Drains** in Project Settings to send logs to a persistent provider (e.g., Logflare, Datadog, or AWS CloudWatch).
- **Search Tip**: Filter for `[Global Error Handler]` to find uncaught exceptions.

## 🛡️ Security Best Practices

### 1. Rate Limiting
The API is protected by `express-rate-limit`.
- **Threshold**: 100 requests per 15 minutes per IP.
- **Adjustment**: If legitimate B2B partners are being blocked, adjust the `limiter` configuration in `server.ts`.

### 2. Secret Management
Never commit `.env` or `.env.local`. 
- **Rotation**: Rotate `OPENAI_API_KEY` and `STREAM_API_SECRET` every 6 months or immediately if a leak is suspected.
- **Update**: Use `vercel env set` or the Dashboard to update secrets in production.

## 🚀 Performance
- **Edge Caching**: The `/api/welcome`, `/api/movies`, and `/api/rds-status` routes are cached at the edge for 60 seconds.
- **Speed Insights**: Monitor the **Speed Insights** tab in Vercel to track real-world Core Web Vitals (LCP, FID, CLS).

---
**Emergency Contact**: Ryan (Lead Operator)
**Service Status**: [https://www.vercel-status.com](https://www.vercel-status.com)
