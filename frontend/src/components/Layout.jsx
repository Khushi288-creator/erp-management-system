import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Box, Avatar, Menu, MenuItem, Chip, Divider,
  useMediaQuery, useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import InventoryIcon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "../store/authSlice";

const drawerWidth = 250;

// roles na likha ho to sab ko dikhega
const menuItems = [
  { text: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { text: "Products", path: "/products", icon: <InventoryIcon /> },
  { text: "Customers", path: "/customers", icon: <PeopleIcon />, roles: ["admin", "sales"] },
  { text: "Suppliers", path: "/suppliers", icon: <LocalShippingIcon />, roles: ["admin", "purchase"] },
  { text: "Sales Orders", path: "/sales-orders", icon: <ShoppingCartIcon />, roles: ["admin", "sales", "inventory"] },
  { text: "Purchase Orders", path: "/purchase-orders", icon: <ReceiptLongIcon />, roles: ["admin", "purchase", "inventory"] },
  { text: "Goods Receipt (GRN)", path: "/grn", icon: <MoveToInboxIcon />, roles: ["admin", "inventory", "purchase"] },
  { text: "Invoices", path: "/invoice", icon: <RequestQuoteIcon />, roles: ["admin", "sales"] },
  { text: "User Management", path: "/admin", icon: <AdminPanelSettingsIcon />, roles: ["admin"] },
];

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    setAnchor(null);
    dispatch(logout());
    navigate("/login");
  };

  const current = menuItems.find((m) => location.pathname.startsWith(m.path));

  const drawer = (
    <Box sx={{ height: "100%", color: "#c7d2fe", background: "linear-gradient(180deg,#1e1b4b 0%,#312e81 100%)" }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Avatar sx={{ bgcolor: "#6366f1", width: 36, height: 36, fontWeight: 700 }}>E</Avatar>
        <Typography variant="h6" sx={{ color: "#fff" }}>ERP System</Typography>
      </Toolbar>
      <Divider sx={{ borderColor: "rgba(255,255,255,.1)" }} />
      <List sx={{ px: 1.5, py: 2 }}>
        {menuItems
          .filter((item) => !item.roles || item.roles.includes(user?.role))
          .map((item) => {
            const selected = location.pathname.startsWith(item.path);
            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: selected ? "#fff" : "#c7d2fe",
                  "&.Mui-selected": { bgcolor: "rgba(255,255,255,.16)" },
                  "&.Mui-selected:hover, &:hover": { bgcolor: "rgba(255,255,255,.1)" },
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={<Typography fontSize={14} fontWeight={selected ? 700 : 500}>{item.text}</Typography>} />
              </ListItemButton>
            );
          })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "background.paper",
          borderTop: 0, borderLeft: 0, borderRight: 0,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {current?.text || "ERP"}
          </Typography>
          <Chip label={user?.role} color="primary" size="small" sx={{ textTransform: "capitalize", mr: 1.5 }} />
          <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
            <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34 }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography fontWeight={700}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: drawerWidth, border: 0 } }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, ml: { md: `${drawerWidth}px` }, width: { md: `calc(100% - ${drawerWidth}px)` }, minHeight: "100vh" }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
