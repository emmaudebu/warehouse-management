# Warehouse Management System

A comprehensive, role-based Warehouse and Inventory Management System built with Next.js 15, Prisma, and NextAuth. This application provides real-time tracking, seamless inter-warehouse supply workflows, and robust administrative controls.

## 🚀 Key Features

### Role-Based Access Control
- **Director**: Full system overview, global inventory management, user suspension/deletion, and analytics.
- **Factory Manager**: Manages factory production, adds new products, bulk uploads inventory, and initiates supplies to other warehouses.
- **Storekeeper**: Manages market/store inventory, verifies and accepts/declines incoming supplies, tracks low stock.
- **Supplier/Salesperson**: Manages stock assigned to them and initiates deliveries to external customers.

### Inventory & Supply Workflows
- **Multi-Warehouse Support**: Track stock across Factory, Market, Supplier, and External locations.
- **Supply Lifecycle**: Initiate Drafts → Submit (Pending) → Accept (Delivered) / Decline (Rejected) / Cancel.
- **Automated Logging**: Every transfer, production record, and status change is logged for accountability.
- **Bulk Import & Export**: Download the entire product catalog as CSV, and bulk upload new products easily using CSV templates.
- **Invoices & Receipts**: Automatically generated transaction documents for supply movements.

### Dashboard & Analytics
- **Live Metrics**: Instantly view Total Stock, Pending Deliveries, and Low Stock Alerts.
- **Visual Charts**: Interactive pie charts and activity trend line charts (powered by Recharts).

### Progressive Web App (PWA)
- Implements a robust Service Worker caching strategy ("Network First" for critical assets) allowing for fast, resilient load times.

## 🛠 Technology Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Library**: React 19
- **Authentication**: NextAuth.js
- **Database ORM**: Prisma
- **Database Engine**: SQLite (Local, simple setup)
- **Styling**: Custom Vanilla CSS with modern Glassmorphism aesthetics
- **Data Visualization**: Recharts
- **CSV Processing**: PapaParse

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Note: `--legacy-peer-deps` is used to handle Next 15 / React 19 RC peer dependency conflicts gracefully).*

2. **Database Setup:**
   The project uses SQLite, so no complex database server is required.
   ```bash
   # Push the Prisma schema to the database
   npx prisma db push
   
   # Seed the database with default roles, warehouses, and the admin user
   npm run seed
   ```
   *(Ensure you have a seed script defined, or manually create the first admin user using Prisma Studio if required).*

3. **Environment Variables:**
   Create a `.env` file in the root directory. At minimum, provide a strong secret for NextAuth:
   ```env
   AUTH_SECRET="your-super-secret-key-here"
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛡 Authentication & Default Login

If you have run the seed script, you can log in using the default credentials (update these immediately in a production setting).
Alternatively, you can manage users directly via Prisma Studio:
```bash
npx prisma studio
```

## 📁 Project Structure Highlights

- `/app`: Next.js 15 App Router pages and Server Actions.
  - `/app/actions`: Contains all server-side logic (Transfers, Products, Admin tools).
- `/components`: Reusable React components (Tables, Charts, Modals, Action Buttons).
- `/prisma`: Database schema and migration files.
- `/public`: Static assets and the Service Worker (`sw.js`).

## 📝 License

This project is proprietary. Unauthorized copying, modification, or distribution is prohibited.
