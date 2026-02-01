# Shiv Furniture - Backend API Documentation

**Base URL:** `http://localhost:3000/api`

This comprehensive API documentation is designed for frontend developers to integrate with the Shiv Furniture Backend.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [API Response Format](#api-response-format)
4. [Auth APIs](#auth-apis)
5. [Budget APIs](#budget-apis)
6. [Contact APIs](#contact-apis)
7. [Product APIs](#product-apis)
8. [Sales Order APIs](#sales-order-apis)
9. [Purchase Order APIs](#purchase-order-apis)
10. [Customer Invoice APIs](#customer-invoice-apis)
11. [Vendor Bill APIs](#vendor-bill-apis)
12. [Payment APIs](#payment-apis)
13. [Customer Portal APIs](#customer-portal-apis)
14. [Vendor Portal APIs](#vendor-portal-apis)
15. [Journal & Ledger APIs](#journal--ledger-apis)
16. [Data Models](#data-models)
17. [Enums & Constants](#enums--constants)
18. [Frontend Integration Guide](#frontend-integration-guide)

---

## Quick Start

```bash
# Start backend server
cd backend && npm start

# Server runs on http://localhost:3000

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shivfurniture.com","password":"admin123"}'
```

**Default Admin Credentials:**
- Email: `admin@shivfurniture.com`
- Password: `admin123`

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Login Flow
```javascript
// 1. Login to get token
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@shivfurniture.com',
    password: 'admin123'
  })
});
const { data } = await response.json();
const token = data.token;

// 2. Store token
localStorage.setItem('token', token);

// 3. Use token in requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
};
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### List Response (with Pagination)
```json
{
  "success": true,
  "message": "Items fetched successfully",
  "data": [ ... ],
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

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "errors": [{ "field": "email", "message": "Invalid email" }]
  }
}
```

---

## Auth APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/login` | Login user | Public |
| POST | `/auth/register` | Register new user | Public |
| GET | `/auth/me` | Get current user | Auth |
| PUT | `/auth/change-password` | Change password | Auth |
| POST | `/auth/reset-password` | Request password reset | Public |
| POST | `/auth/set-password` | Set new password | Public |

### POST /auth/login

**Request:**
```json
{
  "email": "admin@shivfurniture.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@shivfurniture.com",
      "role": "ADMIN",
      "name": "Admin User"
    }
  }
}
```

### POST /auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "CUSTOMER"
}
```

### GET /auth/me

**Response:**
```json
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

## Budget APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/budgets` | List all budgets | Admin |
| GET | `/budgets/:id` | Get budget by ID | Admin |
| POST | `/budgets` | Create budget | Admin |
| PUT | `/budgets/:id` | Update budget | Admin |
| DELETE | `/budgets/:id` | Delete budget | Admin |
| GET | `/budgets/:id/revisions` | Get budget revisions | Admin |
| GET | `/budgets/revisions/history` | Get all revision history | Admin |
| GET | `/budgets/report/vs-actual` | Budget vs Actual report | Admin |
| GET | `/budgets/report/vs-actual/download` | Download PDF report | Admin |
| GET | `/budgets/report/dashboard` | Budget dashboard | Admin |
| GET | `/budgets/report/achievement` | Budget achievement | Admin |
| GET | `/budgets/report/trend` | Budget trend | Admin |
| GET | `/budgets/report/cost-centers` | Cost center performance | Admin |

### GET /budgets

**Query Parameters:**
- `page` (number): Page number, default 1
- `limit` (number): Items per page, default 20
- `fiscal_year` (number): Filter by fiscal year
- `status` (string): ACTIVE or CLOSED
- `analytical_account_id` (uuid): Filter by cost center

**Response:**
```json
{
  "success": true,
  "message": "Budgets fetched successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Marketing Budget Q1 2025",
      "fiscal_year": 2025,
      "period_start": "2025-01-01",
      "period_end": "2025-03-31",
      "amount": "150000.00",
      "status": "ACTIVE",
      "analytical_account_id": "uuid",
      "analytical_account_name": "Marketing",
      "analytical_account_code": "MKT001",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### POST /budgets

**Request:**
```json
{
  "name": "Marketing Budget Q1 2025",
  "fiscal_year": 2025,
  "period_start": "2025-01-01",
  "period_end": "2025-03-31",
  "amount": 150000,
  "analytical_account_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### PUT /budgets/:id

**Request (with revision tracking):**
```json
{
  "amount": 175000,
  "reason": "Budget increased due to new marketing campaign"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Budget updated successfully",
  "data": {
    "id": "uuid",
    "name": "Marketing Budget Q1 2025",
    "amount": "175000.00",
    "revision_count": 2
  }
}
```

### GET /budgets/:id/revisions

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "budget_id": "uuid",
      "revision_number": 1,
      "previous_amount": "150000.00",
      "new_amount": "175000.00",
      "change_reason": "Budget increase for new campaign",
      "changed_by": "uuid",
      "changed_by_name": "Admin User",
      "changed_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### GET /budgets/report/dashboard

**Response:**
```json
{
  "success": true,
  "message": "Budget dashboard fetched successfully",
  "data": {
    "summary": {
      "total_budget": 675000,
      "total_expense": 125000,
      "total_revenue": 200000,
      "total_net_actual": 75000,
      "total_remaining": 550000,
      "overall_utilization": 18.52
    },
    "by_status": [
      { "status": "ACTIVE", "count": 5, "total_amount": "500000.00" },
      { "status": "CLOSED", "count": 2, "total_amount": "175000.00" }
    ],
    "top_utilized": [
      {
        "id": "uuid",
        "name": "Manufacturing Budget",
        "budget_amount": "150000.00",
        "actual_amount": "128250.00",
        "utilization_percent": 85.5,
        "remaining": "21750.00"
      }
    ]
  }
}
```

### GET /budgets/report/achievement?year=2025

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "budget_id": "uuid",
      "budget_name": "Marketing Q1",
      "analytical_account": "Marketing",
      "budget_amount": "150000.00",
      "actual_expense": "125000.00",
      "actual_revenue": "0.00",
      "net_actual": "125000.00",
      "achievement_percent": 83.33,
      "remaining": "25000.00",
      "status": "ON_TRACK"
    }
  ]
}
```

### GET /budgets/report/trend?year=2025

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "month": "2025-01",
      "month_name": "January",
      "total_budget": "225000.00",
      "total_expense": "45000.00",
      "total_revenue": "75000.00",
      "net_actual": "30000.00"
    },
    {
      "month": "2025-02",
      "month_name": "February",
      "total_budget": "225000.00",
      "total_expense": "52000.00",
      "total_revenue": "85000.00",
      "net_actual": "33000.00"
    }
  ]
}
```

### GET /budgets/report/cost-centers

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "analytical_account_id": "uuid",
      "analytical_account_code": "MFG001",
      "analytical_account_name": "Manufacturing",
      "total_allocated_budget": "300000.00",
      "total_expense": "185000.00",
      "total_revenue": "0.00",
      "budget_utilization": 61.67,
      "active_budgets": 2
    }
  ]
}
```

### GET /budgets/report/vs-actual/download

**Response:** PDF file download

```javascript
// Frontend code to download PDF
const response = await fetch('/api/budgets/report/vs-actual/download', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'budget-report.pdf';
a.click();
```

---

## Contact APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/contacts` | List all contacts | Admin |
| GET | `/contacts/:id` | Get contact by ID | Admin |
| POST | `/contacts` | Create contact | Admin |
| PUT | `/contacts/:id` | Update contact | Admin |
| DELETE | `/contacts/:id` | Delete contact | Admin |

### GET /contacts

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): CUSTOMER or VENDOR
- `search` (string): Search by name, email, phone
- `tag` (string): Filter by tag

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "ABC Furniture Store",
      "email": "abc@furniture.com",
      "phone": "9876543210",
      "address": "123 Market Street",
      "city": "Ahmedabad",
      "state": "Gujarat",
      "pincode": "380001",
      "contact_type": "CUSTOMER",
      "gst_number": "24AABCU9603R1ZP",
      "tag": "PREMIUM",
      "user_id": "uuid",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### POST /contacts

**Request:**
```json
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

## Product APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/products` | List all products | Admin |
| GET | `/products/:id` | Get product by ID | Admin |
| POST | `/products` | Create product | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |

### GET /products

**Query Parameters:**
- `page`, `limit`: Pagination
- `category_id` (uuid): Filter by category
- `search` (string): Search by name, SKU
- `is_active` (boolean): Filter active/inactive

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Executive Office Chair",
      "sku": "CHAIR-001",
      "description": "Premium ergonomic office chair",
      "category_id": "uuid",
      "category_name": "Office Furniture",
      "unit_price": "15000.00",
      "cost_price": "10000.00",
      "stock_quantity": 50,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### POST /products

**Request:**
```json
{
  "name": "Executive Office Chair",
  "sku": "CHAIR-001",
  "description": "Premium ergonomic office chair with lumbar support",
  "category_id": "uuid",
  "unit_price": 15000,
  "cost_price": 10000,
  "stock_quantity": 50
}
```

---

## Product Category APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/product-categories` | List all categories | Admin |
| GET | `/product-categories/:id` | Get category | Admin |
| POST | `/product-categories` | Create category | Admin |
| PUT | `/product-categories/:id` | Update category | Admin |
| DELETE | `/product-categories/:id` | Delete category | Admin |

### POST /product-categories

**Request:**
```json
{
  "name": "Office Furniture",
  "description": "Desks, chairs, and office accessories"
}
```

---

## Analytical Account APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/analytical-accounts` | List all accounts | Admin |
| POST | `/analytical-accounts` | Create account | Admin |
| PUT | `/analytical-accounts/:id` | Update account | Admin |
| DELETE | `/analytical-accounts/:id` | Delete account | Admin |

### POST /analytical-accounts

**Request:**
```json
{
  "code": "MFG001",
  "name": "Manufacturing",
  "description": "Manufacturing department cost center"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "MFG001",
    "name": "Manufacturing",
    "description": "Manufacturing department cost center"
  }
}
```

---

## Sales Order APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/sales-orders` | List all sales orders | Admin |
| GET | `/sales-orders/:id` | Get order with lines | Admin |
| POST | `/sales-orders` | Create sales order | Admin |
| PATCH | `/sales-orders/:id/status` | Update status | Admin |
| GET | `/sales-orders/:id/download` | Download PDF | Admin |

### GET /sales-orders

**Query Parameters:**
- `page`, `limit`: Pagination
- `status` (string): DRAFT, POSTED, CANCELLED
- `customer_id` (uuid): Filter by customer
- `from_date`, `to_date` (string): Date range

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "SO-2025-000001",
      "customer_id": "uuid",
      "customer_name": "ABC Furniture Store",
      "order_date": "2025-01-15",
      "expected_date": "2025-01-20",
      "status": "DRAFT",
      "total_amount": "30000.00",
      "notes": "Urgent delivery required",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### GET /sales-orders/:id

**Response (with line items):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "SO-2025-000001",
    "customer_id": "uuid",
    "customer": {
      "id": "uuid",
      "name": "ABC Furniture Store",
      "email": "abc@furniture.com",
      "phone": "9876543210",
      "address": "123 Market Street"
    },
    "order_date": "2025-01-15",
    "expected_date": "2025-01-20",
    "status": "DRAFT",
    "total_amount": "30000.00",
    "notes": "Urgent delivery",
    "lines": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "product_name": "Executive Office Chair",
        "product_sku": "CHAIR-001",
        "quantity": 2,
        "unit_price": "15000.00",
        "amount": "30000.00",
        "analytical_account_id": "uuid",
        "analytical_account_name": "Sales"
      }
    ]
  }
}
```

### POST /sales-orders

**Request:**
```json
{
  "customer_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_date": "2025-01-15",
  "expected_date": "2025-01-20",
  "notes": "Urgent delivery required",
  "lines": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440001",
      "quantity": 2,
      "unit_price": 15000
    },
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440002",
      "quantity": 1,
      "unit_price": 25000
    }
  ]
}
```

### PATCH /sales-orders/:id/status

**Request:**
```json
{
  "status": "POSTED"
}
```

**Allowed Transitions:**
- DRAFT → POSTED
- DRAFT → CANCELLED
- POSTED → CANCELLED

### GET /sales-orders/:id/download

**Response:** PDF file

**Frontend:**
```javascript
async function downloadSalesOrderPdf(orderId, orderNumber) {
  const response = await fetch(`/api/sales-orders/${orderId}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${orderNumber}.pdf`;
  a.click();
}
```

---

## Purchase Order APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/purchase-orders` | List all purchase orders | Admin |
| GET | `/purchase-orders/:id` | Get order with lines | Admin |
| POST | `/purchase-orders` | Create purchase order | Admin |
| PATCH | `/purchase-orders/:id/status` | Update status | Admin |
| GET | `/purchase-orders/:id/download` | Download PDF | Admin |

### POST /purchase-orders

**Request:**
```json
{
  "vendor_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_date": "2025-01-15",
  "expected_date": "2025-01-25",
  "notes": "Raw materials for Q1 production",
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

## Customer Invoice APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/customer-invoices` | List all invoices | Admin |
| GET | `/customer-invoices/:id` | Get invoice with lines | Admin |
| POST | `/customer-invoices` | Create invoice | Admin |
| PATCH | `/customer-invoices/:id/status` | Update status | Admin |
| GET | `/customer-invoices/:id/download` | Download PDF | Admin |

### GET /customer-invoices

**Query Parameters:**
- `page`, `limit`: Pagination
- `status` (string): DRAFT, POSTED, CANCELLED
- `payment_status` (string): NOT_PAID, PARTIALLY_PAID, PAID
- `customer_id` (uuid): Filter by customer
- `from_date`, `to_date` (string): Date range
- `overdue` (boolean): Show overdue invoices only

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-2025-000001",
      "customer_id": "uuid",
      "customer_name": "ABC Furniture Store",
      "sales_order_id": "uuid",
      "sales_order_number": "SO-2025-000001",
      "invoice_date": "2025-01-15",
      "due_date": "2025-02-15",
      "status": "POSTED",
      "payment_status": "PARTIALLY_PAID",
      "total_amount": "30000.00",
      "paid_amount": "15000.00",
      "notes": "Payment terms: 30 days"
    }
  ]
}
```

### POST /customer-invoices

**Request:**
```json
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

