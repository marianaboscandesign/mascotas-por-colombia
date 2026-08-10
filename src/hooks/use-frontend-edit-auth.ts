"use client";

import * as React from "react";

export function useFrontendEditAuth() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Check initial state
    const checkAuth = () => {
      const auth = localStorage.getItem("frontend_edit_authenticated") === "true";
      setIsAuthenticated(auth);
    };

    checkAuth();

    // Listen to changes
    window.addEventListener("frontend-edit-auth-change", checkAuth);
    return () => {
      window.removeEventListener("frontend-edit-auth-change", checkAuth);
    };
  }, []);

  return isAuthenticated;
}
