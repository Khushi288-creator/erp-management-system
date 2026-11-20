import OrdersPage from "./OrdersPage";

const config = {
  title: "Sales Orders",
  subtitle: "Orders placed by your customers",
  singular: "Sales Order",
  url: "/sales-orders",
  partyKey: "customer",
  partyLabel: "Customer",
  partyUrl: "/customers",
  writeRoles: ["admin", "sales"],
  editablePrice: false, // price product se aata hai
  showReceived: false,
  statuses: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
  next: {
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered"],
  },
  actionLabel: {
    confirmed: "Confirm",
    shipped: "Ship",
    delivered: "Deliver",
    cancelled: "Cancel",
  },
};

export default function SalesOrders() {
  return <OrdersPage config={config} />;
}
