import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import SalesOrders from "./pages/SalesOrders";
import PurchaseOrders from "./pages/PurchaseOrders";
import Grn from "./pages/Grn";
import Invoices from "./pages/Invoices";
import Admin from "./pages/Admin";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Har route ke saath roles diye hain, wahi role is page ko khol sakta hai
const guard = (element, roles) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={guard(<Customers />, ["admin", "sales"])} />
          <Route path="/suppliers" element={guard(<Suppliers />, ["admin", "purchase"])} />
          <Route path="/sales-orders" element={guard(<SalesOrders />, ["admin", "sales", "inventory"])} />
          <Route path="/purchase-orders" element={guard(<PurchaseOrders />, ["admin", "purchase", "inventory"])} />
          <Route path="/grn" element={guard(<Grn />, ["admin", "inventory", "purchase"])} />
          <Route path="/invoice" element={guard(<Invoices />, ["admin", "sales"])} />
          <Route path="/admin" element={guard(<Admin />, ["admin"])} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
