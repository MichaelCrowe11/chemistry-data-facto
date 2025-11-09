# Crowe Code - PRD

A modern, web-based code editor inspired by VS Code, designed for elegant code editing with a professional developer experience.

**Experience Qualities:**
1. **Professional** - Clean, focused interface that feels like a mature development tool
2. **Responsive** - Instant feedback and smooth interactions that don't interrupt flow
3. **Intuitive** - Familiar patterns for developers while adding thoughtful improvements

**Complexity Level:** Light Application (multiple features with basic state)
A code editing interface with file management, syntax highlighting, and customizable panels. Focuses on single-session editing with browser-based persistence.

## Essential Features

### User Authentication & Profiles
- **Functionality**: GitHub-based user authentication with avatar, username, and owner status
- **Purpose**: Personalize the experience and enable user-specific workspaces
- **Trigger**: User opens application
- **Progression**: Load app → Authenticate via GitHub → Show user profile → Access personal workspace
- **Success criteria**: User profile loads within 1s, avatar displays correctly, owner badge shows for workspace owners

### Code Editor Panel
- **Functionality**: Full-featured text editor with syntax highlighting, line numbers, and tab support
- **Purpose**: Enable developers to write and edit code comfortably in the browser
- **Trigger**: User opens application or creates/opens a file
- **Progression**: Load editor → Type code → See syntax highlighting → Save changes persist
- **Success criteria**: Typing feels instant (<50ms), syntax highlighting accurate, content persists between sessions

### File Explorer Sidebar
- **Functionality**: Tree view of files and folders with create/rename/delete operations
- **Purpose**: Organize and navigate between multiple files
- **Trigger**: User views sidebar or clicks file tree icon
- **Progression**: View file tree → Click file → Opens in editor → Create new file → Appears in tree
- **Success criteria**: File operations work correctly, tree updates immediately, selected file highlighted

### Multi-Tab Editor
- **Functionality**: Open multiple files in tabs, switch between them, close tabs
- **Purpose**: Work with multiple files simultaneously
- **Trigger**: User opens additional files or clicks tabs
- **Progression**: Open file → New tab appears → Switch tabs → Content updates → Close tab
- **Success criteria**: Tab switching instant, unsaved changes indicated, content preserved

### Status Bar
- **Functionality**: Display file info, cursor position, language mode
- **Purpose**: Provide contextual information about current editor state
- **Trigger**: User edits code or changes cursor position
- **Progression**: Edit content → Status updates → Shows line/column → Language detected
- **Success criteria**: Updates in real-time, information accurate, no lag

### Settings Dialog
- **Functionality**: Customize editor preferences (font size, tab size, line numbers, word wrap, auto-save)
- **Purpose**: Allow users to personalize their coding environment
- **Trigger**: User clicks settings icon in toolbar
- **Progression**: Click settings → Dialog opens → Adjust preferences → Changes save automatically
- **Success criteria**: Settings persist between sessions, apply immediately, organized clearly

### Workspace Sharing
- **Functionality**: Share workspace URL with others (owner-only feature)
- **Purpose**: Enable collaboration and sharing of code projects
- **Trigger**: Owner clicks share icon in toolbar
- **Progression**: Click share → Modal opens → Copy link → Share with others
- **Success criteria**: Link copies successfully, shows workspace stats, clear owner indicators

## Edge Case Handling

- **Unauthenticated Users** - Show loading state during auth, fallback UI if auth fails
- **User Workspace Isolation** - Each user has separate file storage using user ID as key
- **Owner Permissions** - Only workspace owners see sharing features
- **Large Files** - Warn when opening files >1MB, use virtualization for rendering
- **Unsaved Changes** - Show dot indicator on tab, confirm before closing
- **Invalid File Names** - Validate on creation, show helpful error messages
- **Empty States** - Show welcome screen when no files open, helpful getting started tips with user greeting
- **Browser Storage Limits** - Warn when approaching quota, allow export to download

## Design Direction

The design should feel like a professional code editor - dark by default with excellent contrast for long coding sessions. Clean, geometric interface with focus on the code itself. Subtle animations that enhance usability without distraction. Think VS Code's elegance meets a modern web app's responsiveness.

## Color Selection

Custom dark palette optimized for code readability and reduced eye strain during extended use.

