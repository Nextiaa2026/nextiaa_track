# Shipment Management App - Setup Guide

## Project Structure

### Database (Drizzle ORM)

- **db/schema.ts** - Database schema with tables:
  - `users` - Admin/staff accounts with roles
  - `customers` - Senders and receivers
  - `shipments` - Shipment records with item details
  - `shipmentLogs` - Tracking updates (admin-managed)

### Authentication

- **lib/auth.ts** - JWT token management
- **app/api/auth/login/route.ts** - Login endpoint
- **app/api/auth/logout/route.ts** - Logout endpoint
- **app/api/auth/me/route.ts** - Get current user
- **middleware.ts** - Route protection and role-based access

### Public Pages

- **app/track/page.tsx** - Public tracking page (enter tracking number)
- **app/api/track/route.ts** - Tracking API endpoint

### Admin Dashboard

- **app/dashboard/layout.tsx** - Dashboard layout with sidebar
- **app/dashboard/page.tsx** - Dashboard home
- **app/dashboard/shipments/page.tsx** - Shipments list
- **app/dashboard/shipments/new/page.tsx** - Create shipment form
- **app/dashboard/shipments/[id]/page.tsx** - Shipment details & update logs

### API Routes

- **app/api/dashboard/shipments/route.ts** - List & create shipments
- **app/api/dashboard/shipments/[id]/route.ts** - Get shipment details
- **app/api/dashboard/customers/route.ts** - List customers
- **app/api/dashboard/shipment-logs/route.ts** - Add tracking updates

### Validation

- **lib/validations.ts** - Zod schemas for all forms

## Environment Setup

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/shipment_db
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

## Database Setup

1. Create PostgreSQL database:

```bash
createdb shipment_db
```

2. Run migrations:

```bash
npx drizzle-kit push
```

3. Create admin user (manually in database or via API):

```sql
INSERT INTO users (email, password, name, role, is_active)
VALUES ('admin@example.com', 'password123', 'Admin User', 'admin', true);
```

## Installation

```bash
npm install
# or
bun install
```

## Running the App

```bash
npm run dev
# or
bun dev
```

Visit:

- **Public Tracking**: http://localhost:3000/track
- **Admin Login**: http://localhost:3000/auth/login
- **Dashboard**: http://localhost:3000/dashboard

## Features

### Public Features

- Enter tracking number to view shipment status
- See sender/receiver info
- View complete tracking history

### Admin Features

- Create shipments with item details and images
- Manage customers (senders/receivers)
- Update shipment status and location
- Add tracking logs with messages
- View all shipments with search/filter

### Authentication

- JWT-based authentication
- Role-based access control (admin/staff)
- Protected dashboard routes
- Automatic redirect to login

## TODO

- [ ] Email notifications on shipment creation
- [ ] Email notifications on status updates
- [ ] User management page (admin only)
- [ ] Customer management page
- [ ] Shipment statistics dashboard
- [ ] Export shipments to CSV
- [ ] Image upload for items
- [ ] SMS notifications
- [ ] Bcrypt password hashing (currently plain text for demo)
- [ ] Rate limiting on public tracking
- [ ] Audit logs for admin actions
