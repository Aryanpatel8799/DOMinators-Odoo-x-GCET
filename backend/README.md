# Shiv Furniture - Budget Accounting System Backend

A production-ready backend for a comprehensive Budget Accounting System built with **Node.js**, **Express.js**, and **PostgreSQL**. This system provides enterprise-grade accounting features including budget management, sales/purchase orders, invoicing, payments, and detailed financial reporting.

**📖 Detailed API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Features](#features)
6. [API Overview](#api-overview)
7. [Authentication](#authentication)
8. [Installation & Setup](#installation--setup)
9. [Running the Server](#running-the-server)
10. [Database Schema](#database-schema)
11. [Configuration Files](#configuration-files)
12. [Error Handling](#error-handling)
13. [API Response Format](#api-response-format)

---

## Quick Start

```bash
# Clone repository and navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and configuration details

# Initialize database and run migrations
npm run db:init

# Seed initial data
npm run db:seed

# Start the server
npm start
```

**Server URL:** `http://localhost:3000`  
**API Base URL:** `http://localhost:3000/api`  
**Health Check:** `GET http://localhost:3000/`

**Default Admin Credentials:**
- Email: `admin@shivfurniture.com`
- Password: `admin123`

---

## Environment Variables

Create a `.env` file in the backend root directory with the following variables:

### Database Configuration
```env
# PostgreSQL Connection
DB_HOST=localhost          # Database host (default: localhost)
DB_PORT=5432              # PostgreSQL port (default: 5432)
DB_NAME=shiv_furniture    # Database name
DB_USER=postgres          # Database username
DB_PASSWORD=password      # Database password
```

### Server Configuration
```env
# Server Settings
PORT=3000                 # Server port (default: 3000)
NODE_ENV=development      # Environment: development, production
```

### JWT Authentication
```env
# JWT Configuration
JWT_SECRET=your_secret_key_here              # Secret key for signing tokens (min 32 chars)
JWT_EXPIRES_IN=24h                           # Token expiration time (default: 24h)
JWT_RESET_EXPIRES_IN=1h                      # Password reset token expiration (default: 1h)
```

### Email Configuration
```env
# Email Service (Nodemailer)
EMAIL_HOST=smtp.gmail.com                    # SMTP server
EMAIL_PORT=587                               # SMTP port
EMAIL_USER=your-email@gmail.com              # Email account
EMAIL_PASSWORD=your-app-password             # Email password (use app-specific password for Gmail)
EMAIL_FROM=noreply@shivfurniture.com         # From email address
```

### Frontend URL
```env
# Frontend Configuration
FRONTEND_URL=http://localhost:3000           # Frontend base URL for email links
```

### Example .env file
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shiv_furniture
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_very_long_secret_key_minimum_32_characters_required
JWT_EXPIRES_IN=24h
JWT_RESET_EXPIRES_IN=1h

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@shivfurniture.com

# Frontend
FRONTEND_URL=http://localhost:3001
```

---

## Project Structure

```
backend/
├── src/
│   ├── app.js                          # Express application entry point
│   ├── config/
│   │   ├── constants.js                # Application constants (roles, statuses, etc.)
│   │   ├── database.js                 # PostgreSQL connection pool configuration
│   │   └── email.js                    # Nodemailer SMTP configuration
│   ├── controllers/                    # Request handlers for routes
│   │   ├── analyticalAccountController.js
│   │   ├── authController.js
│   │   ├── autoAnalyticalModelController.js
│   │   ├── budgetController.js
│   │   ├── contactController.js
│   │   ├── customerController.js
│   │   ├── customerInvoiceController.js
│   │   ├── productController.js
│   │   ├── purchaseOrderController.js
│   │   ├── salesOrderController.js
│   │   ├── vendorBillController.js
│   │   └── vendorController.js
│   ├── database/
│   │   ├── init.js                     # Database initialization script
│   │   ├── schema.sql                  # Database schema definition
│   │   ├── seed.js                     # Seed script for initial data
│   │   └── migrations/
│   │       ├── 001_critical_fixes.sql  # Critical bug fixes migration
│   │       └── 002_feature_additions.sql # New features migration
│   ├── middlewares/
│   │   ├── auth.js                     # JWT authentication middleware
│   │   ├── errorHandler.js             # Global error handling middleware
│   │   ├── index.js                    # Middleware exports
│   │   └── validate.js                 # Request validation middleware
│   ├── repositories/                   # Data access layer
│   │   ├── analyticalAccountRepository.js
│   │   ├── autoAnalyticalModelRepository.js
│   │   ├── budgetRepository.js
│   │   ├── budgetRevisionRepository.js
│   │   ├── contactRepository.js
│   │   ├── customerInvoiceRepository.js
│   │   ├── paymentRepository.js
│   │   ├── productRepository.js
│   │   ├── purchaseOrderRepository.js
│   │   ├── salesOrderRepository.js
│   │   ├── userRepository.js
│   │   ├── vendorBillRepository.js
│   │   └── index.js
│   ├── routes/                         # API route definitions
│   │   ├── analyticalAccountRoutes.js
│   │   ├── authRoutes.js
│   │   ├── autoAnalyticalModelRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── customerInvoiceRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── productCategoryRoutes.js
│   │   ├── productRoutes.js
│   │   ├── purchaseOrderRoutes.js
│   │   ├── salesOrderRoutes.js
│   │   ├── vendorBillRoutes.js
│   │   ├── vendorRoutes.js
│   │   └── index.js
│   ├── services/                       # Business logic layer
│   │   ├── authService.js
│   │   ├── autoAnalyticalService.js
│   │   ├── budgetService.js
│   │   ├── customerInvoiceService.js
│   │   ├── dependencyService.js
│   │   ├── emailService.js
│   │   ├── paymentService.js
│   │   ├── pdfService.js
│   │   ├── purchaseOrderService.js
│   │   ├── salesOrderService.js
│   │   ├── vendorBillService.js
│   │   └── index.js
│   ├── utils/
│   │   ├── errors.js                   # Custom error classes
│   │   ├── helpers.js                  # Helper utility functions
│   │   └── responseHandler.js          # API response formatting
│   ├── validations/
│   │   └── schemas.js                  # Zod validation schemas
│   └── postman/
│       └── Shiv_Furniture_API.postman_collection.json
├── package.json                        # Project dependencies and scripts
├── API_DOCUMENTATION.md                # Detailed API documentation
├── TEST_REPORT.md                      # Test reports
├── test_features.sh                    # Test automation script
└── README.md                           # This file
```

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Runtime** | Node.js | Latest LTS |
| **Framework** | Express.js | ^4.18.2 |
| **Database** | PostgreSQL | 13+ |
| **Authentication** | JWT (jsonwebtoken) | ^9.0.2 |
| **Encryption** | bcrypt | ^5.1.1 |
| **PDF Generation** | PDFKit | ^0.17.2 |
| **Email Service** | Nodemailer | ^6.9.7 |
| **Data Validation** | Zod | ^3.22.4 |
| **CORS** | cors | ^2.8.5 |
| **Environment** | dotenv | ^16.3.1 |
| **Database Driver** | pg | ^8.11.3 |
| **UUID Generation** | uuid | ^9.0.1 |
| **Development** | nodemon | ^3.0.2 |

---

## Features

### Core Accounting Features
- ✅ **Budget Management** with complete CRUD operations
- ✅ **Budget Revision Tracking** - Maintain change history with reason tracking
- ✅ **Budget vs Actual Reports** - Analyze budget performance
- ✅ **Budget Dashboard** - Overview of all budgets and utilization
- ✅ **Budget Achievement Reports** - Track budget achievement percentage
- ✅ **Trend Analysis** - Monthly/quarterly budget trends
- ✅ **Cost Center Management** - Analytical accounts for cost allocation

### Sales Management
- ✅ **Sales Orders** - Create and manage customer orders
- ✅ **Customer Invoices** - Generate invoices from sales orders
- ✅ **Invoice PDF Download** - Generate and download professional PDFs
- ✅ **Payment Tracking** - Record and track customer payments
- ✅ **Customer Portal** - Customers can view their invoices and orders

### Purchase Management
- ✅ **Purchase Orders** - Create and manage vendor orders
- ✅ **Vendor Bills** - Generate bills from purchase orders
- ✅ **Bill PDF Download** - Professional PDF generation
- ✅ **Vendor Payment Tracking** - Record payments to vendors
- ✅ **Vendor Portal** - Vendors can view their bills and orders

### Master Data
- ✅ **Contact Management** - Manage customers and vendors
- ✅ **Product Management** - Product catalog with SKU and pricing
- ✅ **Product Categories** - Organize products by category
- ✅ **Analytical Accounts** - Cost centers for budget allocation

### Financial Features
- ✅ **Journal Entries** - Record financial transactions
- ✅ **General Ledger** - View all accounting entries
- ✅ **Payment Management** - Track all customer and vendor payments
- ✅ **Financial Reports** - Comprehensive financial reporting

### Security & User Management
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control** - ADMIN and CUSTOMER roles
- ✅ **Password Hashing** - bcrypt with 10 salt rounds
- ✅ **Password Reset** - Email-based password reset functionality
- ✅ **Email Verification** - Email notifications for transactions

### Reports & Downloads
- ✅ **PDF Report Generation** - Using PDFKit
- ✅ **Budget Reports** - Budget vs Actual PDF
- ✅ **Transaction Reports** - Invoice, PO, Bill PDFs
- ✅ **Email Notifications** - Automated email alerts

---

## API Overview

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### API Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

#### List Response (with Pagination)
```json
{
  "success": true,
  "message": "Items fetched successfully",
  "data": [ ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "errors": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## Complete API Endpoints

### 1. Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/auth/login` | Login user | ❌ |
| POST | `/auth/register` | Register new user | ❌ |
| GET | `/auth/me` | Get current user info | ✅ |
| PUT | `/auth/change-password` | Change password | ✅ |
| POST | `/auth/reset-password` | Request password reset | ❌ |
| POST | `/auth/set-password` | Set new password with token | ❌ |

**POST /auth/login**
```json
Request:
{
  "email": "admin@shivfurniture.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@shivfurniture.com",
      "name": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

**POST /auth/register**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "CUSTOMER"
}
```

**GET /auth/me**
```json
Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@shivfurniture.com",
    "name": "Admin User",
    "role": "ADMIN",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 2. Budget Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/budgets` | List all budgets with pagination |
| GET | `/budgets/:id` | Get single budget details |
| POST | `/budgets` | Create new budget |
| PUT | `/budgets/:id` | Update budget (with revision tracking) |
| DELETE | `/budgets/:id` | Delete budget |
| GET | `/budgets/:id/revisions` | Get budget change history |
| GET | `/budgets/revisions/history` | Get all revisions across budgets |
| GET | `/budgets/report/dashboard` | Budget dashboard summary |
| GET | `/budgets/report/achievement` | Budget achievement metrics |
| GET | `/budgets/report/trend` | Budget trend analysis |
| GET | `/budgets/report/cost-centers` | Cost center performance |
| GET | `/budgets/report/vs-actual` | Budget vs Actual comparison |
| GET | `/budgets/report/vs-actual/download` | Download Budget Report PDF |

**POST /budgets**
```json
Request:
{
  "name": "Marketing Budget Q1 2025",
  "fiscal_year": 2025,
  "period_start": "2025-01-01",
  "period_end": "2025-03-31",
  "amount": 150000,
  "analytical_account_id": "uuid"
}
```

**GET /budgets?page=1&limit=20&fiscal_year=2025&status=ACTIVE**

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `fiscal_year` - Filter by year
- `status` - ACTIVE or CLOSED
- `analytical_account_id` - Filter by cost center

---

### 3. Contact Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts` | List all contacts |
| GET | `/contacts/:id` | Get contact details |
| POST | `/contacts` | Create new contact |
| PUT | `/contacts/:id` | Update contact |
| DELETE | `/contacts/:id` | Delete contact |

**POST /contacts**
```json
Request:
{
  "name": "ABC Furniture Store",
  "contact_type": "CUSTOMER",
  "email": "abc@furniture.com",
  "phone": "9876543210",
  "address": "123 Market Street",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "pincode": "380001",
  "gst_number": "24AABCU9603R1ZP",
  "tag": "PREMIUM"
}
```

---

### 4. Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products |
| GET | `/products/:id` | Get product details |
| POST | `/products` | Create new product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

**POST /products**
```json
Request:
{
  "name": "Executive Office Chair",
  "sku": "CHAIR-001",
  "description": "Premium ergonomic office chair",
  "category_id": "uuid",
  "unit_price": 15000,
  "cost_price": 10000,
  "stock_quantity": 50
}
```

---

### 5. Product Category Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/product-categories` | List all categories |
| GET | `/product-categories/:id` | Get category details |
| POST | `/product-categories` | Create category |
| PUT | `/product-categories/:id` | Update category |
| DELETE | `/product-categories/:id` | Delete category |

**POST /product-categories**
```json
Request:
{
  "name": "Office Furniture",
  "description": "Desks, chairs, and office accessories"
}
```

---

### 6. Analytical Account Endpoints (Cost Centers)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytical-accounts` | List all cost centers |
| GET | `/analytical-accounts/:id` | Get cost center details |
| POST | `/analytical-accounts` | Create cost center |
| PUT | `/analytical-accounts/:id` | Update cost center |
| DELETE | `/analytical-accounts/:id` | Delete cost center |

**POST /analytical-accounts**
```json
Request:
{
  "code": "MFG001",
  "name": "Manufacturing",
  "description": "Manufacturing department cost center"
}
```

---

### 7. Sales Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sales-orders` | List all sales orders |
| GET | `/sales-orders/:id` | Get order with line items |
| POST | `/sales-orders` | Create sales order |
| PATCH | `/sales-orders/:id/status` | Update order status |
| GET | `/sales-orders/:id/download` | Download order PDF |

**POST /sales-orders**
```json
Request:
{
  "customer_id": "uuid",
  "order_date": "2025-01-15",
  "expected_date": "2025-01-20",
  "notes": "Urgent delivery required",
  "lines": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 15000
    }
  ]
}
```

**Status Transitions:** DRAFT → POSTED → CANCELLED

---

### 8. Purchase Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-orders` | List all purchase orders |
| GET | `/purchase-orders/:id` | Get order with line items |
| POST | `/purchase-orders` | Create purchase order |
| PATCH | `/purchase-orders/:id/status` | Update order status |
| GET | `/purchase-orders/:id/download` | Download order PDF |

**POST /purchase-orders**
```json
Request:
{
  "vendor_id": "uuid",
  "order_date": "2025-01-15",
  "expected_date": "2025-01-25",
  "notes": "Raw materials for Q1",
  "lines": [
    {
      "product_id": "uuid",
      "quantity": 100,
      "unit_price": 500
    }
  ]
}
```

---

### 9. Customer Invoice Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer-invoices` | List all customer invoices |
| GET | `/customer-invoices/:id` | Get invoice with line items |
| POST | `/customer-invoices` | Create customer invoice |
| PATCH | `/customer-invoices/:id/status` | Update invoice status |
| GET | `/customer-invoices/:id/download` | Download invoice PDF |

**POST /customer-invoices**
```json
Request:
{
  "customer_id": "uuid",
  "sales_order_id": "uuid",
  "invoice_date": "2025-01-15",
  "due_date": "2025-02-15",
  "notes": "Payment terms: 30 days",
  "lines": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 15000,
      "description": "Executive Office Chair"
    }
  ]
}
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `status` - DRAFT, POSTED, CANCELLED
- `payment_status` - NOT_PAID, PARTIALLY_PAID, PAID
- `customer_id` - Filter by customer
- `from_date`, `to_date` - Date range
- `overdue` - Show overdue invoices only

---

### 10. Vendor Bill Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vendor-bills` | List all vendor bills |
| GET | `/vendor-bills/:id` | Get bill with line items |
| POST | `/vendor-bills` | Create vendor bill |
| PATCH | `/vendor-bills/:id/status` | Update bill status |
| GET | `/vendor-bills/:id/download` | Download bill PDF |

**POST /vendor-bills**
```json
Request:
{
  "vendor_id": "uuid",
  "purchase_order_id": "uuid",
  "bill_number": "VB-2025-001",
  "bill_date": "2025-01-15",
  "due_date": "2025-02-15",
  "notes": "Raw materials invoice",
  "lines": [
    {
      "product_id": "uuid",
      "quantity": 100,
      "unit_price": 500,
      "description": "Teak wood planks"
    }
  ]
}
```

---

### 11. Customer Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer-payments` | List all customer payments |
| GET | `/customer-payments/:id` | Get payment details |
| POST | `/customer-payments` | Record customer payment |

**POST /customer-payments**
```json
Request:
{
  "customer_invoice_id": "uuid",
  "amount": 15000,
  "payment_date": "2025-01-20",
  "payment_method": "BANK_TRANSFER",
  "reference": "TXN123456789",
  "notes": "Partial payment - 50%"
}
```

---

### 12. Vendor Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vendor-payments` | List all vendor payments |
| GET | `/vendor-payments/:id` | Get payment details |
| POST | `/vendor-payments` | Record vendor payment |

**POST /vendor-payments**
```json
Request:
{
  "vendor_bill_id": "uuid",
  "amount": 50000,
  "payment_date": "2025-01-25",
  "payment_method": "BANK_TRANSFER",
  "reference": "NEFT123456",
  "notes": "Full payment"
}
```

---

### 13. Customer Portal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/invoices` | List my invoices |
| GET | `/customer/invoices/:id` | Get my invoice |
| GET | `/customer/invoices/:id/download` | Download my invoice PDF |
| GET | `/customer/sales-orders` | List my sales orders |
| GET | `/customer/sales-orders/:id` | Get my sales order |
| GET | `/customer/sales-orders/:id/download` | Download my SO PDF |

**Note:** Only shows invoices/orders for the logged-in customer

---

### 14. Vendor Portal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vendor/dashboard` | Vendor dashboard summary |
| GET | `/vendor/bills` | List my bills |
| GET | `/vendor/bills/:id` | Get my bill details |
| GET | `/vendor/bills/:id/download` | Download my bill PDF |
| GET | `/vendor/purchase-orders` | List my purchase orders |
| GET | `/vendor/purchase-orders/:id` | Get my PO |
| GET | `/vendor/purchase-orders/:id/download` | Download my PO PDF |

---

### 15. Journal & Ledger Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journals` | List all journals |
| GET | `/journals/:id` | Get journal details |
| POST | `/journals` | Create journal |
| GET | `/ledger/entries` | List ledger entries |
| GET | `/ledger/entries/:id` | Get entry with lines |
| POST | `/ledger/entries` | Create journal entry |
| PATCH | `/ledger/entries/:id/status` | Update entry status |

**GET /ledger/entries?journal_id=uuid&status=POSTED&from_date=2025-01-01&to_date=2025-01-31**

---

## Authentication

### JWT Token Structure
The backend uses JWT (JSON Web Tokens) for authentication.

**Token Claims:**
- `id` - User UUID
- `email` - User email
- `role` - User role (ADMIN or CUSTOMER)
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

### Login Flow
```javascript
// 1. Login to get token
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@shivfurniture.com',
    password: 'admin123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// 2. Store token (localStorage or sessionStorage)
localStorage.setItem('authToken', token);

// 3. Include token in all subsequent requests
const apiHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
};

// 4. Example API call
const budgetsResponse = await fetch('http://localhost:3000/api/budgets', {
  method: 'GET',
  headers: apiHeaders
});
```

### Token Expiration
- Access Token: 24 hours (configurable via JWT_EXPIRES_IN)
- Password Reset Token: 1 hour (configurable via JWT_RESET_EXPIRES_IN)

### Roles & Permissions
- **ADMIN:** Full system access
- **CUSTOMER:** Access to own invoices, orders, and portal features

---

## Installation & Setup

### Prerequisites
- Node.js 14+ (LTS recommended)
- PostgreSQL 13+
- npm or yarn

### Step-by-Step Installation

**1. Clone and Navigate**
```bash
git clone <repository-url>
cd backend
```

**2. Install Dependencies**
```bash
npm install
```

**3. Configure Environment**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual configuration
nano .env  # or use your preferred editor
```

**4. Initialize Database**
```bash
# Create tables and apply schema
npm run db:init

# Seed initial data (admin user, sample data)
npm run db:seed
```

**5. Verify Installation**
```bash
# Start server
npm start

# Should output: "Server running on port 3000"
# Test: curl http://localhost:3000/
```

---

## Running the Server

### Development Mode
```bash
npm run dev
```
- Uses nodemon for auto-restart on file changes
- Logs all HTTP requests
- Pretty error output

### Production Mode
```bash
NODE_ENV=production npm start
```
- Optimized performance
- Minimal logging
- Error details hidden from API responses

### Environment-Specific Behavior
- **Development:** Request logging enabled, full error details shown
- **Production:** Minimal logging, sanitized error responses

---

## Database Schema

### Core Tables

**users**
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email address
- `password_hash` (VARCHAR) - bcrypt hashed password
- `name` (VARCHAR) - User name
- `role` (ENUM) - ADMIN or CUSTOMER
- `is_active` (BOOLEAN) - Account status
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**contacts**
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Contact name
- `contact_type` (ENUM) - CUSTOMER or VENDOR
- `email` (VARCHAR) - Email address
- `phone` (VARCHAR) - Phone number
- `address`, `city`, `state`, `pincode` - Address fields
- `gst_number` (VARCHAR) - GST registration
- `tag` (VARCHAR) - Classification tag
- `user_id` (UUID) - FK to user (for portal access)
- `created_at`, `updated_at`

**products**
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Product name
- `sku` (VARCHAR) - Stock keeping unit
- `description` (TEXT) - Product details
- `category_id` (UUID) - FK to product_categories
- `unit_price` (DECIMAL) - Selling price
- `cost_price` (DECIMAL) - Cost price
- `stock_quantity` (INTEGER) - Available stock
- `is_active` (BOOLEAN) - Active status
- `created_at`, `updated_at`

**budgets**
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Budget name
- `fiscal_year` (INTEGER) - Financial year
- `period_start`, `period_end` (DATE) - Budget period
- `amount` (DECIMAL) - Allocated budget
- `status` (ENUM) - ACTIVE or CLOSED
- `analytical_account_id` (UUID) - FK to cost center
- `created_at`, `updated_at`

**sales_orders**
- `id` (UUID) - Primary key
- `order_number` (VARCHAR) - Unique order reference
- `customer_id` (UUID) - FK to contacts
- `order_date` (DATE) - Order creation date
- `expected_date` (DATE) - Expected delivery
- `status` (ENUM) - DRAFT, POSTED, CANCELLED
- `total_amount` (DECIMAL) - Order total
- `notes` (TEXT) - Order notes
- `created_at`, `updated_at`

**purchase_orders**
- Similar structure to sales_orders
- References vendor contact

**customer_invoices**
- `id` (UUID) - Primary key
- `invoice_number` (VARCHAR) - Unique invoice reference
- `customer_id` (UUID) - FK to contacts
- `sales_order_id` (UUID) - FK to sales_orders
- `invoice_date` (DATE)
- `due_date` (DATE)
- `status` (ENUM) - DRAFT, POSTED, CANCELLED
- `payment_status` (ENUM) - NOT_PAID, PARTIALLY_PAID, PAID
- `total_amount` (DECIMAL)
- `paid_amount` (DECIMAL) - Amount received
- `notes` (TEXT)
- `created_at`, `updated_at`

**vendor_bills**
- Similar structure to customer_invoices
- References vendor contact

**customer_payments**
- `id` (UUID) - Primary key
- `payment_number` (VARCHAR) - Unique reference
- `customer_invoice_id` (UUID) - FK to customer_invoices
- `amount` (DECIMAL) - Payment amount
- `payment_date` (DATE)
- `payment_method` (VARCHAR)
- `reference` (VARCHAR) - Transaction reference
- `notes` (TEXT)
- `created_at`

**vendor_payments**
- Similar structure to customer_payments

**budget_revisions**
- `id` (UUID) - Primary key
- `budget_id` (UUID) - FK to budgets
- `revision_number` (INTEGER) - Revision sequence
- `previous_amount` (DECIMAL)
- `new_amount` (DECIMAL)
- `change_reason` (TEXT) - Reason for change
- `changed_by` (UUID) - FK to users
- `changed_at` (TIMESTAMP)

See [database/schema.sql](database/schema.sql) for complete schema definition.

---

## Configuration Files

### constants.js
Contains application-wide constants:

```javascript
{
  jwt: {
    secret,           // JWT signing secret
    expiresIn,        // Token expiration time
    resetExpiresIn    // Password reset token expiration
  },
  bcrypt: {
    saltRounds        // Bcrypt salt rounds (default: 10)
  },
  pagination: {
    defaultLimit,     // Default items per page (20)
    maxLimit          // Maximum items per page (100)
  },
  roles: {
    ADMIN: 'ADMIN',
    CUSTOMER: 'CUSTOMER'
  },
  documentStatus: {
    DRAFT: 'DRAFT',
    POSTED: 'POSTED',
    CANCELLED: 'CANCELLED'
  },
  paymentStatus: {
    NOT_PAID: 'NOT_PAID',
    PARTIALLY_PAID: 'PARTIALLY_PAID',
    PAID: 'PAID'
  },
  contactTypes: {
    CUSTOMER: 'CUSTOMER',
    VENDOR: 'VENDOR'
  }
}
```

### database.js
PostgreSQL connection configuration using connection pooling:
- Connection Pool: 20 max connections
- Idle Timeout: 30 seconds
- Connection Timeout: 2 seconds

### email.js
Nodemailer SMTP configuration for sending emails:
- Password reset notifications
- Invoice delivery
- Bill notifications
- Payment confirmations

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": {
    "code": "ERROR_CODE",
    "errors": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Common HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email or unique constraint |
| 422 | Unprocessable Entity | Validation error (Zod) |
| 500 | Internal Server Error | Server error |

### Error Codes
- `VALIDATION_ERROR` - Data validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `CONFLICT` - Duplicate resource
- `FOREIGN_KEY_VIOLATION` - Referenced resource doesn't exist
- `INTERNAL_SERVER_ERROR` - Unexpected server error

### Custom Error Classes
Located in [src/utils/errors.js](src/utils/errors.js):
- `AppError` - Base error class
- `ValidationError` - Validation failures
- `AuthenticationError` - Auth issues
- `AuthorizationError` - Permission issues
- `NotFoundError` - Resource not found
- `ConflictError` - Duplicate resource
- `InternalServerError` - Server errors

---

## Development Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Initialize database schema
npm run db:init

# Seed initial data
npm run db:seed

# Run tests (if configured)
npm test
```

---

## Testing

### Using Postman
Import the provided Postman collection:
```
File: src/postman/Shiv_Furniture_API.postman_collection.json
```

Steps:
1. Open Postman
2. Click "Import"
3. Select the collection file
4. Set environment variables (base_url, token, etc.)
5. Run requests

### Using cURL
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shivfurniture.com","password":"admin123"}'

# Get token from response, then use in requests:
TOKEN="<token_from_login>"

# List budgets
curl -X GET http://localhost:3000/api/budgets \
  -H "Authorization: Bearer $TOKEN"
```

### Automated Testing
```bash
# Run the test features script
bash test_features.sh
```

See [TEST_REPORT.md](TEST_REPORT.md) for test results.

---

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
Solution:
- Verify PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
- Ensure database exists

**2. JWT Secret Not Set**
```
Error: JWT_SECRET environment variable is required
```
Solution:
- Add JWT_SECRET to .env file (minimum 32 characters)

**3. Email Configuration Error**
```
Error: SMTP connection failed
```
Solution:
- Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD
- For Gmail: Use app-specific password, enable "Less secure apps"

**4. Port Already in Use**
```
Error: listen EADDRINUSE :::3000
```
Solution:
- Change PORT in .env
- Or kill process on port 3000: `lsof -ti:3000 | xargs kill -9`

**5. Validation Errors**
```
Error code: VALIDATION_ERROR
```
Solution:
- Check request body format
- Verify all required fields are present
- Check data types (string, number, date format)

---

## Performance Optimization

### Database
- Connection pooling configured (max 20 connections)
- Indexed columns for frequent queries
- Query optimization in repositories

### Caching
- Consider implementing Redis for frequently accessed data
- Cache budget reports
- Cache product catalog

### API
- Pagination enforced (max 100 items per request)
- Request body size limit: 10MB
- Gzip compression recommended in production

---

## Security Best Practices

1. **Environment Variables:** Never commit .env files
2. **JWT Secret:** Use strong, random secret (32+ characters)
3. **Password Hashing:** bcrypt with 10 rounds (production: 12)
4. **CORS:** Configure for specific domains in production
5. **HTTPS:** Always use HTTPS in production
6. **Rate Limiting:** Consider implementing in production
7. **Input Validation:** All inputs validated with Zod
8. **SQL Injection:** Using parameterized queries

---

## Support & Documentation

- **API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Test Report:** See [TEST_REPORT.md](./TEST_REPORT.md)
- **Postman Collection:** See [src/postman/](./src/postman/)

---

## License

ISC
| POST | `/api/customer-invoices` | Create invoice |
| GET | `/api/customer-invoices/:id/download` | Download PDF |

### Purchases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchase-orders` | List orders |
| POST | `/api/purchase-orders` | Create order |
| GET | `/api/purchase-orders/:id/download` | Download PDF |
| GET | `/api/vendor-bills` | List bills |
| POST | `/api/vendor-bills` | Create bill |
| GET | `/api/vendor-bills/:id/download` | Download PDF |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/customer-payments` | Record customer payment |
| POST | `/api/vendor-payments` | Record vendor payment |

### Customer Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer/invoices` | My invoices |
| GET | `/api/customer/sales-orders` | My sales orders |
| GET | `/api/customer/invoices/:id/download` | Download PDF |

### Vendor Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendor/dashboard` | Dashboard |
| GET | `/api/vendor/bills` | My bills |
| GET | `/api/vendor/purchase-orders` | My POs |
| GET | `/api/vendor/bills/:id/download` | Download PDF |

---

## Authentication

All protected endpoints require JWT token:

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { data } = await response.json();
const token = data.token;

// Use token
fetch('/api/budgets', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "error": { "code": "ERROR_CODE" }
}
```

---

## Project Structure

```
src/
├── app.js              # Entry point
├── config/             # Database, email config
├── controllers/        # Route handlers
├── middlewares/        # Auth, validation, errors
├── repositories/       # Database queries
├── routes/             # API routes
├── services/           # Business logic
├── utils/              # Helpers
├── validations/        # Zod schemas
└── database/
    ├── schema.sql      # DB schema
    ├── migrations/     # DB migrations
    └── seed.js         # Seed data
```

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=shiv_furniture
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## Database

### Initialize
```bash
npm run db:init    # Create tables
npm run db:seed    # Add sample data
```

### Key Tables
- `users` - User accounts
- `contacts` - Customers & Vendors
- `products` - Product catalog
- `budgets` - Budget definitions
- `budget_revisions` - Change history
- `sales_orders` - Sales orders
- `purchase_orders` - Purchase orders
- `customer_invoices` - Customer invoices
- `vendor_bills` - Vendor bills
- `customer_payments` - Customer payments
- `vendor_payments` - Vendor payments
- `journal_entries` - Accounting entries
- `analytical_accounts` - Cost centers

---

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shivfurniture.com","password":"admin123"}'

# Get budgets (with token)
curl http://localhost:3000/api/budgets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## License

ISC

---

**For complete API documentation including request/response examples, data models, and frontend integration guide, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**