- **Primary Color (Soft Blue oklch(0.55 0.15 240))**: Main brand color for interactive elements and highlights. Represents precision and technology.
- **Secondary Colors**: 
  - Dark Gray oklch(0.20 0.01 240) - Main editor background
  - Medium Gray oklch(0.35 0.01 240) - Sidebar and panel backgrounds
  - Light Gray oklch(0.65 0.01 240) - Text and icons
- **Accent Color (Vibrant Teal oklch(0.65 0.15 180))**: Used for active states, selections, and important UI elements. Provides energy against the dark background.
- **Foreground/Background Pairings**:
  - Background (Dark Gray oklch(0.20 0.01 240)): Light Gray text (oklch(0.85 0.01 240)) - Ratio 12.1:1 ✓
  - Sidebar (Medium Gray oklch(0.25 0.01 240)): Light Gray text (oklch(0.85 0.01 240)) - Ratio 10.8:1 ✓
  - Primary (Soft Blue oklch(0.55 0.15 240)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓
  - Accent (Teal oklch(0.65 0.15 180)): Dark background - Ratio 7.4:1 ✓
  - Status Bar (Dark Gray oklch(0.18 0.01 240)): Blue text (oklch(0.60 0.12 240)) - Ratio 6.8:1 ✓

## Font Selection

Monospace typography is essential for code editing with clear character distinction and excellent ligature support. Use Fira Code for its exceptional coding ligatures and readability.

- **Typographic Hierarchy**:
  - H1 (Welcome Screen): Inter Bold/28px/tight letter spacing
  - Editor Code: Fira Code Regular/14px/1.6 line height
  - Sidebar Items: Inter Regular/13px/normal spacing
  - Tab Labels: Inter Medium/13px/normal spacing
  - Status Bar: Inter Regular/12px/tabular numbers
  - Tooltips: Inter Regular/12px/muted color

## Animations

Animations should be minimal and functional, reinforcing spatial relationships and state changes without slowing down the developer workflow.

- **Purposeful Meaning**: Use subtle motion to show panel expansion/collapse, file tree expansion, and tab switching. Transitions communicate hierarchy - main editor stays stable while panels slide in/out.
- **Hierarchy of Movement**: Editor content fades quickly (100ms) on file switch. Sidebars slide smoothly (200ms). Tabs highlight instantly. Tooltips appear with slight delay (300ms).

## Component Selection

- **Components**: 
  - Avatar (user profile picture)
  - DropdownMenu (user menu, file context menus)
  - Badge (owner status, file counts)
  - Button (toolbar actions with icon-only style)
  - Tabs (editor file tabs with close buttons)
  - ScrollArea (file explorer and editor content)
  - Separator (resizable panels)
  - Tooltip (icon button labels)
  - Dialog (confirm delete, settings, sharing)
  - Input (file rename, search, settings)
  - Switch (settings toggles)
  - Label (form labels)
- **Customizations**: 
  - CodeEditor component (Monaco-style editor with line numbers)
  - FileTree component (collapsible tree with icons)
  - StatusBar component (bottom info bar)
  - TabBar component (horizontal tab strip with close)
  - Sidebar component (collapsible side panel)
  - UserProfile component (avatar dropdown with user info)
  - SettingsDialog component (editor preferences)
  - ShareWorkspace component (collaboration features)
- **States**: 
  - Buttons: Rest/Hover (background subtle highlight)/Active (background darker)/Disabled (opacity 0.4)
  - Tabs: Inactive/Active (border top accent color)/Hover (background lighter)/Dirty (dot indicator)
  - Tree Items: Rest/Hover (background subtle)/Selected (background accent)/Focused (border left)
  - Editor: Focused (cursor blink)/Selection (background highlight)
- **Icon Selection**: 
  - User/Avatar (user profile)
  - Crown (owner badge)
  - ShareNetwork (workspace sharing)
  - Gear (settings)
  - Files (file document icon)
  - Folder/FolderOpen (directory icons)
  - Plus (new file)
  - X (close tab)
  - Code (code brackets)
  - Settings/Gear (preferences)
  - Search/MagnifyingGlass (find)
  - Palette (appearance settings)
  - Copy/Check (clipboard actions)
- **Spacing**: Compact spacing for professional IDE feel - 4px, 8px, 12px, 16px, 24px using Tailwind scale. Sidebar padding 12px, editor padding 16px.
- **Mobile**: Responsive layout with collapsible sidebar (hamburger menu), full-screen editor on mobile, touch-optimized tab switching, virtual keyboard-aware viewport
