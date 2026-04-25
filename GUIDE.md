# Toby's Life Planner - User Guide

## Getting Started

Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).

For the best experience, run a local server:
```bash
node start.js
```
Then visit http://localhost:3000

## Core Concepts

The planner is organized into **three layers** based on time horizon:

### Layer 1: Today (Horizontal Strip)
Shows all tasks due today sorted by time. Quick view of your day.
- Click a task card to toggle completion
- Click the edit icon (pencil) to modify details
- Completed tasks appear faded with strikethrough

### Layer 2: This Week (7-Day Grid)
Scroll horizontally through the next 7 days.
- Each day shows its tasks in order
- Blue border highlights today
- Click any task to mark done or edit

### Layer 3: Horizon (30+ Days)
Table view of future tasks. Helps with long-term planning.
- Sort by date automatically
- Shows category badges and priority dots
- Click a row to edit that task

### Awaiting Response
Special red panel for tasks blocked on others.
- High-priority visibility
- Shows due date and notes
- Delete when resolved

## Managing Tasks

### Create a Task
1. Click **New Task** button
2. Fill in title (required)
3. Set date, time (optional)
4. Choose category and priority
5. Add notes for details
6. Click **Save Task**

### Edit a Task
- Click the pencil icon on any task card
- Or click a row in the Horizon table
- Modify fields and save

### Complete a Task
- Click anywhere on the task card (except buttons)
- The checkbox toggles automatically

### Delete a Task
- In Today/Week views: delete via edit modal (coming soon) or use browser console
- In Awaiting panel: click the X that appears on hover
- Confirm deletion in the dialog

### Clear Completed
Bulk remove all completed tasks from the system.
- Click **Clear Completed** in header
- Confirmation required

### Export Data
Download your tasks as a JSON file for backup.
- Click **Export** in header
- File saves as `life-planner-YYYY-MM-DD.json`

## Categories

| Category | Color | Use For |
|----------|-------|---------|
| Work | Blue | Job tasks, projects, meetings |
| Ministry | Green | Church, volunteering, spiritual |
| Family | Orange | Family events, kids, parents |
| Personal | Purple | Self-care, hobbies, errands |
| Awaiting | Red | Waiting on someone else |

## Priorities

- **High** (red dot) - Urgent & important, do soon
- **Medium** (amber dot) - Important but not urgent
- **Low** (green dot) - Nice to have, can wait

## Data Storage

All data is stored in your browser's `localStorage` under key `life_planner_tasks`.

- **No account needed** - completely offline
- **Persists between sessions** - data stays until you clear it
- **Export regularly** to backup important items

To reset everything, open browser console and run:
```javascript
localStorage.removeItem('life_planner_tasks');
location.reload();
```

## Google Calendar Sync (Optional)

If you want to sync tasks to Google Calendar:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials (Web application)
3. Add `http://localhost:3000` to authorized origins
4. Copy Client ID and API Key
5. Edit `app.js` CONFIG.google section:
   ```javascript
   google: {
       clientId: 'YOUR_CLIENT_ID',
       apiKey: 'YOUR_API_KEY',
       ...
   }
   ```
6. Reload the app and click **Google Sync**
7. Grant calendar permissions

Synced tasks appear with a gray border and Google icon. They are read-only in the app (edit directly in Calendar).

## Keyboard Shortcuts

- `Esc` - Close modal
- `Enter` - Focus on first input when modal opens

## Tips & Best Practices

1. **Capture everything** - If it's on your mind, add it
2. **Date only when needed** - Leave time blank for all-day items
3. **Use priorities** - High only for truly urgent
4. **Review weekly** - Move horizon tasks closer as they become relevant
5. **Keep awaiting visible** - Follow up on red tasks regularly
6. **Export monthly** - Keep backups of your data

## Browser Compatibility

- Chrome/Edge 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Mobile browsers ✅ (touch-friendly)

## Troubleshooting

**Tasks not saving?**
- Check localStorage is enabled (not in private mode)
- Clear browser cache and reload

**Google Sync not working?**
- Verify Client ID and API Key are correct
- Must run on localhost or HTTPS (not file://)
- Ensure Calendar API is enabled in Google Cloud

**UI glitches?**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Disable browser extensions that modify CSS

## Support

For issues or feature requests, open an issue in the repository.

---

*Version 1.0.0 | Built with purpose*
