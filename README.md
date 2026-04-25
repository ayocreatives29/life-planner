# Toby's Life Planner

A comprehensive work, ministry, and family planning application.

## Features

### Three Planning Layers
- **Layer 1: Today** - Horizontal strip showing all tasks due today
- **Layer 2: This Week** - 7-day horizontal scroll view with daily breakdown
- **Layer 3: Horizon** - Table showing tasks 30+ days out

### Categories
- Work (blue)
- Ministry (green)
- Family (orange)
- Personal (purple)
- Awaiting (red) - for tasks waiting on others

### Task Properties
- Title, date, time
- Category & priority (high/medium/low)
- Notes/description
- Completion status

### Actions
- Create, edit, delete tasks
- Mark tasks complete/incomplete
- Clear all completed
- Export data as JSON
- Automatic localStorage persistence

## Usage

Open `index.html` in any modern browser.

Click **New Task** to add items. Click any task card to toggle completion or edit its details.

All data is saved locally in your browser.

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- Tailwind CSS via CDN
- Google Fonts (Inter, Playfair Display)
- LocalStorage for persistence
