# Privacy-first Diffchecker

A minimal, static UI that compares two text blocks or code snippets in-memory using `jsdiff`. Designed to never store or upload content — inputs are processed in the browser and discarded.

Files
- index.html — main UI
- styles.css — layout and styling
- script.js — diff logic (uses `diff` library from CDN)

Usage
1. Open `diffchecker-ui/index.html` in a browser (double-click or host with a static server).
2. Paste the original text in the left editor and the revised text in the right editor.
3. Click `Compare` to see added/removed lines highlighted directly in each editor.

Copy-paste workflow and word-level highlights
- Paste (preferred): use the editor fields directly and paste (Cmd/Ctrl+V), or click the "Paste into Original" / "Paste into Revised" buttons to read from your clipboard.
- (Uploads removed): this UI prefers copy-paste for privacy and convenience.
- Select the language to improve syntax highlighting.
- **Exact changes highlighted**: the diff shows exactly which words and characters changed (word-level precision), not just entire lines.
- Added and removed parts are highlighted in green and red respectively.

Privacy
- No inputs are sent to any server. Processing happens client-side.
- The app intentionally does not persist or upload content.

Next steps (optional)
- Add file upload for side-by-side comparing files.
- Add a downloadable patch file option.
- Integrate with an ephemeral backend if authenticated sharing is required (note privacy tradeoffs).

Accessibility & Privacy notes
- Inputs are processed entirely in the browser and not uploaded or persisted.
- The UI provides keyboard-accessible controls; further ARIA attributes can be added on request.

Keyboard shortcuts
- `Cmd/Ctrl+Enter`: Run comparison (compare pasted or pasted-from-clipboard texts).
- `Cmd/Ctrl+L`: Clear editors and results.
- `Cmd/Ctrl+Shift+C`: Copy the unified diff to the clipboard.

