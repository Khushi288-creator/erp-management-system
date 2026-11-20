import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Box, Paper, TextField, Button, Typography, Link } from "@mui/material";
import { loginUser } from "../store/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: (values) => {
      dispatch(loginUser(values))
        .unwrap()
        .then(() => {
          toast.success("Login successful");
          navigate("/dashboard");
        })
        .catch((message) => toast.error(message));
    },
  });

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          ERP Login
        </Typography>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
          <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 2 }}>
            {loading ? "Please wait..." : "Login"}
          </Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2 }}>
          New user?{" "}
          <Link component={RouterLink} to="/register">
            Register here
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}