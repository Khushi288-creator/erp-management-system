import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, CircularProgress, LinearProgress,
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InventoryIcon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import StatusChip, { prettyStatus } from "../components/StatusChip";
import { money } from "../utils/format";

const PIE_COLORS = {
  pending: "#f59e0b", confirmed: "#0ea5e9", shipped: "#6366f1", delivered: "#16a34a",
  cancelled: "#ef4444", ordered: "#0ea5e9", partially_received: "#f59e0b", received: "#16a34a",
};

function ChartCard({ title, children, height = 300 }) {
  return (
    <Paper sx={{ p: 2.5, height: "100%" }}>
      <Typography fontWeight={700} sx={{ mb: 2 }}>{title}</Typography>
      <Box sx={{ height }}>{children}</Box>
    </Paper>
  );
}

function StatusPie({ data }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={data.map((d) => ({ ...d, label: prettyStatus(d.name) }))}
          dataKey="value" nameKey="label" innerRadius={55} outerRadius={95} paddingAngle={3}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={PIE_COLORS[d.name] || "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 12 column grid ka ek hissa: phone par poori width, bade screen par `lg` columns
const GridCell = ({ md = 12, lg = 12, children }) => (
  <Box sx={{ gridColumn: { xs: "span 12", md: `span ${md}`, lg: `span ${lg}` }, minWidth: 0 }}>{children}</Box>
);

const Empty = () => (
  <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Typography color="text.secondary">No data yet</Typography>
  </Box>
);

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load dashboard"));
  }, []);

  if (!data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const c = data.counts;

  // roles = kis role ko ye card dikhega
  const cards = [
    { roles: ["admin", "sales"], label: "Total Revenue", value: money(data.revenue), sub: "From invoices", icon: <PaidIcon />, color: "#16a34a" },
    { roles: ["admin", "sales"], label: "Sales Orders", value: c.salesOrders, sub: `${c.pendingSales} pending`, icon: <ShoppingCartIcon />, color: "#4f46e5" },
    { roles: ["admin", "sales"], label: "Unpaid Invoices", value: c.unpaidInvoices, sub: money(data.unpaidAmount), icon: <RequestQuoteIcon />, color: "#f59e0b" },
    { roles: ["admin", "sales"], label: "Customers", value: c.customers, icon: <PeopleIcon />, color: "#0ea5e9" },
    { roles: ["admin", "purchase", "inventory"], label: "Purchase Orders", value: c.purchaseOrders, sub: `${c.pendingPurchase} open`, icon: <ReceiptLongIcon />, color: "#8b5cf6" },
    { roles: ["admin", "purchase"], label: "Suppliers", value: c.suppliers, icon: <LocalShippingIcon />, color: "#06b6d4" },
    { roles: ["admin", "purchase", "inventory", "sales"], label: "Low Stock Items", value: c.lowStock, sub: "At or below reorder level", icon: <WarningAmberIcon />, color: "#ef4444" },
    { roles: ["admin", "inventory", "purchase", "sales"], label: "Products", value: c.products, icon: <InventoryIcon />, color: "#4f46e5" },
    { roles: ["admin", "inventory"], label: "Inventory Value", value: money(data.inventoryValue), sub: "Stock x price", icon: <WarehouseIcon />, color: "#0d9488" },
  ].filter((card) => card.roles.includes(role));

  const showSales = ["admin", "sales"].includes(role);
  const showPurchase = ["admin", "purchase", "inventory"].includes(role);

  return (
    <Box>
      <PageHeader title={`Welcome back, ${user?.name}`} subtitle="Here is what is happening in your business today" />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2.5 }}>
        {cards.map((card) => (
          <GridCell md={6} lg={3} key={card.label}>
            <StatCard {...card} />
          </GridCell>
        ))}

        {(showSales || showPurchase) && (
          <GridCell lg={8}>
            <ChartCard title="Sales vs Purchases (last 6 months)">
              <ResponsiveContainer>
                <AreaChart data={data.monthly}>
                  <defs>
                    <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPurchase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v) => money(v)} />
                  <Legend />
                  {showSales && <Area type="monotone" dataKey="sales" name="Sales" stroke="#4f46e5" strokeWidth={2} fill="url(#gSales)" />}
                  {showPurchase && <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#06b6d4" strokeWidth={2} fill="url(#gPurchase)" />}
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </GridCell>
        )}

        {showSales && (
          <GridCell md={6} lg={4}>
            <ChartCard title="Sales orders by status">
              <StatusPie data={data.salesStatus} />
            </ChartCard>
          </GridCell>
        )}

        {showPurchase && (
          <GridCell md={6} lg={4}>
            <ChartCard title="Purchase orders by status">
              <StatusPie data={data.purchaseStatus} />
            </ChartCard>
          </GridCell>
        )}

        {["admin", "sales", "inventory"].includes(role) && (
          <GridCell md={6} lg={4}>
            <ChartCard title="Top selling products (units)">
              {data.topProducts.length ? (
                <ResponsiveContainer>
                  <BarChart data={data.topProducts} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={90} />
                    <Tooltip />
                    <Bar dataKey="qty" name="Units sold" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </ChartCard>
          </GridCell>
        )}

        <GridCell md={6} lg={4}>
          <Paper sx={{ p: 2.5, height: "100%" }}>
            <Typography fontWeight={700} sx={{ mb: 2 }}>Low stock alerts</Typography>
            {data.lowStockItems.length === 0 && <Typography color="text.secondary">All products are well stocked</Typography>}
            {data.lowStockItems.map((p) => (
              <Box key={p._id} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>{p.title}</Typography>
                  <Chip size="small" color="error" label={`${p.stock} / ${p.reorderLevel}`} />
                </Box>
                <LinearProgress
                  variant="determinate" color="error"
                  value={p.reorderLevel ? Math.min((p.stock / p.reorderLevel) * 100, 100) : 0}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            ))}
          </Paper>
        </GridCell>

        {showSales && (
          <GridCell>
            <Paper sx={{ p: 2.5 }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>Recent sales orders</Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentOrders.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No orders yet</TableCell></TableRow>
                    )}
                    {data.recentOrders.map((o) => (
                      <TableRow key={o._id}>
                        <TableCell>{o.orderNo}</TableCell>
                        <TableCell>{o.customer?.name}</TableCell>
                        <TableCell align="right">{money(o.totalPrice)}</TableCell>
                        <TableCell><StatusChip status={o.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </GridCell>
        )}
      </Box>
    </Box>
  );
}