---

## Vendor Bill APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/vendor-bills` | List all bills | Admin |
| GET | `/vendor-bills/:id` | Get bill with lines | Admin |
| POST | `/vendor-bills` | Create bill | Admin |
| PATCH | `/vendor-bills/:id/status` | Update status | Admin |
| GET | `/vendor-bills/:id/download` | Download PDF | Admin |

### POST /vendor-bills

**Request:**
```json
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

## Payment APIs

### Customer Payments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/customer-payments` | List all payments | Admin |
| GET | `/customer-payments/:id` | Get payment details | Admin |
| POST | `/customer-payments` | Record payment | Admin |

### POST /customer-payments

**Request:**
```json
{
  "customer_invoice_id": "uuid",
  "amount": 15000,
  "payment_date": "2025-01-20",
  "payment_method": "BANK_TRANSFER",
  "reference": "TXN123456789",
  "notes": "Partial payment - 50%"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "id": "uuid",
    "payment_number": "CPAY-2025-000001",
    "customer_invoice_id": "uuid",
    "invoice_number": "INV-2025-000001",
    "amount": "15000.00",
    "payment_date": "2025-01-20",
    "payment_method": "BANK_TRANSFER",
    "reference": "TXN123456789",
    "invoice_total": "30000.00",
    "invoice_paid_amount": "15000.00",
    "invoice_payment_status": "PARTIALLY_PAID"
  }
}
```

