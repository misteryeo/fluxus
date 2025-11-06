# Quick Manual Test Instructions

## Setup
```bash
npm run dev
```

Open `/fluxus-make` in browser.

## Test Steps

### 1. PR Selection
- Select **1–2 PRs** in the sidebar
- Verify **"Connected PRs"** count increases in the Source panel

### 2. Core Summary & Regeneration
- Type a **core summary** in the Summary panel
- Click **"Regenerate"** button
- Verify **audience previews** fill (Internal, Customer, Investor, Public tabs)

### 3. Request Review
- Click **"Request review"** button
- Verify **status pill** updates (e.g., changes to "In Review")
- Add a **comment** in the review section
- Verify comment appears in the review panel

### 4. Publish Flow
- **Toggle channels** (e.g., Slack, Twitter, etc.) in Publish panel
- Click **"Publish"** button
- Verify **toast notification** shows queued/skipped result

