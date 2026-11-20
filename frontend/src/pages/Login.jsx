import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { TextField, Button, Typography, Link } from "@mui/material";
import { loginUser } from "../store/authSlice";
import AuthShell from "../components/AuthShell";

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
    <AuthShell title="Welcome back" subtitle="Login to continue to your dashboard">
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth margin="normal" label="Email" name="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
        />
        <TextField
          fullWidth margin="normal" label="Password" name="password" type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
        />
        <Button type="submit" fullWidth size="large" variant="contained" disabled={loading} sx={{ mt: 2 }}>
          {loading ? "Please wait..." : "Login"}
        </Button>
      </form>
      <Typography variant="body2" sx={{ mt: 3 }}>
        New user?{" "}
        <Link component={RouterLink} to="/register">Register here</Link>
      </Typography>
    </AuthShell>
  );
}
