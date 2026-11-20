import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#4f46e5" },
    secondary: { main: "#06b6d4" },
    success: { main: "#16a34a" },
    warning: { main: "#f59e0b" },
    background: { default: "#f4f6fb", paper: "#ffffff" },
    text: { primary: "#1e293b", secondary: "#64748b" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid #e8ebf3", backgroundImage: "none" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { backgroundColor: "#f8fafc", fontWeight: 700, color: "#475569", whiteSpace: "nowrap" },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiDialog: { styleOverrides: { paper: { border: "none" } } },
  },
});

export default theme;