### Vendor Payments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/vendor-payments` | List all payments | Admin |
| GET | `/vendor-payments/:id` | Get payment details | Admin |
| POST | `/vendor-payments` | Record payment | Admin |

### POST /vendor-payments

**Request:**
```json
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

## Customer Portal APIs

**Access:** Authenticated users with `CUSTOMER` role linked to a contact

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customer/invoices` | List my invoices |
| GET | `/customer/invoices/:id` | Get my invoice details |
| GET | `/customer/invoices/:id/download` | Download invoice PDF |
| GET | `/customer/sales-orders` | List my sales orders |
| GET | `/customer/sales-orders/:id` | Get my sales order |
| GET | `/customer/sales-orders/:id/download` | Download SO PDF |

### GET /customer/invoices

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: DRAFT, POSTED, CANCELLED
- `payment_status`: NOT_PAID, PARTIALLY_PAID, PAID

**Response:** Only invoices belonging to the logged-in customer's contact

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-2025-000001",
      "invoice_date": "2025-01-15",
      "due_date": "2025-02-15",
      "status": "POSTED",
      "payment_status": "NOT_PAID",
      "total_amount": "30000.00",
      "paid_amount": "0.00",
      "lines": [
        {
          "product_name": "Executive Chair",
          "quantity": 2,
          "unit_price": "15000.00",
          "amount": "30000.00"
        }
      ]
    }
  ]
}
```

---

## Vendor Portal APIs

**Access:** Authenticated users with `CUSTOMER` role linked to a VENDOR contact

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vendor/dashboard` | Vendor dashboard summary |
| GET | `/vendor/bills` | List my bills |
| GET | `/vendor/bills/:id` | Get my bill details |
| GET | `/vendor/bills/:id/download` | Download bill PDF |
| GET | `/vendor/purchase-orders` | List my purchase orders |
| GET | `/vendor/purchase-orders/:id` | Get my purchase order |
| GET | `/vendor/purchase-orders/:id/download` | Download PO PDF |

