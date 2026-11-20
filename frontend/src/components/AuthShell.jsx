import { Box, Paper, Typography } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory2";

// Login aur Register dono ka common design: left me branding, right me form
export default function AuthShell({ title, subtitle, children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          p: 8,
          color: "#fff",
          background: "linear-gradient(135deg,#1e1b4b 0%,#4f46e5 60%,#06b6d4 100%)",
        }}
      >
        <InventoryIcon sx={{ fontSize: 56, mb: 2 }} />
        <Typography variant="h3" fontWeight={800}>ERP Management System</Typography>
        <Typography sx={{ mt: 2, maxWidth: 420, opacity: 0.9 }}>
          Products, customers, suppliers, orders, goods receipts and invoices. Everything your
          business needs, in one place.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 420 }}>
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>{subtitle}</Typography>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
