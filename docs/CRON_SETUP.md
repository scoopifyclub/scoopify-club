# Cron Jobs Setup for Scoopify Club

## Overview
Scoopify Club uses automated cron jobs for business operations. Since Vercel's cron feature requires a paid plan, we provide multiple setup options.

## Option 1: Vercel Cron Jobs (Paid Plan - Recommended)

If you have a Vercel Pro plan or higher, you can use the built-in cron functionality:

### 1. Upgrade to Vercel Pro
- Go to your Vercel dashboard
- Upgrade to Pro plan ($20/month)
- This enables cron job functionality

### 2. Configure Cron Jobs
Add this to your `vercel.json`:

```json
{
  "version": 2,
  "functions": {
    "src/app/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "cron": [
    {
      "path": "/api/cron/create-weekly-services",
      "schedule": "0 6 * * 1"
    },
    {
      "path": "/api/cron/process-employee-payouts",
      "schedule": "0 9 * * 5"
    },
    {
      "path": "/api/cron/automated-employee-recruitment",
      "schedule": "0 10 * * 1"
    },
    {
      "path": "/api/cron/automated-customer-acquisition",
      "schedule": "0 11 * * 2"
    },
    {
      "path": "/api/cron/business-intelligence",
      "schedule": "0 12 * * 1"
    }
  ]
}
```

## Option 2: External Cron Service (Free - Alternative)

### Using Cron-job.org (Free)

1. **Sign up at [cron-job.org](https://cron-job.org)**
2. **Create cron jobs for each endpoint:**

#### Weekly Services Creation
- **URL**: `https://your-domain.vercel.app/api/cron/create-weekly-services`
- **Schedule**: Every Monday at 6:00 AM
- **Cron Expression**: `0 6 * * 1`

#### Employee Payout Processing
- **URL**: `https://your-domain.vercel.app/api/cron/process-employee-payouts`
- **Schedule**: Every Friday at 9:00 AM
- **Cron Expression**: `0 9 * * 5`

#### Automated Employee Recruitment
- **URL**: `https://your-domain.vercel.app/api/cron/automated-employee-recruitment`
- **Schedule**: Every Monday at 10:00 AM
- **Cron Expression**: `0 10 * * 1`

#### Automated Customer Acquisition
- **URL**: `https://your-domain.vercel.app/api/cron/automated-customer-acquisition`
- **Schedule**: Every Tuesday at 11:00 AM
- **Cron Expression**: `0 11 * * 2`

#### Business Intelligence
- **URL**: `https://your-domain.vercel.app/api/cron/business-intelligence`
- **Schedule**: Every Monday at 12:00 PM
- **Cron Expression**: `0 12 * * 1`

### Using GitHub Actions (Free)

Create `.github/workflows/cron.yml`:

```yaml
name: Automated Business Operations

on:
  schedule:
    # Weekly Services - Every Monday at 6:00 AM UTC
    - cron: '0 6 * * 1'
    # Employee Payouts - Every Friday at 9:00 AM UTC
    - cron: '0 9 * * 5'
    # Employee Recruitment - Every Monday at 10:00 AM UTC
    - cron: '0 10 * * 1'
    # Customer Acquisition - Every Tuesday at 11:00 AM UTC
    - cron: '0 11 * * 2'
    # Business Intelligence - Every Monday at 12:00 PM UTC
    - cron: '0 12 * * 1'

jobs:
  weekly-services:
    if: github.event.schedule == '0 6 * * 1'
    runs-on: ubuntu-latest
    steps:
      - name: Create Weekly Services
        run: |
          curl -X POST https://your-domain.vercel.app/api/cron/create-weekly-services

  employee-payouts:
    if: github.event.schedule == '0 9 * * 5'
    runs-on: ubuntu-latest
    steps:
      - name: Process Employee Payouts
        run: |
          curl -X POST https://your-domain.vercel.app/api/cron/process-employee-payouts

  employee-recruitment:
    if: github.event.schedule == '0 10 * * 1'
    runs-on: ubuntu-latest
    steps:
      - name: Automated Employee Recruitment
        run: |
          curl -X POST https://your-domain.vercel.app/api/cron/automated-employee-recruitment

  customer-acquisition:
    if: github.event.schedule == '0 11 * * 2'
    runs-on: ubuntu-latest
    steps:
      - name: Automated Customer Acquisition
        run: |
          curl -X POST https://your-domain.vercel.app/api/cron/automated-customer-acquisition

  business-intelligence:
    if: github.event.schedule == '0 12 * * 1'
    runs-on: ubuntu-latest
    steps:
      - name: Business Intelligence
        run: |
          curl -X POST https://your-domain.vercel.app/api/cron/business-intelligence
```

## Option 3: Manual Testing

For testing purposes, you can manually trigger the cron jobs:

```bash
# Test weekly services creation
curl -X POST https://your-domain.vercel.app/api/cron/create-weekly-services

# Test employee payout processing
curl -X POST https://your-domain.vercel.app/api/cron/process-employee-payouts

# Test automated employee recruitment
curl -X POST https://your-domain.vercel.app/api/cron/automated-employee-recruitment

# Test automated customer acquisition
curl -X POST https://your-domain.vercel.app/api/cron/automated-customer-acquisition

# Test business intelligence
curl -X POST https://your-domain.vercel.app/api/cron/business-intelligence
```

## Cron Job Details

### 1. Weekly Services Creation (`/api/cron/create-weekly-services`)
- **Purpose**: Automatically creates service appointments for the upcoming week
- **Schedule**: Every Monday at 6:00 AM
- **Function**: Generates recurring service bookings

### 2. Employee Payout Processing (`/api/cron/process-employee-payouts`)
- **Purpose**: Processes weekly payments to employees
- **Schedule**: Every Friday at 9:00 AM
- **Function**: Calculates and transfers earnings via Stripe

### 3. Automated Employee Recruitment (`/api/cron/automated-employee-recruitment`)
- **Purpose**: Identifies areas needing more employees
- **Schedule**: Every Monday at 10:00 AM
- **Function**: Analyzes workload and sends recruitment emails

### 4. Automated Customer Acquisition (`/api/cron/automated-customer-acquisition`)
- **Purpose**: Targets potential customers in service areas
- **Schedule**: Every Tuesday at 11:00 AM
- **Function**: Sends promotional emails and referral invitations

### 5. Business Intelligence (`/api/cron/business-intelligence`)
- **Purpose**: Generates weekly business reports
- **Schedule**: Every Monday at 12:00 PM
- **Function**: Creates performance analytics and insights

## Security Considerations

1. **Authentication**: All cron endpoints require proper authentication
2. **Rate Limiting**: Implemented to prevent abuse
3. **Logging**: All cron job executions are logged
4. **Error Handling**: Comprehensive error handling and notifications

## Monitoring

- Check Vercel function logs for cron job execution
- Monitor database for new records created by cron jobs
- Set up alerts for failed cron job executions
- Review business intelligence reports weekly

## Troubleshooting

### Common Issues:
1. **Cron jobs not running**: Check Vercel plan and cron configuration
2. **Authentication errors**: Verify API keys and secrets
3. **Database connection issues**: Check DATABASE_URL configuration
4. **Stripe payment failures**: Verify Stripe API keys

### Debug Steps:
1. Check Vercel function logs
2. Test endpoints manually
3. Verify environment variables
4. Check database connectivity
5. Review error logs

## Next Steps

1. Choose your preferred cron setup method
2. Configure the selected option
3. Test all cron endpoints manually
4. Monitor the first automated executions
5. Set up alerts and monitoring
6. Review and optimize based on performance 