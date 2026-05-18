# CarExpert Africa® — Full Source Code

Kenya's Ultimate Car Listing Platform.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite |
| Routing | React Router v6 |
| Styling | CSS Modules + Google Fonts |
| Database / Auth / Storage | Supabase |
| Hosting | Vercel |
| Payments | Pesapal / M-Pesa API |
| Search | Algolia (optional, for fast listing search) |

---

## Project Structure

```
carexpert-africa/
├── src/
│   ├── main.jsx              # App entry point
│   ├── App.jsx               # Router setup
│   ├── styles/
│   │   └── globals.css       # Design tokens, fonts, resets
│   ├── lib/
│   │   └── supabase.js       # Supabase client
│   ├── components/
│   │   ├── Navbar.jsx        # Desktop navigation
│   │   ├── MobileNav.jsx     # Mobile bottom tab bar + drawer
│   │   ├── Footer.jsx        # Site footer
│   │   └── CarCard.jsx       # Reusable listing card
│   └── pages/
│       ├── HomePage.jsx
│       ├── ListingsPage.jsx
│       ├── CarDetailPage.jsx
│       ├── DealerProfilePage.jsx
│       ├── ValuationPage.jsx
│       ├── AuthPage.jsx
│       ├── PricingPage.jsx
│       ├── ListCarPage.jsx
│       ├── NewsReviewsPage.jsx
│       ├── DashboardPage.jsx
│       └── AdminPage.jsx     # Admin approval panel
├── package.json
├── vite.config.js
└── index.html
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
- Create a free project at https://supabase.com
- Copy your project URL and anon key
- Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Supabase tables
Run these SQL statements in your Supabase SQL editor:

```sql
-- Listings
create table listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users,
  make text, model text, year int,
  price bigint, mileage int, fuel text,
  transmission text, body_type text, engine_cc int,
  drive_type text, condition text, colour text,
  location text, description text,
  contact_name text, contact_phone text,
  status text default 'pending',  -- pending | approved | declined
  admin_note text,
  featured boolean default false,
  views int default 0
);

-- Listing photos
create table listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings on delete cascade,
  url text, is_main boolean default false,
  position int
);

-- Dealers
create table dealers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  business_name text, location text,
  phone text, whatsapp text, email text,
  website text, specialities text[],
  verified boolean default false,
  plan text default 'free'
);

-- Saved listings
create table saved_listings (
  user_id uuid references auth.users,
  listing_id uuid references listings,
  primary key (user_id, listing_id)
);

-- Saved searches / alerts
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  criteria jsonb,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table listings enable row level security;
alter table listing_photos enable row level security;
alter table saved_listings enable row level security;

-- Policies: anyone can read approved listings
create policy "Public listings" on listings for select using (status = 'approved');
-- Owners can manage their listings
create policy "Owner full access" on listings for all using (auth.uid() = user_id);
-- Admin bypass (set role in user metadata: {role: 'admin'})
```

### 4. Set up Supabase Storage
- Create a bucket called `listing-photos` (public)
- Listings photos will upload here via the List a Car form

### 5. Run locally
```bash
npm run dev
```

### 6. Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```
Add your environment variables in the Vercel dashboard.

---

## Admin Access
To make a user an admin, run this in Supabase SQL editor:
```sql
update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
where email = 'your-admin@email.com';
```
The AdminPage checks for `user.user_metadata.role === 'admin'` and redirects non-admins.

---

## Key Features Built
- ✅ Homepage with hero search
- ✅ Listings page with dual-range filters (price, year, mileage, engine)
- ✅ Car detail page with finance calculator
- ✅ Dealer profile pages
- ✅ Car valuation tool
- ✅ Login / Register (buyer + dealer account types)
- ✅ Pricing page (4 tiers, monthly/annual)
- ✅ List a Car — 4-step form with live preview
- ✅ News & Reviews
- ✅ User dashboard (listings, saved cars, leads, alerts)
- ✅ Admin panel — approve/decline with notes, seller notifications
- ✅ Mobile-first responsive layout

## Payments (M-Pesa / Pesapal)
Integrate Pesapal for KES payments: https://developer.pesapal.com
For M-Pesa STK Push, use Safaricom Daraja API: https://developer.safaricom.co.ke
