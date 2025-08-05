#!/bin/bash

# ScoopifyClub Automation Health Check Script
# Run this script to verify all automation systems are working

echo "🔍 Checking ScoopifyClub Automation Systems..."
echo "============================================="

BASE_URL="https://your-domain.com"

# Check automation status
echo "\n📊 Checking automation status..."
curl -s "${BASE_URL}/api/admin/automation-status" | jq '.'

# Check system metrics
echo "\n📈 Checking system metrics..."
curl -s "${BASE_URL}/api/admin/system-metrics" | jq '.'

# Check recent activity
echo "\n📝 Checking recent activity..."
curl -s "${BASE_URL}/api/admin/recent-activity?limit=5" | jq '.'

# Test manual trigger (optional)
echo "\n🤖 Testing manual trigger (employee recruitment)..."
curl -s -X POST "${BASE_URL}/api/admin/trigger-automation" \
  -H "Content-Type: application/json" \
  -d '{"automationType": "employee-recruitment"}' | jq '.'

echo "\n✅ Health check complete!"
