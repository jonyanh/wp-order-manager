import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { auth, isFirebaseConfigured, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { usersService, initializeLocalDatabase } from '../services/db';

export const ADMIN_CREDENTIALS = {
  email: 'admin@gmail.com',
  password: '@2001HoangAnh',
};

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  customerId?: string;
  loading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchAccount: (role: UserRole, customerId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  function createAdminUser(uid = 'admin-uid'): User {
    return {
      id: uid,
      uid: uid,
      name: 'Quản trị viên (Admin)',
      email: ADMIN_CREDENTIALS.email,
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    };
  }

  // Initialize Auth state on app launch
  useEffect(() => {
    initializeLocalDatabase();

    // Check if there is an active logged-in session in localStorage first
    const savedUserRaw = localStorage.getItem('wp_current_user');
    let savedUser: User | null = null;
    if (savedUserRaw) {
      try {
        savedUser = JSON.parse(savedUserRaw);
        setCurrentUser(savedUser);
      } catch {
        localStorage.removeItem('wp_current_user');
      }
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            let userDoc = await usersService.getById(fbUser.uid);
            if (!userDoc) {
              userDoc = createAdminUser(fbUser.uid);
              if (db) {
                await setDoc(doc(db, 'users', fbUser.uid), userDoc, { merge: true });
              }
            }
            setCurrentUser(userDoc);
            localStorage.setItem('wp_current_user', JSON.stringify(userDoc));
          } catch (err) {
            console.warn('[Firebase Auth] Firestore user profile sync error:', err);
            const fallback = createAdminUser(fbUser.uid);
            setCurrentUser(fallback);
            localStorage.setItem('wp_current_user', JSON.stringify(fallback));
          }
        } else {
          // If Firebase has no user but localStorage had saved session, preserve it unless explicitly logged out
          if (!savedUser) {
            setCurrentUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password = ''): Promise<boolean> => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Validate email
    if (trimmedEmail !== ADMIN_CREDENTIALS.email.toLowerCase()) {
      throw new Error(`Email không chính xác. Tài khoản quản trị là: ${ADMIN_CREDENTIALS.email}`);
    }

    // Validate password
    if (cleanPassword !== ADMIN_CREDENTIALS.password) {
      throw new Error(`Mật khẩu không chính xác.`);
    }

    let authenticatedUid = 'admin-uid';

    // Attempt Firebase Authentication
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, cleanPassword);
        authenticatedUid = cred.user.uid;
        console.log('[Firebase Auth] Signed in successfully via Firebase Auth SDK:', cred.user.email);
      } catch (signErr: any) {
        console.warn('[Firebase Auth] Sign in error code:', signErr.code, signErr.message);

        // If user not created yet in Firebase Auth, auto-create it
        if (
          signErr.code === 'auth/user-not-found' ||
          signErr.code === 'auth/invalid-credential' ||
          signErr.code === 'auth/invalid-login-credentials'
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, trimmedEmail, cleanPassword);
            authenticatedUid = newCred.user.uid;
            console.log('[Firebase Auth] Auto-created user in Firebase Authentication:', newCred.user.email);
          } catch (createErr: any) {
            console.warn('[Firebase Auth] Auto-create note:', createErr.code, createErr.message);
          }
        } else if (signErr.code === 'auth/operation-not-allowed') {
          console.warn('[Firebase Auth] Lưu ý: Cần kích hoạt "Email/Password" trong tab Authentication -> Sign-in method trên Firebase Console.');
        }
      }
    }

    // Set authenticated Admin user
    const adminUser = createAdminUser(authenticatedUid);

    // Save to Firestore users collection if possible
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', authenticatedUid), adminUser, { merge: true });
      } catch (e) {
        console.warn('Could not sync user to Firestore:', e);
      }
    }

    setCurrentUser(adminUser);
    localStorage.setItem('wp_current_user', JSON.stringify(adminUser));
    return true;
  };

  const logout = async (): Promise<void> => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('Firebase signout error:', err);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('wp_current_user');
  };

  const switchAccount = (role: UserRole, customerId?: string) => {
    const adminUser = createAdminUser();
    setCurrentUser(adminUser);
    localStorage.setItem('wp_current_user', JSON.stringify(adminUser));
  };

  const role: UserRole = currentUser?.role || 'admin';
  const isAdmin = true;
  const isCustomer = false;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        customerId: undefined,
        loading,
        isAdmin,
        isCustomer,
        login,
        logout,
        switchAccount,
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
