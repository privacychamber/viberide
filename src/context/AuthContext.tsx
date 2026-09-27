"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string | number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  verified?: boolean | null;
  [key: string]: any;
};

type Session = {
  user: User;
} | null;

interface AuthContextType {
  data: Session;
  update: (data?: any) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  data: null,
  update: () => {},
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session>(null);
  const router = useRouter();

  useEffect(() => {
    // Load from local storage on mount
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        setSession({ user: JSON.parse(userStr) });
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setSession({ user });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSession(null);
    router.push("/login");
  };

  const update = (data?: any) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    if (data && data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      setSession({ user: data.user });
    }
  };

  return (
    <AuthContext.Provider value={{ data: session, update, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSession = () => useContext(AuthContext);
