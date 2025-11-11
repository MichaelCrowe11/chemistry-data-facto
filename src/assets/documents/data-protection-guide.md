# Data Protection & Backup System Guide

## Overview

Crowe Code's Data Protection system provides enterprise-grade backup, restore, and data integrity features to ensure your work is never lost. With automatic scheduling, version control, and integrity verification, your research and code are always protected.

## Key Features

### 1. Manual & Automatic Backups

**Manual Backups:**
- Create on-demand snapshots
- Custom descriptions
- Immediate protection

**Automatic Backups:**
- Configurable schedule (hourly, daily, weekly)
- Retention policies
- Maximum backup limits
- Silent background operation

### 2. Comprehensive Data Capture

Each backup includes:
- ✅ All user files and code
- ✅ Complete KV store data
- ✅ Asset metadata and references
- ✅ User settings and preferences
- ✅ Experiment tracking data
- ✅ Version information
- ✅ Integrity checksums

### 3. Integrity Verification

Every backup:
- Generates cryptographic checksum
- Validates on restore
- Detects corruption
- Ensures data fidelity

### 4. Import/Export Capabilities

**Export:**
- Full JSON format
- Human-readable structure
- Portable across systems
- Archive-ready

**Import:**
- Validate before restore
- Checksum verification
- Merge or replace options
- Error handling

### 5. Smart Retention

**Configurable policies:**
- Retention period (days)
- Maximum backup count
- Automatic cleanup
- Priority preservation

## Getting Started

### Creating Your First Backup

1. **Open Data Protection Panel**
   - Click shield icon in toolbar
   - Located near top-right corner

2. **Click "Create Backup"**
   - Green button in panel

3. **Enter Description**
   - Be specific: "Before major refactor"
   - Include context: "Pre-VR implementation"
   - Add date if helpful

4. **Confirm Creation**
   - Review file count
   - Verify user info
   - Click "Create Backup"

5. **Verify Success**
   - Backup appears in history
   - Green checkmark confirms
   - Stats update automatically

### Configuring Automatic Backups

1. **Open Schedule Settings**
   - Click gear icon in Data Protection
   - Access backup schedule dialog

2. **Enable Auto Backup**
   - Toggle switch on

3. **Set Frequency**
   - Hourly: Every hour
   - Daily: Once per day
   - Weekly: Once per week
   - Manual: Disable auto-backup

4. **Configure Retention**
   - **Retention Days**: How long to keep backups
   - **Max Backups**: Maximum number to maintain
   - Example: 30 days, max 10 backups

5. **Save Settings**
   - Click "Done"
   - System begins auto-backup schedule

## Backup Workflows

### Workflow 1: Before Major Changes

**Scenario:** About to refactor critical code

```
1. Click "Create Backup"
2. Description: "Before authentication refactor"
3. Review file count (verify all files included)
4. Create backup
5. Proceed with changes confidently
```

### Workflow 2: Daily Work Protection

**Scenario:** Want automatic daily protection

```
1. Open backup schedule
2. Enable auto backup
3. Set frequency: Daily
4. Set retention: 30 days
5. Set max backups: 10
6. System auto-creates daily snapshots
```

### Workflow 3: Sharing Work Environment

**Scenario:** Need to share exact setup with collaborator

```
1. Create backup with description
2. Export backup (download icon)
3. JSON file downloads
4. Share file securely
5. Collaborator imports using "Import Backup"
6. Environment perfectly replicated
```

### Workflow 4: Disaster Recovery

**Scenario:** Accidentally deleted important files

```
1. Open Data Protection panel
2. Browse backup history
3. Find backup before deletion
4. Click restore icon
5. Confirm restore operation
6. Reload page to see restored data
```

## Advanced Features

### Backup Metadata

Each backup stores:

```json
{
  "id": "unique-backup-id",
  "timestamp": "2024-01-15T10:30:00Z",
  "userId": "user-github-id",
  "userName": "username",
  "description": "Before major refactor",
  "fileCount": 24,
  "dataSize": 1048576,
  "assetCount": 12,
  "version": "1.0.0",
  "autoBackup": false,
  "tags": ["manual"]
}
```

### Checksum Verification

**How it works:**
1. Generate hash of all backup data
2. Store checksum with backup
3. On restore, recalculate hash
4. Compare hashes
5. Reject if mismatch detected

**Benefits:**
- Detect corruption
- Ensure integrity
- Prevent partial restores
- Maintain data fidelity

### Smart Retention Policies

