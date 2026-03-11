# 🍽️ TUIASI Eats

A mobile-first food delivery web application built for the TUIASI university canteen. Students can browse the menu, place orders, and track them in real time, while canteen staff manage incoming orders and the menu from an admin dashboard.

## What the App Does

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

## LLMs / Tools Used

This project was built almost entirely with **LLM-assisted development** using:

- **GitHub Copilot (Claude Sonnet 4 / Claude Opus 4.6)** inside VS Code — used for the full development lifecycle: scaffolding the project structure, implementing every page and component, writing Supabase queries, debugging CSS/layout issues, and iterating on features through conversational prompts.

The workflow was conversational and iterative: I described what I wanted at a high level (e.g. _"add real-time order tracking with sound notifications"_), reviewed the generated code on my phone, and then prompted follow-up fixes or refinements (e.g. _"the dark background makes the text unreadable"_ or _"the image is getting cut off"_).

-**Google Gemini 3.5 Pro for starting instructions

## A Specific Hallucination / Technical Hurdle

**Problem: Supabase Storage Row-Level Security (RLS) blocking image uploads**

When implementing image uploads for menu items in the admin panel, the AI generated a straightforward `supabase.storage.from('menu-images').upload(...)` call. The upload silently failed with:

> `StorageApiError: new row violates row-level security policy`

The AI initially suggested fixing the RLS policies directly, but the generated SQL policies didn't match my Supabase setup and would have left the bucket insecure. After going back and forth, the practical solution we arrived at was to **make the image upload non-blocking** — the menu item gets created/updated in the database regardless, and if the image upload fails, the user sees a warning toast instead of losing all their form data. This was a case where the AI's first instinct (fix the policy) was technically correct but impractical in context, and prompting it with _"just make it so the item still gets added even if the image fails"_ led to a much better UX outcome.

A similar issue happened with database columns (`obs`, `alergeni`) — the AI generated insert queries referencing columns that didn't exist yet in my Supabase schema, causing runtime errors. The fix was to only include those fields in the payload when they have values, using spread syntax (`...alergeni ? { alergeni } : {}`), which the AI suggested after I pasted the exact error message.

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (accessible on local network for phone testing)
npx vite --host

# Type-check
npx tsc --noEmit

# Build for production
npm run build
```

PS: 

Bear in mind that the project was made in 3 days because of the notification timing about the job post and the project, and for personal reasons that i can discuss in future reviews. I probably spent around 15 hours for it. At first i started with some drafts, and I will add the photos inside the folder for you to see all my tought process in making this happen. 

the photos are user-side-sketch, admin-side-sketch and hard draft didital sketch

I did some rough sketches on how it should be. then i forgot that AI can't tell how i want the app to look like so i made some digital sketches in paint , lol, then I started with google gemini, , then thought why would i not use the visual studio code copilot, so i did most of the coding on the copilot. I made a Supabase database for the items, profiles.

Now i know that the app does not look appealing in some pages, i was in quite a rush when making this and i wehnt through different design processes when amking that, but the ai kept screwing up, so i just left it like that, the utesils part, the button is there on the right, if you press there you will see the text chaning.

To view the user side and admin side I made 2 different entities

USER SIDE

test@student.tuiasi.ro
password123


ADMIN SIDE

admin@staff.tuiasi.ro
password123

I hope this project will run on your end, whoever reviews it

I wish I had more time to implement more stuff, like designing a logo for the website, implement the courier technology like in the sketches, make more photos for the produts and bla bla bla

I really enjoyed making this project. This was my first dissertation idea, but i decided to do something else. I really hope one day i will be able to alunch a project like this for the students in Iasi and for them to use it.

This was supposed to be a mobile first design.

Thank you for reading this, i did some yapping but i wanted to show you the genuine stuff i have done.
