import { Paper, Box, Typography } from "@mui/material";

export default function StatCard({ label, value, sub, icon, color = "#4f46e5" }) {
  return (
    <Paper sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
      <Box
        sx={{
          width: 52, height: 52, borderRadius: 3, display: "flex",
          alignItems: "center", justifyContent: "center",
          bgcolor: `${color}1a`, color, flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" noWrap>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Box>
    </Paper>
  );
}