### GET /vendor/dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_bills": 15,
      "total_amount": "750000.00",
      "pending_amount": "250000.00",
      "paid_amount": "500000.00",
      "total_purchase_orders": 20
    },
    "recent_bills": [
      {
        "id": "uuid",
        "bill_number": "BILL-2025-000001",
        "bill_date": "2025-01-15",
        "total_amount": "50000.00",
        "payment_status": "NOT_PAID"
      }
    ],
    "recent_purchase_orders": [
      {
        "id": "uuid",
        "order_number": "PO-2025-000001",
        "order_date": "2025-01-10",
        "total_amount": "50000.00",
        "status": "POSTED"
      }
    ]
  }
}
```

---

## Journal & Ledger APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/journals` | List all journals | Admin |
| GET | `/journals/:id` | Get journal | Admin |
| POST | `/journals` | Create journal | Admin |
| GET | `/ledger/entries` | List ledger entries | Admin |
| GET | `/ledger/entries/:id` | Get entry with lines | Admin |
| POST | `/ledger/entries` | Create entry | Admin |
| PATCH | `/ledger/entries/:id/status` | Update status | Admin |

### GET /ledger/entries

**Query Parameters:**
- `journal_id` (uuid): Filter by journal
- `status`: DRAFT, POSTED
- `from_date`, `to_date`: Date range
- `reference`: Search by reference

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "entry_number": "JE-2025-000001",
      "journal_id": "uuid",
      "journal_name": "Sales Journal",
      "entry_date": "2025-01-15",
      "reference": "INV-2025-000001",
      "description": "Sales invoice",
      "status": "POSTED",
      "total_debit": "30000.00",
      "total_credit": "30000.00",
      "lines": [
        {
          "id": "uuid",
          "account_code": "1100",
          "account_name": "Accounts Receivable",
          "debit": "30000.00",
          "credit": "0.00",
          "analytical_account_id": "uuid",
          "analytical_account_name": "Sales"
        },
        {
          "id": "uuid",
          "account_code": "4000",
          "account_name": "Sales Revenue",
          "debit": "0.00",
          "credit": "30000.00",
          "analytical_account_id": "uuid",
          "analytical_account_name": "Sales"
        }
      ]
    }
  ]
}
```

---

## Data Models

### User
```typescript
interface User {
  id: string;           // UUID
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
  is_active: boolean;
  created_at: string;   // ISO 8601
  updated_at: string;
}
```

### Contact
```typescript
interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contact_type: 'CUSTOMER' | 'VENDOR';
  gst_number: string | null;
  tag: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### Product
