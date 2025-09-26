import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const hasToken = isAuthenticated();
  
  if (!hasToken) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
