# ERP Management System (MERN Stack)

A full-stack ERP web application for a mid-sized company. It manages products, customers, suppliers, sales orders, purchase orders, goods receipt notes (GRN), invoices and users, with secure login and role-based access.

> Built as part of my SKBrisk internship (Project 3).

## Live Demo

- Frontend: `<add Vercel URL here>`
- Backend API: `<add Render URL here>`

## Demo Login Accounts

These accounts are created by the seed script (`node seed.js`). Each role sees a different menu and dashboard.

| Role | Email | Password |
|---|---|---|
| Admin | admin@erp.com | Admin@123 |
| Sales | sales@erp.com | Sales@123 |
| Purchase | purchase@erp.com | Purchase@123 |
| Inventory | inventory@erp.com | Inventory@123 |

These passwords are for demo only. Change them before using the app for real work.

New users who register from the Register page get the **Sales** role. Only an Admin can change a user's role (User Management page).

## What the Application Does

The ERP connects a buying side and a selling side around one set of products.

1. **Login:** the user logs in and receives a JWT token. The token carries the user's role.
2. **Master data:** Admin or Inventory adds Products. Sales adds Customers. Purchase adds Suppliers.
3. **Purchase cycle:**
   - Purchase creates a **Purchase Order** for a supplier and places it (status: Ordered).
   - When goods arrive, Inventory creates a **GRN** against that order.
   - Saving the GRN **increases product stock** and updates the order to Partially Received or Received.
4. **Sales cycle:**
   - Sales creates a **Sales Order** for a customer. The system checks that stock is available.
   - When the order is **Confirmed**, stock is reduced. If a confirmed order is cancelled, stock is restored.
   - The order moves through Pending, Confirmed, Shipped, Delivered.
5. **Invoice:** an invoice is generated from a confirmed Sales Order (with tax) and can be downloaded as a **PDF**. It can then be marked as paid. One order has one invoice.
6. **Dashboard:** charts and metrics update from all of the above and change depending on the user's role.

Full flow: `Login > Products / Customers / Suppliers > Purchase Order > GRN (stock up) > Sales Order (stock down) > Invoice > PDF > Dashboard`

## Features

- JWT authentication, passwords hashed with bcrypt, session expiry handling
- Role-based access control on both the frontend (route guards) and the backend (middleware)
- CRUD for Products, Customers and Suppliers with search, filter and pagination
- Sales Orders and Purchase Orders with multiple line items and status flow
- Goods Receipt Notes linked to Purchase Orders, with partial receiving
- Automatic stock update on GRN, order confirmation and cancellation
- Low stock alerts using each product's reorder level
- Invoice generation with tax and PDF export (jsPDF)
- Dashboard with area, pie and bar charts (Recharts) and role-specific cards
- Responsive layout with sidebar and top bar (works on desktop, tablet and mobile)
- Form validation (Formik + Yup) and toast alerts (react-toastify)
- Central error handling and pagination on every list API

## Roles and Permissions

| Module | Admin | Sales | Purchase | Inventory |
|---|---|---|---|---|
| Dashboard | Full | Sales view | Purchase view | Stock view |
| Products | View, add, edit, delete | View | View | View, add, edit |
| Customers | Full | Add, edit, view | - | - |
| Suppliers | Full | - | Add, edit, view | - |
| Sales Orders | Full | Create, change status | - | View |
| Purchase Orders | Full | - | Create, change status | View |
| GRN | Full | - | View | Create, view |
| Invoices | Full | Create, view, mark paid | - | - |
| User Management | Yes | - | - | - |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router v6, Redux Toolkit, Axios, Material-UI |
| UI extras | Recharts, react-toastify, Formik + Yup, jsPDF |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas with Mongoose |
| Auth | JWT, bcryptjs |
| Deployment | Vercel (frontend), Render (backend) |

## Project Structure

```
erp-management-system/
├── backend/
│   ├── config/          database connection
│   ├── controllers/     logic of each module
│   ├── middleware/      auth, role check, error handling
│   ├── models/          Mongoose schemas
│   ├── routes/          API routes
│   ├── utils/           helpers (token, search, CRUD factory)
│   ├── seed.js          demo users and sample data
│   └── server.js
└── frontend/
    └── src/
        ├── api/         axios setup
        ├── components/  layout, tables, cards, route guard
        ├── hooks/       reusable list hook
        ├── pages/       Dashboard, Products, Orders, GRN, Invoices...
        ├── store/       Redux (auth)
        └── utils/       formatting, invoice PDF
```

## Getting Started (Local Setup)

### Requirements

- Node.js 18 or newer
- A MongoDB Atlas database (or a local MongoDB)

### 1. Clone

```bash
git clone https://github.com/Khushi288-creator/erp-management-system.git
cd erp-management-system
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (see `.env.example`):

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRE=1d
```

Load demo users and sample data (optional but recommended), then start the server:

```bash
node seed.js
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` (see `.env.example`):

```
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment Variables

| Where | Variable | Meaning |
|---|---|---|
| Backend | `PORT` | Port for the API (default 5000) |
| Backend | `MONGO_URI` | MongoDB connection string |
| Backend | `JWT_SECRET` | Secret used to sign tokens |
| Backend | `JWT_EXPIRE` | Token lifetime, for example `1d` |
| Frontend | `VITE_API_URL` | Base URL of the backend API |

## API Endpoints

All endpoints except register and login need the header `Authorization: Bearer <token>`. List endpoints accept `?page=`, `?limit=` and `?search=`.

| Module | Endpoints |
|---|---|
| Auth | `POST /api/register`, `POST /api/login`, `GET /api/me` |
| Users (Admin) | `GET /api/users`, `PUT /api/users/:id/role` |
| Products | `GET, POST /api/products`, `GET, PUT, DELETE /api/products/:id` (filter: `?lowStock=true`) |
| Customers | `GET, POST /api/customers`, `GET, PUT, DELETE /api/customers/:id` |
| Suppliers | `GET, POST /api/suppliers`, `GET, PUT, DELETE /api/suppliers/:id` |
| Sales Orders | `GET, POST /api/sales-orders`, `GET /api/sales-orders/:id`, `PUT /api/sales-orders/:id/status` |
| Purchase Orders | `GET, POST /api/purchase-orders`, `GET /api/purchase-orders/:id`, `PUT /api/purchase-orders/:id/status` |
| GRN | `GET, POST /api/grn`, `GET /api/grn/:id` |
| Invoices | `GET, POST /api/invoices`, `GET /api/invoices/:id`, `PUT /api/invoices/:id/pay` |
| Dashboard | `GET /api/dashboard` |

## Business Rules

- Stock reduces when a Sales Order is **confirmed**, and is restored if it is cancelled afterwards.
- A Sales Order cannot be confirmed if stock is not enough.
- A GRN cannot receive more than what is left on the Purchase Order.
- An invoice can be created only for a confirmed, shipped or delivered order, and only once per order.
- Order prices come from the database, not from the browser, so they cannot be tampered with.
- An Admin cannot change their own role.

## Author

Khushi Trivedi