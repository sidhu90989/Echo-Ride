# EcoRide Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based (Ola/Uber + Eco-Brand Innovation)

Drawing inspiration from established ride-sharing platforms (Ola, Uber, Grab) while infusing a distinctive eco-conscious identity. The design balances familiar patterns for trust and usability with unique green-tech branding that communicates environmental responsibility.

**Key Design Principles:**
- Instant Recognition: Users should feel at home while experiencing something fresh
- Trust Through Transparency: Clear visual hierarchy for safety features and eco-metrics
- Purposeful Green: Environmental theme is sophisticated, not gimmicky
- Mobile-First Responsive: Seamless experience from phone to desktop

## Color Palette

**Primary Colors:**
- Forest Green: `142 71% 45%` - Primary brand color, CTAs, active states
- Deep Charcoal: `210 11% 15%` - Headers, primary text, navigation bars
- Pure White: `0 0% 100%` - Backgrounds, cards, contrast elements

**Supporting Colors:**
- Leaf Green: `142 76% 36%` - Darker green for hover states, shadows
- Mint Fresh: `152 61% 91%` - Light backgrounds, success messages, eco-badges
- Warm Gray: `210 10% 96%` - Secondary backgrounds, disabled states
- Alert Red: `0 84% 60%` - SOS button, critical alerts (use sparingly)
- Sky Blue: `199 89% 48%` - Informational messages, driver online status

**Semantic Colors:**
- Success: `142 71% 45%` (Forest Green)
- Warning: `45 93% 47%` (Amber - eco-points milestones)
- Error: `0 84% 60%` (Alert Red)
- Info: `199 89% 48%` (Sky Blue)

## Typography

**Font Families:**
- Primary: 'Inter' (Google Fonts) - Clean, modern, excellent readability
- Accent: 'Poppins' (Google Fonts) - Friendly, rounded for headings and CTAs

**Type Scale:**
- Hero/Display: 48px (3rem) - Poppins SemiBold
- H1: 36px (2.25rem) - Poppins SemiBold
- H2: 28px (1.75rem) - Poppins Medium
- H3: 24px (1.5rem) - Poppins Medium
- H4: 20px (1.25rem) - Poppins Medium
- Body Large: 18px (1.125rem) - Inter Regular
- Body: 16px (1rem) - Inter Regular
- Small: 14px (0.875rem) - Inter Regular
- Tiny: 12px (0.75rem) - Inter Medium (labels, badges)

## Layout System

**Spacing Primitives:**
Core spacing units: `2, 4, 6, 8, 12, 16, 24` (Tailwind units)
- Micro spacing (2, 4): Icon-text gaps, tight padding
- Standard spacing (6, 8): Card padding, button padding
- Section spacing (12, 16, 24): Component separation, page sections

**Container Strategy:**
- Mobile: Full width with px-4 padding
- Desktop: max-w-7xl centered with px-6/px-8

**Grid Systems:**
- Ride Selection Cards: grid-cols-1 md:grid-cols-3 gap-4
- Admin Dashboard: grid-cols-1 lg:grid-cols-4 gap-6 (metrics)
- Driver Stats: grid-cols-2 md:grid-cols-4 gap-4

## Component Library

### Navigation
**Rider/Driver App Header:**
- Fixed top bar, h-16, bg-charcoal, white text
- Logo left, profile avatar right, notification bell
- Mobile: Hamburger menu → slide-in drawer

**Admin Sidebar:**
- w-64 fixed left sidebar on desktop
- Collapsible on mobile (overlay drawer)
- Green accent for active nav items

### Buttons
**Primary CTA:**
- bg-forest-green, text-white, rounded-full, px-8 py-3
- Soft shadow: shadow-lg, hover:shadow-xl
- Font: Poppins Medium, 16px

**Secondary:**
- border-2 border-forest-green, text-forest-green, rounded-full
- When on images: backdrop-blur-md bg-white/10 border-white

**Icon Buttons:**
- Circular, w-12 h-12, bg-white shadow-md
- Used for: SOS (red), location center, menu actions

