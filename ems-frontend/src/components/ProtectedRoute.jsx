import { Navigate } from "react-router-dom";
import { getToken, isExpired } from "../auth/authStore";

export default function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token || isExpired()) return <Navigate to="/login" replace />;
  return children;
}
