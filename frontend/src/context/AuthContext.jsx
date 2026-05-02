import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [token, setToken]             = useState(null);
  const [chargement, setChargement]   = useState(true);

  // Restaurer la session au démarrage
  useEffect(() => {
    const tokenStocke = localStorage.getItem("edu_token");
    const userStocke  = localStorage.getItem("edu_user");
    if (tokenStocke && userStocke) {
      try {
        const payload = JSON.parse(atob(tokenStocke.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setToken(tokenStocke);
          setUtilisateur(JSON.parse(userStocke));
        } else {
          localStorage.removeItem("edu_token");
          localStorage.removeItem("edu_user");
        }
      } catch {
        localStorage.removeItem("edu_token");
        localStorage.removeItem("edu_user");
      }
    }
    setChargement(false);
  }, []);

  // Connexion
  const connexion = useCallback(async (email, motDePasse) => {
    try {
     const rep = await fetch(
  `/api/auth.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: motDePasse }),
        }
      );
      const data = await rep.json();
      if (!rep.ok) return { succes: false, erreur: data.erreur || "Erreur de connexion" };

      setToken(data.token);
      setUtilisateur(data.utilisateur);
      localStorage.setItem("edu_token", data.token);
      localStorage.setItem("edu_user", JSON.stringify(data.utilisateur));
      return { succes: true };
    } catch {
      return { succes: false, erreur: "Impossible de contacter le serveur" };
    }
  }, []);

  // Déconnexion
  const deconnexion = useCallback(() => {
    setToken(null);
    setUtilisateur(null);
    localStorage.removeItem("edu_token");
    localStorage.removeItem("edu_user");
  }, []);

  // Vérifier le rôle
  const aLeRole = useCallback(
    (...roles) => utilisateur && roles.includes(utilisateur.role),
    [utilisateur]
  );

  // Headers pour les appels API
  const headersAuth = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  return (
    <AuthContext.Provider value={{
      utilisateur,
      token,
      chargement,
      connexion,
      deconnexion,
      aLeRole,
      headersAuth,
      estConnecte: !!utilisateur,
    }}>
      {children}
    </AuthContext.Provider>
  );
}