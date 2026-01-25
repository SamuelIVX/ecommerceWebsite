# Ecommerce Website

**Full-Stack Ecommerce Platform**

> "Production-ready shopping experience."

A modern ecommerce web application built with Next.js and Wix, featuring user authentication, cart management, product search, and a complete checkout flow.

## Features

- 🔐 **User Authentication** - OAuth integration with secure token refresh
- 🛒 **Shopping Cart** - Full cart management with persistent state
- 🔍 **Product Search** - Real-time search with filtering and pagination
- 💳 **Checkout Flow** - Complete checkout process ready for payment integration
- 📱 **Responsive Design** - Mobile-first design with Tailwind CSS
- ⚡ **Optimized Performance** - Server-side rendering and static generation

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling

### Ecommerce & State Management
- **Wix SDK** - Ecommerce backend and product management
- **Zustand** - Global state management for cart

### Authentication
- **OAuth** - User authentication
- **Cookie-based Sessions** - Secure session management with auto-refresh

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- Wix Developer Account

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/SamuelIVX/ecommerceWebsite.git
cd ecommerceWebsite
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_WIX_CLIENT_ID=your_client_id_here
FEATURED_PRODUCTS_CATEGORY_ID=your_featured_products_id_here
NEXT_PUBLIC_WIX_APP_ID=your_public_wix_app_id_here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```bash
src/
├── app/              # Next.js pages and routes
├── components/       # React components
│   ├── CartModel.tsx
│   ├── CategoryList.tsx
│   ├── ProductList.tsx
│   └── ...
├── context/          # React context providers
├── hooks/            # Custom React hooks
└── lib/              # Utility functions and clients
```
