import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Paper } from "@mui/material";
import { logout } from "../store/authSlice";

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <Typography variant="h5" fontWeight="bold">
          Welcome, {user?.name}
        </Typography>
        <Typography sx={{ mt: 1 }}>Role: {user?.role}</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={handleLogout}>
          Logout
        </Button>
      </Paper>
    </Box>
  );
}