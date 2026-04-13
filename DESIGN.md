# DESIGN.md

clip-pop-medroa — Design System

## 1. Visual Theme & Atmosphere

Floating glassmorphism notification. A frameless, transparent Tauri window that appears briefly over other apps — a clipboard toast that's nearly invisible until it matters. Semi-transparent dark surfaces with backdrop blur create a glass panel effect. The UI exists at the periphery of attention.

Dark/light/custom themes. Custom mode allows user-selected background images.

## 2. Color Palette & Roles

No CSS variables — inline styles and raw values.

### Dark Theme (Default)

| Color                        | Usage                    |
| ---------------------------- | ------------------------ |
| `rgba(0,0,0,0.5)`           | Notification surface bg  |
| `rgba(15,15,15,0.9)`        | Menu bg                  |
| `rgba(18,18,24,0.88)`       | Settings panel bg        |
| `#fff`                       | Primary text             |
| `rgba(255,255,255,0.7)`     | Secondary text           |
| `rgba(255,255,255,0.4)`     | Button borders           |
| `rgba(255,255,255,0.12)`    | Hover bg                 |
| `rgba(255,255,255,0.1)`     | Subtle borders           |
| `rgba(255,255,255,0.08)`    | Button fill              |

### Light Theme

| Color                        | Usage                    |
| ---------------------------- | ------------------------ |
| `rgba(255,255,255,0.75)`    | Notification surface bg  |
| `rgba(255,255,255,0.95)`    | Menu bg                  |
| `#111`                       | Primary text             |

## 3. Typography Rules

### Font Families

| Context | Family                                                           |
| ------- | ---------------------------------------------------------------- |
| UI      | `"Inter", "Noto Sans JP", system-ui, -apple-system, sans-serif` |
| Icons   | `"DejaVu Sans", "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif` |

### Type Scale

| Element        | Size     | Weight | Notes           |
| -------------- | -------- | ------ | --------------- |
| Settings title | `1.3rem` | 700    |                 |
| Message        | `1rem`   | 600    |                 |
| Field label    | `0.95rem`| 600    |                 |
| Menu item      | `0.95rem`| normal |                 |
| Icon           | `1.35rem`| —      | Line-height 1   |
| Note/path      | `0.85rem`| —      | Opacity 0.7-0.8 |
| Range value    | `0.9rem` | —      | Opacity 0.9     |

### Icons

Unicode symbols: `⧉` (copy), `⌦` (clear), `⚙` (settings), `⏻` (power).

## 4. Component Stylings

### Notification Surface

- Background: `rgba(0,0,0,0.5)` (dark) / `rgba(255,255,255,0.75)` (light)
- Border radius: `12px`
- Padding: `12px`
- Backdrop filter: `blur(6px)`
- Shadow: `0 10px 32px rgba(0,0,0,0.35)`
- Layout: flex row, `gap: 12px`
- Width: 280-360px

### Menu

- Background: `rgba(15,15,15,0.9)`
- Border radius: `10px`
- Shadow: `0 12px 32px rgba(0,0,0,0.5)`
- Items: `8px 16px` padding, hover `rgba(255,255,255,0.12)`

### Settings Panel

- Background: `rgba(18,18,24,0.88)`
- Backdrop filter: `blur(16px)`
- Border radius: `18px`
- Padding: `24px`
- Shadow: `0 20px 50px rgba(0,0,0,0.5)`
- Position: absolute, `inset: 32px`

### Image Picker Button

- Border: `1px solid rgba(255,255,255,0.4)`
- Background: `rgba(255,255,255,0.08)`
- Border radius: `8px`
- Padding: `6px 12px`

## 5. Layout Principles

### Window

- Collapsed: `420 × 260px`
- Settings expanded: `420 × 600px`
- Frameless, transparent, always-on-top, skip-taskbar

### Notification Positioning

Corner classes: bottom-right/left, top-right/left. Offset `32px` from edges.

### Spacing (4px base)

| Value | Usage |
| ----- | ----- |
| 4px   | Menu vertical padding |
| 8px   | Gaps, icon spacing |
| 12px  | Surface padding, button padding |
| 16px  | Menu item horizontal padding, header margin |
| 20px  | Settings field group gap |
| 24px  | Settings panel padding |
| 32px  | Window edge margins |

## 6. Depth & Elevation

### Shadows

| Context      | Shadow                                   |
| ------------ | ---------------------------------------- |
| Notification | `0 10px 32px rgba(0,0,0,0.35)`          |
| Menu         | `0 12px 32px rgba(0,0,0,0.5)`           |
| Settings     | `0 20px 50px rgba(0,0,0,0.5)`           |

### Backdrop Blur

- Notification: `blur(6px)`
- Settings: `blur(16px)`

### Border Radius

| Component    | Radius |
| ------------ | ------ |
| Buttons      | `8px`  |
| Menu         | `10px` |
| Notification | `12px` (surface), `14px` (container) |
| Settings     | `18px` |

### Z-Index

- Notification: `10`

## 7. Do's and Don'ts

### Do

- Use `backdrop-filter: blur()` on all surface components
- Keep notification width between 280-360px
- Use `rgba` colors for all backgrounds — transparency is the identity
- Apply `0.08s ease` transitions on show/hide (snappy)
- Use Unicode symbols for icons (no icon library)
- Support dark/light/custom image themes

### Don't

- Add solid opaque backgrounds — everything must be translucent
- Use border-radius above `18px`
- Add scroll to the notification (it must fit in view)
- Import external icon libraries — Unicode symbols match the minimal aesthetic

### Transitions

| Context           | Duration | Timing |
| ----------------- | -------- | ------ |
| Show notification | 360ms    | ease   |
| Hide notification | 360ms    | ease   |
| Hover states      | instant  | —      |

## 8. Responsive Behavior

Desktop-only Tauri app. Fixed window sizes (420×260 / 420×600). No breakpoints.

## 9. Agent Prompt Guide

### When generating UI for this project

- Glassmorphism: translucent `rgba` backgrounds + `backdrop-filter: blur()`
- Frameless Tauri window, always-on-top, skip-taskbar
- Unicode icons only: ⧉ ⌦ ⚙ ⏻
- Inter + Noto Sans JP font stack
- Three themes: dark (default), light, custom image
- 360ms show/hide animation with `translateY(10px)` slide
- Corner positioning with `32px` offset
- Settings panel expands window from 260px to 600px height
- No CSS framework — raw CSS with inline styles
- Monochromatic transparency palette — white or black at varying opacity