```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category_id: string;
  unit_price: string;      // Decimal as string
  cost_price: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Budget
```typescript
interface Budget {
  id: string;
  name: string;
  fiscal_year: number;
  period_start: string;    // YYYY-MM-DD
  period_end: string;
  amount: string;
  status: 'ACTIVE' | 'CLOSED';
  analytical_account_id: string;
  created_at: string;
  updated_at: string;
}
```

### BudgetRevision
```typescript
interface BudgetRevision {
  id: string;
  budget_id: string;
  revision_number: number;
  previous_amount: string;
  new_amount: string;
  change_reason: string | null;
  changed_by: string;
  changed_at: string;
}
```

### SalesOrder / PurchaseOrder
```typescript
interface Order {
  id: string;
  order_number: string;
  customer_id: string;      // vendor_id for PO
  order_date: string;
  expected_date: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  total_amount: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lines: OrderLine[];
}

interface OrderLine {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  amount: string;
  analytical_account_id: string | null;
}
```

### CustomerInvoice / VendorBill
```typescript
interface Invoice {
  id: string;
  invoice_number: string;   // bill_number for Bill
  customer_id: string;      // vendor_id for Bill
  sales_order_id: string | null;
  invoice_date: string;
  due_date: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  payment_status: 'NOT_PAID' | 'PARTIALLY_PAID' | 'PAID';
  total_amount: string;
  paid_amount: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lines: InvoiceLine[];
}

