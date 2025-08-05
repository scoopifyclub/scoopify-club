# 🤖 ScoopifyClub Automation Integration Guide

## Overview

Your ScoopifyClub app now includes advanced automation systems that make your business truly self-running. This guide will help you integrate and use these new features.

## 🚀 Quick Start

### 1. Access the Automation Dashboard

Navigate to your admin dashboard and click on the new **"Automation"** tab, or visit:
```
/admin/dashboard/automation
```

### 2. Run the Setup Script

```bash
node scripts/setup-automation-cron.js
```

This will generate:
- Cron job configurations
- Deployment instructions
- Environment variable templates
- Health check scripts

## 🎛️ Automation Dashboard Features

### System Overview Tab
- **Overall System Health**: Real-time status of all automation systems
- **Quick Actions**: Manual trigger buttons for each automation type
- **Key Metrics**: Weekly revenue, active customers, system performance

### Automation Systems Tab
- **Employee Recruitment**: Coverage gap analysis, job postings, application processing
- **Customer Acquisition**: Lead identification, marketing campaigns, conversion tracking
- **Business Intelligence**: Weekly/monthly reports, risk assessment, recommendations

### Business Analytics Tab
- **Growth Metrics**: Customer and revenue growth trends
- **Performance Metrics**: Service completion rates, employee productivity
- **Coverage Analysis**: Geographic coverage and gaps
- **Financial Metrics**: Revenue, costs, profitability analysis

### Recent Activity Tab
- **Activity Log**: Comprehensive log of all automation activities
- **Filtering**: Filter by activity type and date range
- **Real-time Updates**: Live updates as automation systems run

## 🔧 API Endpoints

### Automation Status
```bash
GET /api/admin/automation-status
```
Returns the status of all automation systems including last run time, next scheduled run, and health status.

### System Metrics
```bash
GET /api/admin/system-metrics
```
Returns comprehensive system performance metrics including revenue, customer growth, and automation-specific metrics.

### Recent Activity
```bash
GET /api/admin/recent-activity?limit=50&type=automation
```
Returns recent automation activities with optional filtering by type and limit.

### Manual Triggers
```bash
POST /api/admin/trigger-automation
Content-Type: application/json

{
  "automationType": "employee-recruitment|customer-acquisition|business-intelligence|all"
}
```
Manually triggers automation processes. Use `"all"` to trigger all systems at once.

## ⏰ Cron Job Configuration

### Recommended Schedule

| Automation System | Schedule | Description |
|------------------|----------|-------------|
| Weekly Service Creation | `0 9 * * 1` | Every Monday at 9 AM |
| Employee Recruitment | `0 10 * * 2` | Every Tuesday at 10 AM |
| Customer Acquisition | `0 11 * * 3` | Every Wednesday at 11 AM |
| Business Intelligence | `0 8 * * 6` | Every Saturday at 8 AM |
| Employee Payouts | `0 12 * * 5` | Every Friday at 12 PM |

### Deployment Options

#### Option 1: Traditional Cron (Linux/Unix)
```bash
# Add to your crontab
0 9 * * 1 curl -X POST "https://your-domain.com/api/cron/create-weekly-services"
0 10 * * 2 curl -X POST "https://your-domain.com/api/cron/automated-employee-recruitment"
0 11 * * 3 curl -X POST "https://your-domain.com/api/cron/automated-customer-acquisition"
0 8 * * 6 curl -X POST "https://your-domain.com/api/cron/business-intelligence"
0 12 * * 5 curl -X POST "https://your-domain.com/api/cron/process-employee-payouts"
```

#### Option 2: Vercel Cron Jobs
Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/create-weekly-services",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/cron/automated-employee-recruitment",
      "schedule": "0 10 * * 2"
    },
    {
      "path": "/api/cron/automated-customer-acquisition",
      "schedule": "0 11 * * 3"
    },
    {
      "path": "/api/cron/business-intelligence",
      "schedule": "0 8 * * 6"
    },
    {
      "path": "/api/cron/process-employee-payouts",
      "schedule": "0 12 * * 5"
    }
  ]
}
```

#### Option 3: GitHub Actions
Create `.github/workflows/automation.yml`:
```yaml
name: ScoopifyClub Automation

