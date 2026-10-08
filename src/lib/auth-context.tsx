"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  Fragment,
  useRef,
} from "react";
import { toast } from "@/components/ui/toaster";
interface User {
  token: string;
  userId: string;
  email: string;
  isAdmin: boolean;
}
const AuthContext = createContext<
  | {
      user: User | null;
      isLoading: boolean;
      login: (
        token: string,
        userId: string,
        email: string,
        isAdmin: boolean,
      ) => void;
      logout: () => void;
    }
  | undefined
>(undefined);
const KEY = "omni3d_auth";
function validSession(user: User) {
  try {
    const payload = JSON.parse(
      atob(user.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return (
      typeof user.userId === "string" &&
      typeof user.email === "string" &&
      typeof payload.exp === "number" &&
      payload.exp * 1000 > Date.now()
    );
  } catch {
    return false;
  }
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef(user);
  userRef.current = user;
  const [isLoading, setLoading] = useState(true);
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(KEY);
    sessionStorage.removeItem("3dify:website-key");
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validSession(parsed)) setUser(parsed);
        else localStorage.removeItem(KEY);
      }
    } catch {
      localStorage.removeItem(KEY);
    }
    setLoading(false);
    const expire = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== userRef.current?.token)
        return;
      logout();
      toast({
        title: "Please sign in again",
        description: "Your session has expired.",
      });
    };
    const sync = (event: StorageEvent) => {
      if (event.key === KEY) {
        try {
          const next = event.newValue ? JSON.parse(event.newValue) : null;
          setUser(next && validSession(next) ? next : null);
        } catch {
          setUser(null);
        }
        sessionStorage.removeItem("3dify:website-key");
      }
    };
    window.addEventListener("3dify:session-expired", expire);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("3dify:session-expired", expire);
      window.removeEventListener("storage", sync);
    };
  }, [logout]);
  const login = useCallback(
    (token: string, userId: string, email: string, isAdmin: boolean) => {
      const next = { token, userId, email, isAdmin };
      sessionStorage.removeItem("3dify:website-key");
      setUser(next);
      localStorage.setItem(KEY, JSON.stringify(next));
    },
    [],
  );
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      <Fragment key={user?.userId}>{children}</Fragment>
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
