# Google Cloud Deployment Guide for EcoRide

## Prerequisites
- Google Cloud Project: `trusty-diorama-475905-c3`
- `gcloud` CLI installed and authenticated
- Node.js 18+ and npm

## Step 1: Setup Google Cloud Services

### 1.1 Enable Required APIs
```bash
gcloud services enable \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  pubsub.googleapis.com \
  firestore.googleapis.com \
  compute.googleapis.com \
  aiplatform.googleapis.com
```

### 1.2 Create Cloud SQL Instance (PostgreSQL)
```bash
gcloud sql instances create ecoride-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=CHANGE_ME

# Create database
gcloud sql databases create ecoride --instance=ecoride-db

# Create user
gcloud sql users create ecoride-user \
  --instance=ecoride-db \
  --password=CHANGE_ME
```

### 1.3 Create Memorystore (Redis)
```bash
gcloud redis instances create ecoride-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

### 1.4 Create Pub/Sub Topics and Subscriptions
```bash
# Location updates
gcloud pubsub topics create driver-locations
gcloud pubsub subscriptions create location-updates-sub \
  --topic=driver-locations

# Ride requests
gcloud pubsub topics create ride-requests
gcloud pubsub subscriptions create ride-requests-sub \
  --topic=ride-requests
```

### 1.5 Initialize Firestore
```bash
# Create Firestore database (Native mode)
gcloud firestore databases create --region=us-central1
```

## Step 2: Run Database Migrations

### 2.1 Connect via Cloud SQL Proxy
```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Run proxy (in separate terminal)
./cloud-sql-proxy trusty-diorama-475905-c3:us-central1:ecoride-db
```

### 2.2 Run Migrations
```bash
cd /workspaces/Echo-Ride/EcoRideConnect

# Set environment variables
export CLOUD_SQL_HOST=127.0.0.1
export CLOUD_SQL_PORT=5432
export CLOUD_SQL_USER=ecoride-user
export CLOUD_SQL_PASSWORD=CHANGE_ME
export CLOUD_SQL_DATABASE=ecoride

# Run migration script
npm run migrate
```

## Step 3: Configure Environment Variables

### 3.1 Copy Production Template
```bash
cp .env.production .env
```

### 3.2 Update `.env` with Your Values
```bash
# Google Cloud Project
GOOGLE_CLOUD_PROJECT=trusty-diorama-475905-c3

# Get Redis host
REDIS_HOST=$(gcloud redis instances describe ecoride-redis \
  --region=us-central1 --format='get(host)')

# Get Cloud SQL connection name
CLOUD_SQL_CONNECTION=$(gcloud sql instances describe ecoride-db \
  --format='get(connectionName)')

# Update .env with these values
echo "REDIS_HOST=$REDIS_HOST" >> .env
echo "CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_CONNECTION" >> .env
```

## Step 4: Deploy Application

### 4.1 Deploy to Cloud Run
```bash
# Build container
gcloud builds submit --tag gcr.io/trusty-diorama-475905-c3/ecoride-app

# Deploy
gcloud run deploy ecoride-app \
  --image gcr.io/trusty-diorama-475905-c3/ecoride-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=trusty-diorama-475905-c3 \
  --add-cloudsql-instances $CLOUD_SQL_CONNECTION_NAME \
  --vpc-connector ecoride-connector
```

### 4.2 Create VPC Connector (for Memorystore access)
```bash
gcloud compute networks vpc-access connectors create ecoride-connector \
  --region us-central1 \
  --range 10.8.0.0/28
```

## Step 5: Local Development Setup

### 5.1 Install Dependencies
```bash
cd /workspaces/Echo-Ride/EcoRideConnect
npm install
```

### 5.2 Start Cloud SQL Proxy (Terminal 1)
```bash
./cloud-sql-proxy trusty-diorama-475905-c3:us-central1:ecoride-db
```

### 5.3 Start Redis Tunnel (Terminal 2)
```bash
# Create SSH tunnel to Memorystore
gcloud compute ssh redis-tunnel-vm \
  --zone us-central1-a \
  -- -N -L 6379:$REDIS_HOST:6379
```

### 5.4 Start Development Server (Terminal 3)
```bash
npm run dev
```

## Step 6: Testing End-to-End Flow

### 6.1 Test Rider Flow
```bash
# Open in browser
http://localhost:5000/rider/dashboard-ola

# Actions:
# 1. Login as rider
# 2. Set pickup and drop locations
# 3. Request ride
# 4. Check Pub/Sub topic receives message
```

### 6.2 Test Driver Flow
```bash
# Open in another browser window
http://localhost:5000/driver/dashboard-ola

# Actions:
# 1. Login as driver
# 2. Go online
# 3. Receive ride request
# 4. Accept ride
# 5. Complete ride
```

### 6.3 Verify Pub/Sub Messages
```bash
# Check location updates topic
gcloud pubsub topics publish driver-locations \
  --message='{"driverId":"test","lat":37.7749,"lng":-122.4194,"city":"SF","timestamp":1234567890}'

# Check ride requests topic
gcloud pubsub topics publish ride-requests \
  --message='{"id":"ride123","riderId":"rider1","vehicleType":"car"}'
```

## Step 7: Monitoring & Logs

### 7.1 View Cloud Run Logs
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

### 7.2 Monitor Pub/Sub
```bash
# Check topic metrics
gcloud pubsub topics describe driver-locations

# Check subscription backlog
gcloud pubsub subscriptions describe location-updates-sub
```

### 7.3 Monitor Cloud SQL
```bash
# Check database connections
gcloud sql operations list --instance=ecoride-db
```

## Troubleshooting

### Issue: Cannot connect to Cloud SQL
```bash
# Check Cloud SQL Proxy is running
ps aux | grep cloud-sql-proxy

# Verify instance is running
gcloud sql instances describe ecoride-db
```

### Issue: Pub/Sub messages not received
```bash
# Check subscription exists
gcloud pubsub subscriptions list

# Pull messages manually to test
gcloud pubsub subscriptions pull location-updates-sub --auto-ack
```

### Issue: Redis connection fails
```bash
# Check Memorystore instance
gcloud redis instances describe ecoride-redis --region=us-central1

# Test connection
redis-cli -h $REDIS_HOST ping
```

## Production Checklist

- [ ] Set strong passwords for Cloud SQL
- [ ] Enable Cloud SQL backups
- [ ] Configure VPC firewall rules
- [ ] Set up Cloud Monitoring alerts
- [ ] Enable Cloud Armor for DDoS protection
- [ ] Configure SSL certificates
- [ ] Set up Cloud CDN for static assets
- [ ] Enable audit logging
- [ ] Configure IAM roles properly
- [ ] Set up automated backups
- [ ] Test disaster recovery procedures

## Cost Optimization

1. **Cloud SQL**: Use `db-f1-micro` for development ($7/month)
2. **Memorystore**: 1GB instance (~$30/month)
3. **Pub/Sub**: First 10GB free per month
4. **Firestore**: 1GB storage free, 50K reads/day free
5. **Cloud Run**: Pay per use (very cheap for low traffic)

Total estimated cost for low-traffic development: **~$50/month**

## Next Steps

1. Configure Google Pay merchant account
2. Set up Vertex AI endpoint for ML matching
3. Enable BigQuery for analytics
4. Configure Cloud Storage for driver documents
5. Set up Cloud Functions for automated tasks
6. Implement Cloud Tasks for scheduled jobs
