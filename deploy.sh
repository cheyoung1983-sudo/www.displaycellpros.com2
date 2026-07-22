#!/bin/bash
# ==============================================================================
# DISPlAY & CELL PROS - GOOGLE CLOUD RUN DEPLOYMENT AUTOMATION SCRIPT
# ==============================================================================
# This script automates container builds via Cloud Build and deploys to Cloud Run with:
# - Secure Cloud SQL Connection mappings
# - Automated secret extraction from GCP Secret Manager
# - Environment configuration binding
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# --- 1. Variables - Update these to match your GCP project specs! ---
PROJECT_ID="your-project-id"                                     # Your GCP Project ID
REGION="us-central1"                                            # Google Cloud Deployment Region
REPO_NAME="web-apps"                                            # Artifact Registry Repository Name
IMAGE_NAME="vite-dynamic-site"                                  # Name of your Docker image container
SERVICE_NAME="vite-site-service"                                # Deployment service name on Cloud Run
INSTANCE_CONNECTION_NAME="project:region:instance-name"         # Cloud SQL Connection String (From Cloud SQL page)
DB_NAME="your_db"                                               # Target PostgreSQL database name
DB_USER="your_user"                                             # Database master username
SECRET_NAME="DB_PASSWORD_SECRET"                                # GCP Secret Manager Secret Name for Database Password

echo "=============================================================================="
echo "🚀 Pre-flights: Verifying setup configurations..."
echo "=============================================================================="
echo "Project ID:           $PROJECT_ID"
echo "Target Region:        $REGION"
echo "Artifact Repository:  $REPO_NAME"
echo "Service Name:         $SERVICE_NAME"
echo "Cloud SQL Instance:   $INSTANCE_CONNECTION_NAME"
echo "=============================================================================="

# Confirm with user before firing deployment (optional but recommended safety)
read -p "Do you want to proceed with building and deploying? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment canceled."
    exit 1
fi

# Ensure correct project context
echo "🎯 Setting active GCP project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# --- 2. Build the image in the cloud using Google Cloud Build ---
echo "🏗️  Starting Cloud Build process... Packaging source into remote Docker layer."
gcloud builds submit --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

# --- 3. Deploy to Google Cloud Run ---
echo "🌐 Deploying service '$SERVICE_NAME' securely to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest" \
  --region "$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$INSTANCE_CONNECTION_NAME" \
  --set-env-vars="INSTANCE_CONNECTION_NAME=${INSTANCE_CONNECTION_NAME},DB_NAME=${DB_NAME},DB_USER=${DB_USER}" \
  --set-secrets="DB_PASSWORD=${SECRET_NAME}:latest"

echo "=============================================================================="
echo "🎉 DEPLOYMENT SUCCEEDED!"
echo "=============================================================================="
echo "The secure full-stack Vite + Express application is now live on Cloud Run!"
echo "Database mapped:   $DB_NAME"
echo "Cloud SQL Connect: $INSTANCE_CONNECTION_NAME"
echo "=============================================================================="
