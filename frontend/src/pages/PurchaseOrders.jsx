import OrdersPage from "./OrdersPage";

const config = {
  title: "Purchase Orders",
  subtitle: "Stock ordered from your suppliers",
  singular: "Purchase Order",
  url: "/purchase-orders",
  partyKey: "supplier",
  partyLabel: "Supplier",
  partyUrl: "/suppliers",
  writeRoles: ["admin", "purchase"],
  editablePrice: true, // supplier ka rate alag ho sakta hai
  showReceived: true,
  statuses: ["pending", "ordered", "partially_received", "received", "cancelled"],
  next: {
    pending: ["ordered", "cancelled"],
    ordered: ["cancelled"],
  },
  actionLabel: {
    ordered: "Place Order",
    cancelled: "Cancel",
  },
};

export default function PurchaseOrders() {
  return <OrdersPage config={config} />;
}
