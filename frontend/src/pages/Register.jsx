import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { TextField, Button, Typography, Link } from "@mui/material";
import { registerUser } from "../store/authSlice";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const formik = useFormik({
    initialValues: { name: "", email: "", password: "" },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
    }),
    onSubmit: (values) => {
      dispatch(registerUser(values))
        .unwrap()
        .then(() => {
          toast.success("Registered successfully");
          navigate("/dashboard");
        })
        .catch((message) => toast.error(message));
    },
  });

  const field = (name, label, type = "text") => (
    <TextField
      fullWidth margin="normal" label={label} name={name} type={type}
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
    />
  );

  return (
    <AuthShell title="Create account" subtitle="New accounts start with the Sales role">
      <form onSubmit={formik.handleSubmit}>
        {field("name", "Name")}
        {field("email", "Email")}
        {field("password", "Password", "password")}
        <Button type="submit" fullWidth size="large" variant="contained" disabled={loading} sx={{ mt: 2 }}>
          {loading ? "Please wait..." : "Register"}
        </Button>
      </form>
      <Typography variant="body2" sx={{ mt: 3 }}>
        Already have an account?{" "}
        <Link component={RouterLink} to="/login">Login</Link>
      </Typography>
    </AuthShell>
  );
}
