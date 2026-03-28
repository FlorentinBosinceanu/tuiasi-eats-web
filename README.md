# 🍽️ TUIASI Eats

A mobile-first food delivery web application built for the TUIASI university canteen. Students can browse the menu, place orders, and track them in real time, while canteen staff manage incoming orders and the menu from an admin dashboard.

**TUIASI Eats** digitizes the canteen ordering experience with two distinct interfaces:

### 🎓 Student Side
- **Browse Menu** — categories (Soups, Main Courses, Side Dishes, Salads, Desserts, Beverages) with item details, allergens, and photos
- **Search** — instant search across all menu items from the home screen
- **Cart & Checkout** — add items, adjust quantities, include utensils, and place orders (with business-hours validation: 08:00–16:00)
- **Real-Time Order Tracking** — live status updates (Pending → Preparing → Ready → Completed) powered by Supabase Realtime, with browser notifications and sound alerts when your order is ready
- **Order History** — view past orders with a one-tap **Reorder** button
- **Favorites** — heart/save menu items for quick access (persisted in localStorage)

### 👨‍🍳 Admin / Staff Side
- **Order Management** — live-updating order queue with status controls and sound notifications on new orders
- **Menu Management** — full CRUD for menu items (name, category, price, weight, allergens, notes, image upload to Supabase Storage)
- **Form Validation** — inline validation with error highlighting for required fields and price constraints
- **Dashboard & Settings** — overview stats and account management

### Key Technical Features
- **Supabase Realtime** replaces polling — instant order updates via `postgres_changes` channels
- **Browser Notifications + Web Audio API** — push-style alerts and distinct notification sounds for students and staff
- **Human-readable Order IDs** — formatted as `YYYYMMDD-XXXX` for easy reference
- **Toast Notifications** — non-intrusive feedback across the entire app (react-hot-toast)
- **Mobile-First Design** — optimized for phone screens with a fixed bottom navigation bar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS (utility-first, mobile-first) |
| Routing | React Router v6 |
| Database & Auth | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Icons | Lucide React |
| Notifications | react-hot-toast, Web Audio API, Browser Notification API |

## User Login

test@student.tuiasi.ro
password123


## Admin Login

admin@staff.tuiasi.ro
password123
