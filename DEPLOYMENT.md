# Nexa Platform - Deployment Guide

## Required Environment Variables for Cloud Run

### Database Configuration
```bash
DB_CONNECTION=pgsql
DB_HOST=/cloudsql/nexa-teste-1:southamerica-east1:nexa-db-1
DB_DATABASE=nexa
DB_USERNAME=nexa_user
DB_PASSWORD=nexa_password
```

### Application Configuration
```bash
APP_NAME=Nexa
APP_ENV=production
APP_KEY=base64:HsvE4mpj6nfyFJ/PRdK35TC5ZV4XTah4sgq40iYCBGI=
APP_DEBUG=false
APP_URL=https://nexa-backend2-1044548850970.southamerica-east1.run.app
FRONTEND_URL=https://nexa-frontend-1044548850970.southamerica-east1.run.app
APP_FRONTEND_URL=https://nexa-frontend-1044548850970.southamerica-east1.run.app
```

### Stripe Configuration
```bash
STRIPE_SECRET_KEY=[STRIPE_SECRET_KEY_HERE]
STRIPE_PUBLISHABLE_KEY=[STRIPE_PUBLISHABLE_KEY_HERE]
STRIPE_WEBHOOK_SECRET=[STRIPE_WEBHOOK_SECRET_HERE]
```

### AWS Configuration (for SES email)
```bash
AWS_ACCESS_KEY_ID=[AWS_ACCESS_KEY_ID_HERE]
AWS_SECRET_ACCESS_KEY=[AWS_SECRET_ACCESS_KEY_HERE]
AWS_DEFAULT_REGION=sa-east-1
```

## Cloud Run Service Configuration

### Backend Service: `nexa-backend2`
- **Region**: `southamerica-east1`
- **Cloud SQL Connection**: `nexa-teste-1:southamerica-east1:nexa-db-1`
- **Service Account**: `sa-backend-hml@nexa-teste-1.iam.gserviceaccount.com`
- **Memory**: 512Mi
- **CPU**: 1
- **Timeout**: 300s
- **Concurrency**: 80

### Deployment Command
```bash
gcloud run deploy nexa-backend2 \
  --source . \
  --region southamerica-east1 \
  --add-cloudsql-instances=nexa-teste-1:southamerica-east1:nexa-db-1 \
  --update-env-vars="[ENV_VARS_HERE]" \
  --quiet
```

## Security Best Practices

### ✅ DO
- Store all sensitive credentials in Cloud Run environment variables
- Use Cloud SQL Unix socket connections (`/cloudsql/...`)
- Keep Stripe keys in test mode until production ready
- Rotate AWS credentials periodically
- Use service accounts with minimal required permissions

### ❌ DON'T
- Hardcode API keys in source code
- Commit `.env` files with production credentials
- Use `APP_DEBUG=true` in production
- Expose debug routes in production deployments

## Cloud SQL User Management

### List Users
```bash
gcloud sql users list --instance=nexa-db-1
```

### Reset Password
```bash
gcloud sql users set-password nexa_user \
  --instance=nexa-db-1 \
  --password=nexa_password
```

## Troubleshooting

### Login 500 Error
- **Cause**: Database connection failure
- **Check**: Verify `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` in Cloud Run env vars
- **Fix**: Ensure Cloud SQL instance is attached and credentials match

### Stripe "No API key provided"
- **Cause**: Missing `STRIPE_SECRET_KEY` environment variable
- **Check**: Verify env var is set in Cloud Run
- **Fix**: Update service with correct Stripe key

### Container Startup Failure
- **Cause**: Dockerfile errors or missing dependencies
- **Check**: Cloud Build logs for build errors
- **Fix**: Test Dockerfile locally, ensure all dependencies are installed

## Maintenance

### Updating Environment Variables
```bash
gcloud run services update nexa-backend2 \
  --region southamerica-east1 \
  --update-env-vars="KEY=value" \
  --quiet
```

### Viewing Logs
```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=nexa-backend2" \
  --limit 50 \
  --format=json
```

### Checking Service Status
```bash
gcloud run services describe nexa-backend2 \
  --region southamerica-east1 \
  --format=json
```
