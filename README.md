# Shiv Furniture - Budget Accounting System

A production-ready full-stack Budget Accounting System built with **React**, **Node.js**, **Express.js**, and **PostgreSQL**. This enterprise-grade ERP system provides comprehensive accounting features including budget management, sales/purchase orders, invoicing, payments, customer/vendor portals, and detailed financial reporting.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Quick Start](#quick-start)
5. [Project Structure](#project-structure)
6. [Environment Variables](#environment-variables)
7. [Frontend](#frontend)
8. [Backend](#backend)
9. [API Overview](#api-overview)
10. [Database Schema](#database-schema)
11. [User Roles & Portals](#user-roles--portals)
12. [Screenshots](#screenshots)
13. [Contributing](#contributing)

---

## Overview

Shiv Furniture Budget Accounting System is a comprehensive ERP solution designed for furniture businesses. It provides:

- **Admin Portal**: Complete control over budgets, orders, invoices, and master data
- **Customer Portal**: Customers can view their invoices, orders, and make payments
- **Vendor Portal**: Vendors can view their bills and purchase orders

The system implements industry-standard accounting practices with budget validation, document status workflows, payment tracking, and comprehensive reporting.

---

## Features

### Budget Management
- Create, update, and delete budgets with analytical account allocation
- Budget revision tracking with reason history
- Budget vs Actual reports with variance analysis
- Budget dashboard with utilization metrics
- Budget achievement tracking and trend analysis
- Cost center performance monitoring

### Sales Management
- Sales order creation and management
- Auto-invoice generation on order confirmation
- Customer invoice management with PDF download
- Payment recording and tracking
- Sales order to invoice workflow

### Purchase Management
- Purchase order creation and management
- Vendor bill management with PDF download
- Vendor payment tracking
- Purchase order to bill workflow

### Master Data Management
- Contact management (Customers & Vendors)
- Product catalog with categories
- Analytical accounts (Cost Centers)
- Auto-analytical rules for automatic cost allocation

### Financial Features
- Journal entries and general ledger
- Payment management for invoices and bills
- PDF generation for all documents
- Email notifications for transactions

### Security
- JWT-based authentication
- Role-based access control (Admin, Customer, Vendor)
- Password hashing with bcrypt
- Email-based password reset

---

## Technology Stack

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | React | 18.3.1 |
| **Build Tool** | Vite | 6.3.5 |
| **UI Components** | Radix UI | Latest |
| **Styling** | Tailwind CSS | 4.1.12 |
| **Material UI** | MUI | 7.3.5 |
| **Charts** | Recharts | 2.15.2 |
| **Icons** | Lucide React | 0.487.0 |
| **Forms** | React Hook Form | 7.55.0 |
| **Date Handling** | date-fns | 3.6.0 |
| **Notifications** | Sonner | 2.0.3 |

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| **Runtime** | Node.js | Latest LTS |
| **Framework** | Express.js | 4.18.2 |
| **Database** | PostgreSQL | 13+ |
| **Authentication** | JWT | 9.0.2 |
| **Encryption** | bcrypt | 5.1.1 |
| **PDF Generation** | PDFKit | 0.17.2 |
| **Email** | Nodemailer | 6.9.7 |
| **Validation** | Zod | 3.22.4 |

---

## Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (v13+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/psbalwani/DOMinators-Odoo-x-GCET.git
cd DOMinators-Odoo-x-GCET
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run db:init

# Seed initial data
npm run db:seed

# Start backend server
npm start
```

### Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Configure environment
# Create .env file with VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

### Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| API Health Check | http://localhost:3000 |

### Default Credentials

**Admin Account:**
- Email: `admin@shivfurniture.com`
- Password: `admin123`

---

## Project Structure

```
DOMinators-Odoo-x-GCET/
├── frontend/                       # React Frontend Application
│   ├── src/
│   │   ├── api/                    # API client modules
│   │   │   ├── auth.js             # Authentication API
│   │   │   ├── budgets.js          # Budget API
│   │   │   ├── salesOrders.js      # Sales Order API
│   │   │   ├── purchaseOrders.js   # Purchase Order API
│   │   │   ├── customerInvoices.js # Invoice API
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── admin/              # Admin dashboard components
│   │   │   ├── auth/               # Login, Signup components
│   │   │   ├── customer/           # Customer portal components
│   │   │   ├── layout/             # Header, Sidebar components
│   │   │   ├── masters/            # Master data forms
│   │   │   ├── payments/           # Payment components
│   │   │   ├── reports/            # Report components
│   │   │   ├── transactions/       # Order & Invoice components
│   │   │   └── ui/                 # Reusable UI components
│   │   ├── constants/              # Application constants
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── styles/                 # Global styles
│   │   ├── utils/                  # Utility functions
│   │   ├── App.jsx                 # Main application component
│   │   └── main.jsx                # Application entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── postcss.config.mjs
│
├── backend/                        # Node.js Backend API
│   ├── src/
│   │   ├── app.js                  # Express application
│   │   ├── config/
│   │   │   ├── constants.js        # App constants
│   │   │   ├── database.js         # PostgreSQL config
│   │   │   └── email.js            # Email config
│   │   ├── controllers/            # Route handlers
│   │   ├── database/
│   │   │   ├── schema.sql          # Database schema
│   │   │   ├── seed.js             # Seed data
│   │   │   └── migrations/         # Database migrations
│   │   ├── middlewares/            # Express middlewares
│   │   ├── repositories/           # Data access layer
│   │   ├── routes/                 # API routes
│   │   ├── services/               # Business logic
│   │   ├── utils/                  # Utilities
│   │   └── validations/            # Request validation
│   ├── package.json
│   ├── API_DOCUMENTATION.md
│   └── TEST_REPORT.md
│
└── README.md                       # This file
```

---

## Environment Variables

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shiv_furniture
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h
JWT_RESET_EXPIRES_IN=1h

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@shivfurniture.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Frontend

### Key Features

1. **Responsive Admin Dashboard**
   - Budget summary with utilization charts
   - Recent transactions overview
   - Quick action buttons

2. **Master Data Management**
   - Contact management with customer/vendor filtering
   - Product catalog with category organization
   - Cost center (Analytical Accounts) management
   - Auto-analytical rules configuration

3. **Transaction Management**
   - Sales Order creation with line items
   - Purchase Order management
   - Customer Invoice generation
   - PDF download for all documents

4. **Customer Portal**
   - View invoices and payment status
   - View sales orders
   - Make payments (Stripe integration ready)

5. **Reports & Analytics**
   - Budget vs Actual reports
   - Budget trend analysis
   - Cost center performance

### Running Frontend

```bash
cd frontend
npm install
npm run dev      # Development mode
npm run build    # Production build
```

---

## Backend

### Key Features

1. **RESTful API**
   - Full CRUD operations for all entities
   - Proper HTTP status codes
   - Consistent response format

2. **Authentication & Authorization**
   - JWT token-based authentication
   - Role-based middleware (Admin, Customer, Vendor)
   - Secure password hashing

3. **Business Logic**
   - Budget validation (prevents over-budget transactions)
   - Document status workflows
   - Payment safety (prevents duplicate payments)
   - Auto-invoice generation

4. **PDF Generation**
   - Invoice PDFs
   - Purchase Order PDFs
   - Sales Order PDFs
   - Budget Report PDFs

5. **Email Notifications**
   - Welcome emails for new customers
   - Password reset emails
   - Invoice notifications

### Running Backend

```bash
cd backend
npm install
npm run db:init   # Initialize database
npm run db:seed   # Seed sample data
npm start         # Start server
npm run dev       # Development with nodemon
```

### API Documentation

See [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) for complete API reference.

---

## API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/reset-password` | Request password reset |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List all budgets |
| POST | `/api/budgets` | Create budget |
| GET | `/api/budgets/:id` | Get budget details |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/budgets/report/vs-actual` | Budget vs Actual report |
| GET | `/api/budgets/report/dashboard` | Budget dashboard |

### Sales Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales-orders` | List sales orders |
| POST | `/api/sales-orders` | Create sales order |
| GET | `/api/sales-orders/:id` | Get order details |
| PATCH | `/api/sales-orders/:id/status` | Update status |
| GET | `/api/sales-orders/:id/download` | Download PDF |

### Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchase-orders` | List purchase orders |
| POST | `/api/purchase-orders` | Create purchase order |
| GET | `/api/purchase-orders/:id` | Get order details |
| PATCH | `/api/purchase-orders/:id/status` | Update status |
| GET | `/api/purchase-orders/:id/download` | Download PDF |

### Customer Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer-invoices` | List invoices |
| POST | `/api/customer-invoices` | Create invoice |
| GET | `/api/customer-invoices/:id` | Get invoice details |
| PATCH | `/api/customer-invoices/:id/status` | Update status |
| GET | `/api/customer-invoices/:id/download` | Download PDF |

### Customer Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer/invoices` | My invoices |
| GET | `/api/customer/sales-orders` | My orders |
| GET | `/api/customer/invoices/:id/download` | Download invoice |

---

## Database Schema

### Core Tables

- **contacts** - Customers and vendors
- **products** - Product catalog
- **product_categories** - Product organization
- **analytical_accounts** - Cost centers

### Transaction Tables

- **sales_orders** - Customer orders
- **sales_order_lines** - Order line items
- **customer_invoices** - Customer invoices
- **customer_invoice_lines** - Invoice line items
- **purchase_orders** - Vendor orders
- **purchase_order_lines** - PO line items
- **vendor_bills** - Vendor invoices
- **vendor_bill_lines** - Bill line items

### Financial Tables

- **budgets** - Budget allocation
- **budget_revisions** - Budget change history
- **payments** - Payment records
- **journals** - Journal entries
- **ledger_entries** - General ledger

---

## User Roles & Portals

### Admin Portal
Full access to all features:
- Dashboard with business metrics
- Master data management
- Transaction processing
- Budget management
- Reports and analytics

### Customer Portal
Limited access for customers:
- View their invoices
- View their sales orders
- Download PDF documents
- Make payments

### Vendor Portal
Limited access for vendors:
- View their bills
- View their purchase orders
- Download PDF documents

---

## Screenshots

*Add screenshots of your application here*

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is developed for the Odoo x GCET Hackathon by Team DOMinators.

---

## Team

**Team DOMinators**
- Repository: [psbalwani/DOMinators-Odoo-x-GCET](https://github.com/psbalwani/DOMinators-Odoo-x-GCET)

---

## Support

For support or queries, please open an issue in the GitHub repository.
