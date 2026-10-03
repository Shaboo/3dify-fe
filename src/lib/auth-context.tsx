"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface User {
    token: string;
    userId: string;
    email: string;
    isAdmin: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userId: string, email: string, isAdmin: boolean) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("omni3d_auth");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem("omni3d_auth");
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((token: string, userId: string, email: string, isAdmin: boolean) => {
        const u: User = { token, userId, email, isAdmin };
        setUser(u);
        localStorage.setItem("omni3d_auth", JSON.stringify(u));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("omni3d_auth");
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
