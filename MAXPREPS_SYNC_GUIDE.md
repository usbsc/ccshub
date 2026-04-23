# MaxPreps Data Sync Guide

This guide explains how to sync team data from MaxPreps to keep CCSHUB current.

## Quick Start

### Manual Sync
To manually sync all MaxPreps data:

```bash
npm run sync:maxpreps
```

### Dry Run (Preview Changes)
To see what would be updated without making changes:

```bash
npm run sync:maxpreps:dry
```

### Skip Backup
To skip creating a backup before syncing:

```bash
npm run sync:maxpreps:no-backup
```

## What Gets Synced

The master sync script (`sync-maxpreps-all.mjs`) orchestrates these updates in order:

1. **Teams** - School names, mascots, and basic info
2. **Rosters** - Player names, numbers, and positions
3. **Games** - Game schedules, scores, and results
4. **Logos** - Team logos and images
5. **Uniforms & Rankings** - Uniform colors and team rankings

## How It Works

The sync process:
1. Creates a backup of current data files
2. Runs each update script sequentially
3. Validates the results
4. Builds the project to check for regressions
5. Prints a summary report

## Backup & Recovery

### Viewing Backups
Backups are stored in `.maxpreps-backups/` directory with timestamps:
```
.maxpreps-backups/
├── backup-2026-04-22T05-02-50/
│   ├── teams.ts
│   ├── teams.maxpreps.generated.ts
│   └── players.maxpreps.ts
├── backup-2026-04-22T06-15-23/
│   ├── ...
```

### Recovering from Backup
If you need to restore data:

```bash
# Copy backup files back
cp .maxpreps-backups/backup-TIMESTAMP/teams.ts src/app/data/
cp .maxpreps-backups/backup-TIMESTAMP/teams.maxpreps.generated.ts src/app/data/
cp .maxpreps-backups/backup-TIMESTAMP/players.maxpreps.ts src/app/data/
```

## Automated Scheduled Syncs

### GitHub Actions (Recommended)

The project includes a GitHub Actions workflow that can automatically sync data on a schedule.

**File:** `.github/workflows/update-maxpreps.yml`

To enable automated syncs:

1. Check that the workflow file exists and is configured
2. Enable Actions in your GitHub repository settings
3. The workflow will run on schedule (configure schedule in workflow file)

### Cron Jobs (Local/Server)

To set up automated syncs on your server:

```bash
# Edit crontab
crontab -e

# Add a line to sync daily at 2 AM:
0 2 * * * cd /path/to/ccshub && npm run sync:maxpreps >> /var/log/ccshub-sync.log 2>&1

# Or weekly on Sundays:
0 3 * * 0 cd /path/to/ccshub && npm run sync:maxpreps >> /var/log/ccshub-sync.log 2>&1
```

## Individual Script Usage

You can also run individual update scripts if needed:

```bash
# Update teams only
npm run update:maxpreps-teams

# Update rosters only
npm run update:maxpreps-rosters

# Update both (legacy combined command)
npm run update:maxpreps

# Update games (manual script)
node scripts/update-maxpreps-games.mjs

# Update logos
node scripts/update-team-logos.mjs

# Update uniforms/rankings
node scripts/update-uniforms-and-rankings.mjs
```

## Troubleshooting

### Script Hangs
MaxPreps syncs can take several minutes due to web scraping. If a script appears to hang:
- Wait at least 5 minutes before interrupting
- Check your internet connection
- MaxPreps may be blocking requests (rate limiting)
- Try again later

### Build Fails After Sync
If the build fails after a sync:
1. Check the error message in the console
2. There may be invalid data from MaxPreps
3. Restore from backup: `cp .maxpreps-backups/backup-TIMESTAMP/* src/app/data/`
4. Investigate the MaxPreps source data

### Data Not Updating
If data appears unchanged:
1. The sync script may have skipped files (check for errors)
2. MaxPreps may not have the latest information
3. Team matching may have failed for some teams
4. Run with `npm run sync:maxpreps:dry` to preview changes

## Data Files Reference

### teams.ts
Main teams database. Contains:
- Team ID and name
- Mascot name
- School info and location
- Primary and secondary colors
- Conference and division
- Key players and coaches

### teams.maxpreps.generated.ts
Generated from MaxPreps scraping. Contains:
- Teams matched from MaxPreps
- Confidence scores for matches
- MaxPreps URLs for reference

### players.maxpreps.ts
Player data from MaxPreps rosters. Contains:
- Player names and numbers
- Positions and stats
- Year/grade

### games/[YEAR].ts
Game schedules, scores, and results by season

## Performance Notes

- Initial sync: 10-30 minutes (first time data is larger)
- Regular syncs: 5-15 minutes
- Network-dependent (depends on MaxPreps server response times)
- Rate limiting: MaxPreps may slow down if too many requests

## Support

For issues with MaxPreps data:
1. Check if MaxPreps website is accessible
2. Verify team names match MaxPreps format
3. Check the backup files to understand what changed
4. Review error messages in the sync output

For code issues:
1. Check console output for specific errors
2. Ensure Node.js 18+ is installed
3. Run `npm install` to ensure dependencies are updated
