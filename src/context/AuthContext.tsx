import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../services/mockInitialData';
import { auth } from '../config/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (updated: Partial<UserProfile>) => void;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'cpvrms_current_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure Firebase Auth session exists so Firestore rules match
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Firebase anonymous auth fallback:", err);
        }
      }
    });

    // Restore persistent user profile session
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        // Default to logged in as Admin
        const defaultAdmin = INITIAL_USERS[0];
        setUser(defaultAdmin);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultAdmin));
      }
    } catch (e) {
      console.error("Failed to restore user session", e);
    } finally {
      setLoading(false);
    }

    return () => unsubscribeAuth();
  }, []);

  const login = async (email: string, preferredRole?: UserRole): Promise<boolean> => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.warn("Firebase optional anonymous auth:", authErr);
        }
      }

      let foundUser = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        const role = preferredRole || (email.toLowerCase().includes('admin') ? 'admin' : 'staff');
        foundUser = {
          uid: auth.currentUser?.uid || `usr-${Date.now()}`,
          email: email.toLowerCase(),
          displayName: email.split('@')[0].toUpperCase(),
          role: role,
          department: role === 'admin' ? 'Executive' : 'Disbursement',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
      } else {
        foundUser = {
          ...foundUser,
          uid: auth.currentUser?.uid || foundUser.uid,
          lastLoginAt: new Date().toISOString()
        };
      }

      setUser(foundUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Login failed", err);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        resetPassword,
        updateProfile,
        isAdmin,
        isStaff
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

