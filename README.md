# My Café: Smart Café Ordering and Management System

COMP.6207 Special Topic project, Toi Ohomai Institute of Technology.

A web app where café customers order from their phone and staff manage the orders.

## Features (MVP)

1. **Menu browsing**: dishes grouped by category, with prices and preparation times.
2. **Cart and ordering**: add dishes, change quantities, enter a name and place the order. Payment is at the counter.
3. **Staff order dashboard**: staff log in, see active orders live, and move each order to its next status.
4. **Live order tracking**: the customer's page updates as the order goes pending → preparing → ready → completed.
5. **Order history and sales**: the last 7 days of orders, with totals, average order and a sales-per-day chart.

Extras:
- An estimated wait time, based on dish preparation times and the current queue.
- A sold-out switch: staff can hide a dish from the menu instantly (`/staff/menu`).
- A sales chart for the last 7 days on the History page.

## Technology

- React (Vite) and JavaScript, with React Router for pages
- Supabase: PostgreSQL database, Auth (staff login) and Realtime (live updates)
- Hosted on Vercel

## How it keeps data safe

- Row Level Security is on for every table. Anyone can read the menu; only staff can read or update orders.
- Customers can't write to the database directly. Orders go through `place_order`, a database function that checks the input and works out the total from the real prices, so prices can't be changed in the browser.
- A customer can only see their own order, through `get_order_status`, using the private link (the order's UUID) they get after ordering.
- Live updates to customers go on a channel named after the order's UUID, so nobody else receives them.
- The browser only has the publishable key. It is kept in `.env.local`, which is never committed.

## Running it locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key.
3. `npm run dev`, then open http://localhost:5173

## Database

The SQL for the tables, security rules, functions and sample menu is in `supabase/`, in the order it was run.

## Pages

| Address | Page |
|---|---|
| `/` | Menu |
| `/cart` | Cart and checkout |
| `/order/:orderId` | Order tracking |
| `/staff/login` | Staff login |
| `/staff` | Staff order dashboard |
| `/staff/menu` | Dishes (sold-out switch) |
| `/staff/history` | History and sales |