interface InvoiceLine {
  id: string;
  invoice_id: string;
  product_id: string;
  description: string | null;
  quantity: number;
  unit_price: string;
  amount: string;
  analytical_account_id: string | null;
}
```

### Payment
```typescript
interface Payment {
  id: string;
  payment_number: string;
  invoice_id: string;       // customer_invoice_id or vendor_bill_id
  amount: string;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
}
```

---

## Enums & Constants

### Document Status
```javascript
const DOCUMENT_STATUS = {
  DRAFT: 'DRAFT',           // Can be edited
  POSTED: 'POSTED',         // Finalized, creates accounting entries
  CANCELLED: 'CANCELLED'    // Voided
};
```

### Payment Status
```javascript
const PAYMENT_STATUS = {
  NOT_PAID: 'NOT_PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID'
};
```

### Contact Type
```javascript
const CONTACT_TYPE = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR'
};
```

### User Role
```javascript
const USER_ROLE = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER'
};
```

### Budget Status
```javascript
const BUDGET_STATUS = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED'
};
```

### Payment Methods
```javascript
const PAYMENT_METHOD = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHECK: 'CHECK',
  UPI: 'UPI',
  CARD: 'CARD'
};
```

---

## Frontend Integration Guide

### 1. API Client Setup

```javascript
// src/api/client.js
const API_BASE = 'http://localhost:3000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API Error');
    }

    return data;
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url);
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async downloadFile(endpoint, filename) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const api = new ApiClient();
```

### 2. Auth Context (React)

```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      if (localStorage.getItem('token')) {
        const { data } = await api.get('/auth/me');
        setUser(data);
      }
    } catch (error) {
      api.clearToken();
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    api.setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    api.clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 3. Suggested Page Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── ResetPassword.jsx
│   ├── dashboard/
│   │   └── Dashboard.jsx
│   ├── budgets/
│   │   ├── BudgetList.jsx
│   │   ├── BudgetForm.jsx
│   │   ├── BudgetDetail.jsx
│   │   └── BudgetReports.jsx
│   ├── contacts/
│   │   ├── ContactList.jsx
│   │   └── ContactForm.jsx
│   ├── products/
│   │   ├── ProductList.jsx
│   │   └── ProductForm.jsx
│   ├── sales/
│   │   ├── SalesOrderList.jsx
│   │   ├── SalesOrderForm.jsx
│   │   └── SalesOrderDetail.jsx
│   ├── purchases/
│   │   ├── PurchaseOrderList.jsx
│   │   ├── PurchaseOrderForm.jsx
│   │   └── PurchaseOrderDetail.jsx
│   ├── invoices/
│   │   ├── InvoiceList.jsx
│   │   ├── InvoiceForm.jsx
│   │   └── InvoiceDetail.jsx
│   ├── bills/
│   │   ├── BillList.jsx
│   │   ├── BillForm.jsx
│   │   └── BillDetail.jsx
│   ├── payments/
│   │   ├── CustomerPayments.jsx
│   │   └── VendorPayments.jsx
│   └── portal/
│       ├── customer/
│       │   ├── CustomerDashboard.jsx
│       │   ├── MyInvoices.jsx
│       │   └── MySalesOrders.jsx
│       └── vendor/
│           ├── VendorDashboard.jsx
│           ├── MyBills.jsx
│           └── MyPurchaseOrders.jsx
├── components/
│   ├── common/
│   │   ├── DataTable.jsx
│   │   ├── Pagination.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorMessage.jsx
│   ├── forms/
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── DatePicker.jsx
│   │   └── LineItems.jsx
│   ├── charts/
│   │   ├── BudgetChart.jsx
│   │   ├── TrendChart.jsx
│   │   └── PieChart.jsx
│   └── layout/
│       ├── Header.jsx
│       ├── Sidebar.jsx
│       └── Layout.jsx
└── api/
    ├── client.js
    ├── budgets.js
    ├── contacts.js
    ├── products.js
    ├── salesOrders.js
    ├── purchaseOrders.js
    ├── invoices.js
    ├── bills.js
    └── payments.js
```

### 4. Example: Budget Dashboard Component

```javascript
// src/pages/budgets/BudgetReports.jsx
import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BarChart, LineChart } from '../../components/charts';