**Retention by age:**
- Automatically delete backups older than X days
- Preserves recent work
- Prevents storage bloat

**Retention by count:**
- Keep only last N backups
- Oldest deleted first
- Configurable limit

**Combined policies:**
- Both age AND count limits
- Whichever triggers first
- Maximum protection with minimal storage

## Best Practices

### When to Create Manual Backups

✅ **Always backup before:**
- Major refactors
- Dependency updates
- Architecture changes
- Experimental features
- Client demonstrations
- Publication preparation

✅ **Consider backing up:**
- End of work sessions
- Before breaks
- After major accomplishments
- Before sharing work
- Prior to deployments

### Backup Descriptions

**Good descriptions:**
- "Pre-ML model integration"
- "Working state - 2024-01-15"
- "Before removing legacy code"
- "Final version for paper submission"

**Avoid vague descriptions:**
- "Backup 1"
- "Test"
- "asdf"
- "Latest"

### Retention Configuration

**For active development:**
- Daily backups
- 14-30 day retention
- 10-15 max backups

**For stable projects:**
- Weekly backups
- 60-90 day retention
- 5-10 max backups

**For critical research:**
- Daily backups
- 90+ day retention
- 20+ max backups
- Export monthly archives

### Export Strategy

**When to export:**
- End of project phases
- Before long breaks
- For archival purposes
- Sharing with collaborators
- Moving between systems

**Export naming:**
- Include date: `backup-2024-01-15.json`
- Add context: `backup-ml-experiment-final.json`
- Use versioning: `backup-v2.3.json`

## Security Considerations

### Data Privacy

- Backups stored locally
- No cloud transmission
- User-owned data
- Secure KV storage

### Access Control

- User-specific backups
- Owner-only access
- No sharing by default
- Export requires explicit action

### Integrity Protection

- Checksum validation
- Corruption detection
- Verified restores
- Audit trail maintained

## Troubleshooting

### Backup Won't Restore

**Possible causes:**
- Checksum mismatch → Data corrupted
- Invalid format → Backup file damaged
- Storage full → Clear space

**Solutions:**
- Try different backup
- Re-export and re-import
- Contact support

### Auto-Backup Not Working

**Check:**
- Schedule enabled
- Frequency configured
- Browser not sleeping
- Storage available

**Solutions:**
- Re-enable schedule
- Verify settings
- Check browser console
- Create manual backup

### Export File Too Large

**Solutions:**
- Clean old files before backup
- Remove large assets
- Create targeted backup
- Compress JSON file

## Statistics & Monitoring

### Backup Statistics Dashboard

Monitor your protection status:

- **Total Backups**: Count of all backups
- **Auto Backups**: Automatically created
- **Manual Backups**: User-created
- **Total Size**: Storage used
- **Oldest/Newest**: Date range

### Health Indicators

✅ **Healthy system:**
- Regular backups created
- No restore failures
- Checksums verify
- Storage within limits

⚠️ **Attention needed:**
- No recent backups
- Failed restores
- Checksum errors
- Storage near limit

## Integration with Other Features

### Asset Management

- Assets included in backups
- Protection status preserved
- Metadata maintained
- Tags and descriptions saved

### Experiment Tracking

- Experiments included
- Results preserved
- Parameters maintained
- History retained

### Reproducibility Engine

- Environment data captured
- Dependencies recorded
- Configuration saved
- Perfect reproduction

## API Reference

For programmatic access:

```typescript
import { dataProtection } from '@/lib/data-protection'

// Create backup
const snapshot = await dataProtection.createBackup(
  userId,
  userName,
  description,
  files,
  autoBackup
)

// Get backups
const backups = await dataProtection.getBackups()

// Restore backup
await dataProtection.restoreBackup(snapshot)

// Export backup
const json = await dataProtection.exportBackup(snapshot)

// Import backup
await dataProtection.importBackup(jsonString)

// Get statistics
const stats = await dataProtection.getBackupStats()
```

## Future Enhancements

Planned features:
- Cloud backup integration
- Differential backups (save only changes)
- Backup comparison tools
- Scheduled restore testing
- Backup encryption
- Multi-device sync
- Collaborative backup sharing
- AI-powered backup suggestions

## Support

For help:
- Check in-app Data Protection panel
- Review `/src/lib/data-protection.ts`
- Export backup for debugging
- Contact platform support

---

**Remember:** Your data is valuable. Regular backups ensure your research and code are always protected. Configure auto-backup today!