### Cards
**Ride History/Selection Cards:**
- bg-white rounded-2xl shadow-md p-6
- Border: subtle 1px border-warm-gray
- Hover: shadow-lg transition-shadow duration-200

**Eco-Impact Cards:**
- bg-mint-fresh rounded-xl p-4
- Green border-l-4 border-forest-green
- Icon left, metrics right, badge top-right

### Map Interface
**Map Container:**
- Full-screen minus header (h-[calc(100vh-4rem)])
- Absolute positioned controls overlay
- Bottom sheet for ride details: bg-white rounded-t-3xl shadow-2xl

### Forms & Inputs
**Text Inputs:**
- h-12 rounded-xl border-2 border-warm-gray
- Focus: border-forest-green ring-2 ring-forest-green/20
- px-4 py-3, placeholder text-gray-400

**Toggle Switches:**
- Female Driver Preference: Large toggle, green when active
- Track bg-gray-200, active bg-forest-green

### Modals & Overlays
**Confirmation Dialogs:**
- Centered modal, max-w-md, rounded-2xl shadow-2xl
- White background, p-8
- Actions aligned right: Cancel (secondary), Confirm (primary)

**Bottom Sheets (Mobile):**
- Slide up from bottom, rounded-t-3xl
- Drag handle at top (gray pill shape)
- Used for: Ride requests, payment options, filters

### Data Visualization
**Eco-Impact Meter:**
- Circular progress ring, stroke-forest-green
- Center shows CO₂ saved in kg
- Animated fill on load

**Earnings Graph (Driver):**
- Line chart with green gradient fill
- Grid lines subtle gray
- Tooltips on hover with white bg, shadow-lg

**Admin Analytics:**
- Stat cards: grid layout, large numbers in charcoal
- Trend indicators: green up arrow, red down arrow
- Mini charts (sparklines) in card bottom

### Status Indicators
**Driver Status Badge:**
- Online: bg-sky-blue text-white, rounded-full px-3 py-1
- Offline: bg-gray-400
- Verified: green checkmark icon badge overlay

**Ride Status Pills:**
- Active: bg-forest-green, pulsing dot animation
- Completed: bg-gray-400
- Cancelled: bg-red-100 text-red-700

### Icons
**Library:** Heroicons (outline for UI, solid for filled states)
**Usage:**
- Navigation: 24px
- Cards/Buttons: 20px
- Inline text: 16px
- Eco badges: 32px (custom trophy/leaf icons)

## Animations

Use sparingly for purposeful feedback:

**Ride Confirmation:**
- Checkmark scale-in with gentle bounce
- Background overlay fade-in (200ms)

**Map Marker:**
- Gentle pulse animation for pickup/destination pins
- Driver car icon smooth movement along route

**Eco-Points Earned:**
- +Points number count-up animation
- Badge unlock: scale pop + confetti particles (green)

**Loading States:**
- Skeleton screens with shimmer effect (gray-200 → gray-300)
- Spinner: rotating circle, stroke-forest-green

**Micro-interactions:**
- Button press: scale(0.98) on active
- Card hover: translateY(-2px) + shadow change
- Toggle switch: smooth slide transition (150ms)

## Images

**Hero Section (Landing/Marketing Page):**
- Large hero image: Split-screen design
- Left: Person using app in e-rickshaw (candid, authentic)
- Right: Eco-friendly vehicle montage (E-Rickshaw, E-Scooter, CNG Car)
- Overlay: Semi-transparent dark gradient for text readability
- Dimensions: Full viewport height on desktop (min-h-screen), 60vh on mobile

**Vehicle Type Selection:**
- Small illustrative icons (not photos): 80x80px, centered above vehicle name
- Consistent illustration style: Line art with green accent fills

**Driver Profile Photos:**
- Circular, 48px (list view), 96px (detailed view)
- Border: 2px white with subtle shadow

**Admin Dashboard:**
- No decorative images, focus on data visualization and maps
- Optional: Small eco-badge icons for gamification leaderboard