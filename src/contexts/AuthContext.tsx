import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  switchUser: (userId: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users for demo matching spec RBAC
const defaultUsers: User[] = [
  {
    id: '1',
    email: 'superadmin@verticalhrm.com',
    password: 'admin123',
    role: 'super_admin',
    firstName: 'Marcus',
    lastName: 'Vance',
    employeeId: 'EMP000',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'admin@verticalhrm.com',
    password: 'admin123',
    role: 'hr_admin',
    firstName: 'Patricia',
    lastName: 'Sterling',
    employeeId: 'EMP003',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'hr@verticalhrm.com',
    password: 'hr123',
    role: 'hr_manager',
    firstName: 'Sarah',
    lastName: 'Smith',
    employeeId: 'EMP002',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'manager@verticalhrm.com',
    password: 'mgr123',
    role: 'line_manager',
    firstName: 'David',
    lastName: 'Chen',
    employeeId: 'EMP004',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    email: 'auditor@verticalhrm.com',
    password: 'audit123',
    role: 'auditor',
    firstName: 'Elena',
    lastName: 'Rostova',
    employeeId: 'EMP005',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    email: 'employee@verticalhrm.com',
    password: 'emp123',
    role: 'employee',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize default users in localStorage if not present or missing roles
    const existingUsers = localStorage.getItem('hrm_users');
    let loadedUsers: User[] = defaultUsers;
    if (!existingUsers) {
      localStorage.setItem('hrm_users', JSON.stringify(defaultUsers));
    } else {
      try {
        const parsed = JSON.parse(existingUsers) as User[];
        // Merge in any defaultUsers missing by email
        const existingEmails = new Set(parsed.map(u => u.email));
        const missing = defaultUsers.filter(d => !existingEmails.has(d.email));
        loadedUsers = [...parsed, ...missing];
        localStorage.setItem('hrm_users', JSON.stringify(loadedUsers));
      } catch {
        loadedUsers = defaultUsers;
        localStorage.setItem('hrm_users', JSON.stringify(defaultUsers));
      }
    }
    setUsers(loadedUsers);

    // Check for existing session
    const savedUser = localStorage.getItem('hrm_current_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const currentUsers = JSON.parse(localStorage.getItem('hrm_users') || '[]');
    const foundUser = currentUsers.find((u: User) => u.email === email && u.password === password);
    
    if (foundUser && foundUser.isActive) {
      const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
      setUser(updatedUser);
      localStorage.setItem('hrm_current_user', JSON.stringify(updatedUser));
      
      // Update user in users array
      const updatedUsers = currentUsers.map((u: User) => u.id === foundUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('hrm_users', JSON.stringify(updatedUsers));
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hrm_current_user');
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('hrm_users', JSON.stringify(updated));
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const updated = users.map(u => (u.id === id ? { ...u, ...updates } : u));
    setUsers(updated);
    localStorage.setItem('hrm_users', JSON.stringify(updated));
    if (user?.id === id) {
      const updatedActive = { ...user, ...updates };
      setUser(updatedActive);
      localStorage.setItem('hrm_current_user', JSON.stringify(updatedActive));
    }
  };

  const deleteUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem('hrm_users', JSON.stringify(updated));
  };
  const switchUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem('hrm_current_user', JSON.stringify(found));
    }
  };

  return (
    <AuthContext.Provider value={{ user, users, login, logout, addUser, updateUser, deleteUser, switchUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};