export default function BudgetReports() {
  const [dashboard, setDashboard] = useState(null);
  const [trend, setTrend] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [year]);

  async function loadData() {
    setLoading(true);
    try {
      const [dashboardRes, trendRes] = await Promise.all([
        api.get('/budgets/report/dashboard'),
        api.get('/budgets/report/trend', { year })
      ]);
      setDashboard(dashboardRes.data);
      setTrend(trendRes.data);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function downloadReport() {
    await api.downloadFile('/budgets/report/vs-actual/download', 'budget-report.pdf');
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="budget-reports">
      <div className="header">
        <h1>Budget Reports</h1>
        <button onClick={downloadReport}>Download PDF</button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="card">
          <h3>Total Budget</h3>
          <p className="amount">₹{dashboard.summary.total_budget.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Total Expense</h3>
          <p className="amount">₹{dashboard.summary.total_expense.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Total Revenue</h3>
          <p className="amount">₹{dashboard.summary.total_revenue.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Utilization</h3>
          <p className="amount">{dashboard.summary.overall_utilization.toFixed(1)}%</p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="chart-container">
        <h2>Monthly Trend</h2>
        <LineChart
          data={trend}
          xKey="month_name"
          lines={[
            { key: 'total_budget', label: 'Budget', color: '#3b82f6' },
            { key: 'total_expense', label: 'Expense', color: '#ef4444' },
            { key: 'total_revenue', label: 'Revenue', color: '#22c55e' }
          ]}
        />
      </div>

      {/* Top Utilized */}
      <div className="top-utilized">
        <h2>Top Utilized Budgets</h2>
        <table>
          <thead>
            <tr>
              <th>Budget</th>
              <th>Amount</th>
              <th>Actual</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.top_utilized.map(budget => (
              <tr key={budget.id}>
                <td>{budget.name}</td>
                <td>₹{parseFloat(budget.budget_amount).toLocaleString()}</td>
                <td>₹{parseFloat(budget.actual_amount).toLocaleString()}</td>
                <td>
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{ width: `${budget.utilization_percent}%` }}
                    />
                    <span>{budget.utilization_percent.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 5. Example: Sales Order Form

```javascript
// src/pages/sales/SalesOrderForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export default function SalesOrderForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    notes: '',
    lines: [{ product_id: '', quantity: 1, unit_price: 0 }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    const [customersRes, productsRes] = await Promise.all([
      api.get('/contacts', { type: 'CUSTOMER', limit: 100 }),
      api.get('/products', { is_active: true, limit: 100 })
    ]);
    setCustomers(customersRes.data);
    setProducts(productsRes.data);
  }

  function addLine() {
    setForm(prev => ({
      ...prev,
      lines: [...prev.lines, { product_id: '', quantity: 1, unit_price: 0 }]
    }));
  }

  function removeLine(index) {
    setForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  }

  function updateLine(index, field, value) {
    setForm(prev => {
      const lines = [...prev.lines];
      lines[index] = { ...lines[index], [field]: value };
      
      // Auto-fill price when product selected
      if (field === 'product_id') {
        const product = products.find(p => p.id === value);
        if (product) {
          lines[index].unit_price = parseFloat(product.unit_price);
        }
      }
      
      return { ...prev, lines };
    });
  }

  function calculateTotal() {
    return form.lines.reduce((sum, line) => {
      return sum + (line.quantity * line.unit_price);
    }, 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/sales-orders', form);
      navigate(`/sales-orders/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sales-order-form">
      <h1>New Sales Order</h1>
      
      {error && <div className="error">{error}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label>Customer *</label>
          <select
            value={form.customer_id}
            onChange={e => setForm({ ...form, customer_id: e.target.value })}
            required
          >
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Order Date *</label>
          <input
            type="date"
            value={form.order_date}
            onChange={e => setForm({ ...form, order_date: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Expected Date</label>
          <input
            type="date"
            value={form.expected_date}
            onChange={e => setForm({ ...form, expected_date: e.target.value })}
          />
        </div>
      </div>

      <div className="lines-section">
        <h2>Order Lines</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {form.lines.map((line, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={line.product_id}
                    onChange={e => updateLine(index, 'product_id', e.target.value)}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={e => updateLine(index, 'quantity', parseInt(e.target.value))}
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_price}
                    onChange={e => updateLine(index, 'unit_price', parseFloat(e.target.value))}
                    required
                  />
                </td>
                <td>₹{(line.quantity * line.unit_price).toLocaleString()}</td>
                <td>
                  {form.lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(index)}>×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3"><strong>Total</strong></td>
              <td><strong>₹{calculateTotal().toLocaleString()}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <button type="button" onClick={addLine}>+ Add Line</button>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={() => navigate(-1)}>Cancel</button>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Sales Order'}
        </button>
      </div>
    </form>
  );
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `BAD_REQUEST` | 400 | Business logic error |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Quick Reference: All Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
PUT    /api/auth/change-password
```

### Budgets
```
GET    /api/budgets
GET    /api/budgets/:id
POST   /api/budgets
PUT    /api/budgets/:id
DELETE /api/budgets/:id
GET    /api/budgets/:id/revisions
GET    /api/budgets/revisions/history
GET    /api/budgets/report/vs-actual
GET    /api/budgets/report/vs-actual/download
GET    /api/budgets/report/dashboard
GET    /api/budgets/report/achievement
GET    /api/budgets/report/trend
GET    /api/budgets/report/cost-centers
```

### Contacts
```
GET    /api/contacts
GET    /api/contacts/:id
POST   /api/contacts
PUT    /api/contacts/:id
DELETE /api/contacts/:id
```

### Products
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Product Categories
```
GET    /api/product-categories
POST   /api/product-categories
PUT    /api/product-categories/:id
DELETE /api/product-categories/:id
```

### Analytical Accounts
```
GET    /api/analytical-accounts
POST   /api/analytical-accounts
PUT    /api/analytical-accounts/:id
DELETE /api/analytical-accounts/:id
```

### Sales Orders
```
GET    /api/sales-orders
GET    /api/sales-orders/:id
POST   /api/sales-orders
PATCH  /api/sales-orders/:id/status
GET    /api/sales-orders/:id/download
```

### Purchase Orders
```
GET    /api/purchase-orders
GET    /api/purchase-orders/:id
POST   /api/purchase-orders
PATCH  /api/purchase-orders/:id/status
GET    /api/purchase-orders/:id/download
```

### Customer Invoices
```
GET    /api/customer-invoices
GET    /api/customer-invoices/:id
POST   /api/customer-invoices
PATCH  /api/customer-invoices/:id/status
GET    /api/customer-invoices/:id/download
```

### Vendor Bills
```
GET    /api/vendor-bills
GET    /api/vendor-bills/:id
POST   /api/vendor-bills
PATCH  /api/vendor-bills/:id/status
GET    /api/vendor-bills/:id/download
```

### Customer Payments
```
GET    /api/customer-payments
GET    /api/customer-payments/:id
POST   /api/customer-payments
```

### Vendor Payments
```
GET    /api/vendor-payments
GET    /api/vendor-payments/:id
POST   /api/vendor-payments
```

### Customer Portal
```
GET    /api/customer/invoices
GET    /api/customer/invoices/:id
GET    /api/customer/invoices/:id/download
GET    /api/customer/sales-orders
GET    /api/customer/sales-orders/:id
GET    /api/customer/sales-orders/:id/download
```

### Vendor Portal
```
GET    /api/vendor/dashboard
GET    /api/vendor/bills
GET    /api/vendor/bills/:id
GET    /api/vendor/bills/:id/download
GET    /api/vendor/purchase-orders
GET    /api/vendor/purchase-orders/:id
GET    /api/vendor/purchase-orders/:id/download
```

### Journals & Ledger
```
GET    /api/journals
GET    /api/journals/:id
POST   /api/journals
GET    /api/ledger/entries
GET    /api/ledger/entries/:id
POST   /api/ledger/entries
PATCH  /api/ledger/entries/:id/status
```

---

**Last Updated:** January 31, 2026
