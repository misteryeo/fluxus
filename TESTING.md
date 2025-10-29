# How to Test the Fluxus Editor

## Setup
1. Navigate to the fluxus directory: `cd fluxus`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open http://localhost:3000 in your browser

## Testing Features

### 1. State Management & Autosave
- **Input Text**: Type in the GitHub PR and Linear Ticket textareas
- **Meta Information**: Fill out Feature Name, Status, Access, Version, Product Area, and Audience Notes
- **Links**: Add PR URL, Linear URL, and Docs URL
- **Metrics**: Add KPI/Expected Impact
- **Notes**: Add additional notes and context
- **Verify Autosave**: 
  - Open browser DevTools → Application → Local Storage
  - Look for `fluxus:editor` and `fluxus:templates` keys
  - Refresh the page - all data should persist
  - Clear localStorage and refresh - should reset to defaults

### 2. Input Panel
- **GitHub PR Textarea**: Should accept multi-line text and auto-save
- **Linear Ticket Textarea**: Should accept multi-line text and auto-save
- **Meta Section**:
  - Feature Name: Text input
  - Status: Dropdown (Beta, GA, Flagged, TBD)
  - Access: Text input
  - Version: Text input
  - Product Area: Comma-separated values (stored as array)
  - Audience Notes: Multi-line textarea

### 3. Controls Panel
- **Summarize Button**: 
  - Calls `/api/summarize` with PR and ticket text
  - Uses deterministic local summarizer (no external AI)
  - Updates summaries and shows success/error toasts
  - Should show loading state during API call
- **Generate Drafts Button**:
  - Calls `/api/generate` for each unlocked audience
  - Compiles templates with current context
  - Applies length limits and shows warning toast if TBD tokens found
  - Should show loading state during API calls
- **Regenerate Button**:
  - Click to regenerate current tab (if unlocked) using API
  - Click dropdown arrow to see options:
    - "Regenerate Current Tab" (disabled if locked)
    - "Regenerate All Tabs"
- **Templates Button**: Opens Template Manager modal
- **Status Line**: Shows last summarized/generated timestamps

### 4. Output Tabs
- **Tab Navigation**: Switch between Internal, Customer, Investor, Public
- **Lock Toggle**: 
  - Click lock/unlock button to toggle state
  - Locked tabs show red styling
  - Unlocked tabs show gray styling
- **Character Counter**: 
  - Shows current/template limit
  - Green: under 90% of limit
  - Yellow: 90-100% of limit  
  - Red: over limit
- **Editable Textareas**: 
  - All tabs have editable textareas
  - Changes auto-save to state
  - Locked tabs remain editable but prevent regeneration

### 5. Responsive Design
- **Desktop**: Side-by-side layout (Input left, Output right)
- **Mobile**: Stacked layout (Input top, Output bottom)
- **Controls**: Wrap on smaller screens

### 6. Lock Behavior
- **Generate Drafts**: Only affects unlocked tabs
- **Regenerate**: Respects lock state
- **Manual Editing**: Always allowed regardless of lock state
- **Visual Feedback**: Lock status clearly indicated

### 7. Template Engine
- **Template Compilation**: 
  - Fill in meta fields, summaries, links, metrics, and notes
  - Click "Generate Drafts" to see templates compiled with current context
  - Templates use {{ }} syntax for variable substitution
- **Helper Functions**:
  - `{{ upper(text) }}` - Convert to uppercase
  - `{{ title(text) }}` - Convert to title case
  - `{{ clamp(text, maxChars) }}` - Truncate with ellipsis
  - `{{ bullets(input, maxItems?) }}` - Convert to bullet points
  - `{{ or(a, b) }}` - Return first truthy value, fallback to second
- **Missing Values**: Show as "[TBD]" when fields are empty
- **Unknown Tokens**: Show as "[UNKNOWN: token]" for invalid references

### 8. Template Manager
- **Access**: Click "Templates" button in Controls panel
- **Audience Selection**: Switch between Internal, Customer, Investor, Public
- **Template Fields**:
  - Name: Custom template name
  - Tone: Neutral, Friendly, or Assertive
  - Length Limit: Character limit for generated content
  - Emoji: Enable/disable emoji support
  - Body: Template content with {{ }} tokens
- **Live Preview**: Shows compiled template with current context
- **Warnings**: Displays unknown token warnings
- **Actions**:
  - Save Template: Persists to localStorage
  - Reset to Default: Restores original template
  - Cancel: Closes without saving

### 9. Template Limits
- Internal: 500 characters
- Customer: 300 characters  
- Investor: 250 characters
- Public: 250 characters

### 10. Toast Notifications
- **TBD Warning**: Shows when generated drafts contain "[TBD]" tokens
- **Success Messages**: Shows when operations complete successfully
- **Error Messages**: Shows when API calls fail
- **Auto-dismiss**: Toasts disappear after 5 seconds
- **Manual Close**: Click X button to dismiss immediately
- **Position**: Top-right corner with slide-in animation

### 11. API Endpoints
- **POST /api/summarize**:
  - Input: `{ prText: string, ticketText: string }`
  - Output: `{ technical: string, value: string }`
  - Uses deterministic local summarizer (no external AI)
- **POST /api/generate**:
  - Input: `{ audience: string, context: TemplateContext, template?: { body: string, lengthLimit?: number } }`
  - Output: `{ text: string, warnings?: string[] }`
  - Compiles templates and enforces length limits

## Expected Behavior
- All state changes persist across page refreshes
- Loading states show during async operations
- Lock toggles work correctly
- Character counters update in real-time
- Responsive layout adapts to screen size
- No console errors or TypeScript issues

## Template Engine Testing Examples

### Test Template Compilation
1. Fill in meta fields:
   - Feature Name: "New Auth System"
   - Status: "beta"
   - Access: "All users"
   - Version: "v2.1.0"
2. Add summaries:
   - Technical: "Implemented OAuth 2.0\nAdded JWT validation\nUpdated permissions"
   - Value: "Enhanced security and user experience"
3. Add links:
   - PR URL: "https://github.com/repo/pull/123"
   - Linear URL: "https://linear.app/issue/ABC-456"
4. Click "Generate Drafts" and verify:
   - Templates compile with actual values
   - Helper functions work (upper, bullets, clamp)
   - Missing values show as "[TBD]"

### Test Template Manager
1. Click "Templates" button
2. Select "Customer" audience
3. Edit template body to include: `{{ upper(meta.status) }} - {{ bullets(summaries.technical, 2) }}`
4. Verify live preview shows compiled result
5. Save template and test generation

## Troubleshooting
- If data doesn't persist: Check localStorage in DevTools
- If components don't update: Check for TypeScript errors
- If layout breaks: Verify Tailwind classes are applied
- If locks don't work: Check state management in React DevTools
- If templates don't compile: Check for unknown tokens in Template Manager warnings
- If TBD warnings don't show: Verify template contains "[TBD]" tokens
