# Design System Specification
**Project:** Smart Energy Intelligence Platform  
**Design Theme:** Earth Tone, Modern Eco-Intelligence, Data-Dense Residential UI

---

## 1. Color System & Design Tokens

### 1.1 Brand & Action Tokens
```css
--primary: #0d4026;             /* Forest Deep Green - Main actions & branding */
--primary-container: #28583c;   /* Forest Mid Green - Active states & selected chips */
--on-primary: #ffffff;          /* Text on primary actions */
--primary-fixed: #9fd2ae;       /* Light forest accent - Data viz & charts */
--secondary: #717972;           /* Muted slate green - Subtitles & inactive icons */
```

### 1.2 Surface & Elevation Tokens
```css
--surface: #f3fcef;                  /* Warm natural canvas backdrop */
--surface-container-lowest: #ffffff; /* Card backgrounds & floating panels */
--surface-container-low: #edf6ea;    /* Subdued card accents & hover fills */
--surface-container: #e6efe3;        /* Table headers & nested panels */
--surface-container-high: #e0e9dd;   /* Dividers & inactive pill containers */
--outline-variant: #e8f0e4;          /* Subtle card borders */
```

### 1.3 Semantic Feedback Tokens
| Token | Background | Text / Border | Purpose |
| :--- | :--- | :--- | :--- |
| **Status Green** | `#ecfdf5` | `#065f46` | Online devices, normal consumption, resolved alerts |
| **Status Amber** | `#fffbeb` | `#92400e` | Warning threshold, high load, unverified readings |
| **Status Red** | `#fef2f2` | `#991b1b` | Critical anomalies, disconnected entities, tripping hazard |
| **Status Blue** | `#eff6ff` | `#1e40af` | System notifications, automated schedules, info events |

---

## 2. Typography Scale

The application pairs **Inter** for UI clarity with **Google Material Symbols Outlined** for icons. Numerical values utilize tabular digits (`font-feature-settings: "tnum" 1`).

| Style | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 36px | 44px | Bold (700) | Main hero headlines |
| `headline-md`| 24px | 32px | SemiBold (600) | Dashboard section headings |
| `headline-sm`| 20px | 28px | SemiBold (600) | Card group headers |
| `title-md`   | 16px | 24px | Medium (500) | Device titles & table headers |
| `body-md`    | 14px | 20px | Regular (400) | Descriptions & explanations |
| `label-sm`   | 12px | 16px | Medium (500) | Badges, timestamps, metadata |
| `metric-num` | Dynamic | 1.1 | Bold (700) | Numerical readouts with tabular figures |

---

## 3. Core Component Library

### 3.1 Buttons
- **`btn-primary`**: Forest Green (`#0d4026`), rounded-xl, 0.5s shadow transition.
- **`btn-secondary`**: Bordered neutral card, subtle hover fill (`#edf6ea`).
- **`btn-ghost`**: Minimalist action for icon buttons and table actions.

### 3.2 KPI Cards (`KPICard`)
- Structured with icon bubble, secondary label, primary tabular numeric value, unit suffix, and optional trend/delta footer.

### 3.3 Status & Severity Chips
- Standardized pill shape (`px-2.5 py-0.5 rounded-full text-xs font-medium`).
- Evaluated against WCAG 2.2 contrast rules for text legibility.

### 3.4 Interactive Modals & Dialogs (`ConfirmDialog`)
- Accessible backdrop blur (`bg-inverse-surface/30`), keyboard escape trap, clear distinction between standard and destructive (`isDangerous`) actions.
