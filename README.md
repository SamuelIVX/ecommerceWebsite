# Ecommerce Website

A Next.js 16 storefront application featuring Zustand-based cart management, robust filtering capabilities, and a Wix CMS backend. 

This repository enforces strict CI gates (Build/Lint) on all pull requests and uses Renovate for automated dependency management.

## Features

- OAuth user authentication with secure token refresh
- Client-side cart management via Zustand with persistent state
- Real-time product search, filtering, and pagination
- Server-side rendering and static generation optimizations
- Mobile-first responsive UI leveraging Tailwind CSS

*Note: This repository serves as a storefront and cart management demonstration; a final checkout/payment route is intentionally not implemented.*

## Tech Stack

### Frontend
- **Next.js 16** / **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Zustand** - Global state management

### Backend / Data
- **Wix CMS / SDK** - Product inventory and user authentication

## Prerequisites

- Node.js v20+
- npm or yarn

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

### 3. Environment Variables

Create a `.env.local` file in the root directory. You will need a Wix Client ID for the SDK to authenticate requests:

```env
NEXT_PUBLIC_WIX_CLIENT_ID=your_wix_client_id_here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```bash
src/
├── app/              # Next.js App Router pages
├── components/       # Shared UI and layout components
├── hooks/            # Custom React hooks (e.g., useCart)
├── lib/              # Wix SDK configuration and utilities
├── store/            # Zustand store definitions
├── types/            # TypeScript interfaces
└── styles/           # Global CSS and Tailwind directives
```
