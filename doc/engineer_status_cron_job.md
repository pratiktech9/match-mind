# Engineer Status Update Cron Job

This document explains the automated engineer status update system that runs daily.

## Overview

The system automatically updates all engineer statuses based on their current dates and project assignments. This ensures that statuses remain accurate as time passes without manual intervention.

## Components

### 1. Rake Task (`lib/tasks/engineer_status.rake`)

**Main Tasks:**
- `rails engineers:update_statuses` - Updates all engineer statuses based on current dates
- `rails engineers:status_report` - Shows current status distribution and upcoming changes

**Usage:**
```bash
# Update all statuses manually
rails engineers:update_statuses

# View current status report
rails engineers:status_report
```

### 2. Background Job (`app/jobs/engineer_status_update_job.rb`)

The `EngineerStatusUpdateJob` runs the status update logic in the background and:
- Updates engineer statuses based on date calculations
- Creates notifications for significant status changes
- Logs all changes and errors
- Provides summary reports

### 3. Cron Configuration (`config/cron_schedule.yml`)

The job is scheduled to run daily at 6 AM:
```yaml
daily_status_update:
  cron: '0 6 * * *'
  class: 'EngineerStatusUpdateJob'
  description: 'Daily update of engineer statuses based on current dates'
```

## Status Calculation Logic

Engineer statuses are automatically calculated based on:

| Scenario | Status | Explanation |
|----------|--------|-------------|
| No current client & no return date | `available` | Ready for new projects |
| Has current client & notice/end date within 30 days | `rolling_off_soon` | Finishing soon |
| Has current client & no upcoming end dates | `on_project` | Currently working |
| No current client but has future return date | `on_project` | On break, not available |

## Key Date Fields

- **notice_date**: When engineer gave notice to leave current project
- **expected_end_date**: When current project is expected to end
- **return_date**: When engineer returns from break/vacation
- **current_client**: Current client assignment (empty if available)

## Notifications

The system creates notifications for:
- **Individual Changes**: When engineers become available or start rolling off
- **Daily Summary**: Overview of all status changes for the day

## Testing

**Test the job manually:**
```bash
# Run the job directly
rails runner "EngineerStatusUpdateJob.perform_now"

# Run comprehensive test
./bin/test_engineer_status_job

# Check current status
rails engineers:status_report
```

## Monitoring

**Check logs:**
```bash
# View Rails logs for job execution
tail -f log/development.log | grep "EngineerStatusUpdateJob"

# View cron job status (production)
# This depends on your cron management system (sidekiq-cron, whenever, etc.)
```

**Key metrics to monitor:**
- Number of engineers processed
- Number of status changes
- Error count
- Job execution time

## Production Deployment

1. **Verify cron scheduler is running** (e.g., sidekiq-cron, whenever gem)
2. **Test job in production console:**
   ```ruby
   EngineerStatusUpdateJob.perform_now
   ```
3. **Check notifications are being created**
4. **Monitor daily at 6 AM for automatic execution**

## Troubleshooting

**Common issues:**

1. **Job not running:**
   - Check cron scheduler is active
   - Verify job class exists and is loadable
   - Check Rails environment is correct

2. **Status not updating:**
   - Verify date fields are populated correctly
   - Check status calculation logic in `Engineer#calculate_status_from_dates_current`
   - Run manual test with specific engineer

3. **Notifications not created:**
   - Check Notification model exists and is working
   - Verify notification creation logic in job
   - Check database permissions

**Debug commands:**
```bash
# Test status calculation for specific engineer
rails console
engineer = Engineer.find(1)
engineer.calculate_status_from_dates_current

# Run job with verbose logging
RAILS_ENV=production rails runner "
  Rails.logger.level = Logger::DEBUG
  EngineerStatusUpdateJob.perform_now
"
```

## Future Enhancements

Potential improvements:
- Add configurable time windows (not just 30 days)
- Send email notifications for critical status changes
- Add status change history tracking
- Create dashboard widget for upcoming status changes
- Add status prediction based on historical patterns