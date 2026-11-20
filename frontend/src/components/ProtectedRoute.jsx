import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// roles dena optional hai. Na do to sirf login check hoga
export default function ProtectedRoute({ children, roles }) {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}