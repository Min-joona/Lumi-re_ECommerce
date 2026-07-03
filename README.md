# Lumière

A full-stack e-commerce platform built on the MERN stack — product catalog, cart, checkout, order management, reviews, and an admin dashboard, wrapped in a refined storefront UI.

**Live demo:** [lumiere-store.vercel.app](https://lumiere-store.vercel.app)

## Overview

Lumière implements the complete lifecycle of an online store:

- **Catalog** — search, category filtering, sorting, and pagination served by a REST API
- **Cart & checkout** — persistent cart, shipping details, and server-side re-pricing to prevent client tampering
- **Accounts** — JWT authentication with customer and administrator roles
- **Orders** — order history, status tracking, and fulfillment updates
- **Reviews** — verified, authenticated product ratings
- **Admin dashboard** — revenue and order statistics, order status management

## Architecture

```
amar-ecommerce/
├── backend/          Express REST API
│   ├── config/       Database connection (serverless-aware)
│   ├── middleware/   Authentication and authorization guards
│   ├── models/       Product, User, Order schemas
│   └── routes/       /api/products · /api/auth · /api/orders
└── frontend/         React storefront (Vite)
    └── src/
        ├── pages/       Route-level views
        ├── components/  Reusable UI
        └── context/     Auth and cart state
```

## Tech Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Frontend   | React 18, Vite, Tailwind CSS, Framer Motion         |
| Backend    | Node.js, Express, Mongoose                          |
| Database   | MongoDB Atlas                                       |
| Security   | Helmet, rate limiting, input sanitization, JWT      |

## Getting Started

**Prerequisites:** Node.js 18+ and a MongoDB connection string.

```bash
# API
cd backend
npm install
cp .env.example .env   # configure environment
npm run seed           # optional: load sample catalog
npm run dev

# Storefront
cd frontend
npm install
npm run dev
```

Environment variables are documented in [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

## Security

The API ships with security headers (Helmet), global and per-route rate limiting, MongoDB query sanitization, strict CORS origin allow-listing, and bcrypt-hashed credentials with signed JWTs.

## Author

**Amar Hassen Mohammednur** — [github.com/Min-joona](https://github.com/Min-joona)

## License

MIT
