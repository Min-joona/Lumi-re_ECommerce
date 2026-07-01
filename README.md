# Lumière — MERN E-Commerce Platform

[![MERN](https://img.shields.io/badge/Stack-MERN-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

A full-stack, mobile-first e-commerce store: product catalog with search / filter / sort,
cart, JWT auth, demo checkout, order history, product reviews, and an admin dashboard.

> Built by **Amar Hassen Mohammednur** as part of a full-stack portfolio.

## ✨ Features

- **Storefront** — hero, category browsing, featured products, responsive product grid
- **Search, filter & sort** — by keyword, category, price, rating (paginated API)
- **Cart** — persistent (localStorage), quantity controls, live totals
- **Auth** — register / login with JWT, protected routes
- **Checkout** — shipping form + demo payment, server-side re-pricing
- **Orders** — order confirmation + customer order history
- **Reviews** — authenticated users rate & review products
- **Admin dashboard** — revenue/orders/product stats, update order status
- **Mobile-first** — works beautifully on phones and desktops

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Router, Axios |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB (Atlas) |
| Auth | JWT + bcrypt |
| Deploy | Vercel (frontend + serverless API) |

## 📁 Structure

```
amar-ecommerce/
├── backend/     # Express API (products, auth, orders)
│   ├── config/  # DB connection (serverless-cached)
│   ├── models/  # Product, User, Order
│   ├── routes/  # /api/products, /api/auth, /api/orders
│   ├── data/    # seed catalog
│   └── seed.js
└── frontend/    # React + Vite storefront
    └── src/
        ├── pages/       # Home, Shop, ProductDetail, Cart, Checkout, …
        ├── components/  # Navbar, ProductCard, …
        └── context/     # Auth + Cart providers
```

## 🚀 Getting Started

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # fill in MONGODB_URI + JWT_SECRET
npm run seed                # load 24 demo products + 2 users
npm run dev                 # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Demo accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shop.com | admin123 |
| Customer | customer@shop.com | demo123 |

## ☁️ Deployment (Vercel)

Deploy **backend** and **frontend** as two separate Vercel projects:

1. **Backend** — root `backend/`. Env vars: `MONGODB_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS` (your frontend URL), `VERCEL=1`.
2. **Frontend** — root `frontend/`. Env var: `VITE_API_URL` = deployed backend URL. Build: `npm run build`, output `dist`.

Then run the seed once against your Atlas cluster.

## 📄 License
MIT
