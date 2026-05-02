import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, roles = [] }) {
  const { utilisateur, chargement } = useAuth();
  const location = useLocation();

  // Afficher un spinner pendant la vérification du token
  if (chargement) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  // Non connecté → rediriger vers login
  if (!utilisateur) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rôle insuffisant
  if (roles.length > 0 && !roles.includes(utilisateur.role)) {
    return (
      <div className="container mt-5 text-center">
        <div className="alert alert-danger d-inline-block p-4">
          <h4>Accès refusé</h4>
          <p className="mb-0">
            Votre rôle <strong>({utilisateur.role})</strong> ne permet pas
            d'accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}