on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly services
    - cron: '0 10 * * 2' # Employee recruitment
    - cron: '0 11 * * 3' # Customer acquisition
    - cron: '0 8 * * 6'  # Business intelligence
    - cron: '0 12 * * 5' # Employee payouts

jobs:
  automation:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger automation
        run: |
          curl -X POST "https://your-domain.com/api/cron/${{ github.event.schedule }}"
```

## 🔍 Monitoring & Health Checks

### Automated Health Check
Run the generated health check script:
```bash
./scripts/health-check.sh
```

### Manual Health Check
```bash
# Check automation status
curl https://your-domain.com/api/admin/automation-status

# Check system metrics
curl https://your-domain.com/api/admin/system-metrics

# Check recent activity
curl https://your-domain.com/api/admin/recent-activity?limit=10
```

### Dashboard Monitoring
- Visit `/admin/dashboard/automation` regularly
- Check the "System Overview" tab for any alerts
- Review "Recent Activity" for automation performance
- Use "Business Analytics" to track growth trends

## 🛠️ Customization

### Environment Variables
Add these to your production environment:
```bash
# Automation Settings
AUTOMATION_ENABLED=true
RECRUITMENT_AUTOMATION_ENABLED=true
ACQUISITION_AUTOMATION_ENABLED=true
BUSINESS_INTELLIGENCE_ENABLED=true

# External Service APIs (optional)
INDEED_API_KEY=your-indeed-api-key
FACEBOOK_ADS_API_KEY=your-facebook-ads-api-key
GOOGLE_ADS_API_KEY=your-google-ads-api-key
```

### Customizing Automation Logic
The automation systems are designed to be easily customizable:

1. **Employee Recruitment**: Modify `src/app/api/cron/automated-employee-recruitment/route.js`
2. **Customer Acquisition**: Modify `src/app/api/cron/automated-customer-acquisition/route.js`
3. **Business Intelligence**: Modify `src/app/api/cron/business-intelligence/route.js`

### Adding New Automation Types
1. Create a new cron job endpoint
2. Add it to the automation status API
3. Update the AutomationDashboard component
4. Add it to the trigger automation API

## 🚨 Troubleshooting

### Common Issues

#### Automation Not Running
1. Check cron job configuration
2. Verify endpoint URLs are correct
3. Check server logs for errors
4. Test manual triggers from dashboard

#### Dashboard Not Loading
1. Verify authentication is working
2. Check API endpoints are accessible
3. Review browser console for errors
4. Ensure all dependencies are installed

#### Data Not Updating
1. Check database connectivity
2. Verify Prisma client is up to date
3. Review API response logs
4. Test individual API endpoints

### Debug Mode
Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

### Support
- Check the `PRODUCTION_READINESS.md` for system status
- Review server logs for detailed error information
- Test individual automation endpoints manually
- Use the health check script to diagnose issues

## 📈 Performance Optimization

### Database Optimization
- Ensure proper indexes on frequently queried fields
- Monitor query performance in production
- Consider read replicas for heavy analytics queries

### API Optimization
- Implement caching for frequently accessed data
- Use pagination for large datasets
- Consider background job processing for heavy operations

### Monitoring
- Set up alerts for automation failures
- Monitor system resource usage
- Track automation performance metrics
- Set up error reporting (e.g., Sentry)

## 🎯 Best Practices

1. **Start Small**: Begin with one automation system and gradually add others
2. **Monitor Closely**: Check the dashboard regularly during initial deployment
3. **Test Thoroughly**: Use manual triggers to test automation logic
4. **Backup Data**: Ensure database backups before major automation changes
5. **Document Changes**: Keep track of any customizations made to automation logic

## 🎉 Success Metrics

Track these metrics to measure automation success:

- **Employee Recruitment**: Time to fill coverage gaps, application quality
- **Customer Acquisition**: Lead conversion rates, cost per acquisition
- **Business Intelligence**: Report accuracy, actionable insights generated
- **Overall**: System uptime, automation success rate, manual intervention required

---

**Need Help?** Check the `PRODUCTION_READINESS.md` file for the latest system status and known issues. 