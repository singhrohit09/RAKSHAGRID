/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { DEMO_USERS } from '../services/mockData';
import { DataService } from '../services/dataService';

export interface PermissionMatrix {
  canCreateIncident: boolean;
  canEditIncident: boolean;
  canDeleteIncident: boolean;
  canBroadcastAlert: boolean;
  canDispatchTeam: boolean;
  canAllocateResources: boolean;
  canUpdateShelter: boolean;
  canAssignTasks: boolean;
  canManageSettings: boolean;
  canViewAudit: boolean;
}

export function getRolePermissions(role: Role): PermissionMatrix {
  switch (role) {
    case 'administrator':
      return {
        canCreateIncident: true,
        canEditIncident: true,
        canDeleteIncident: true,
        canBroadcastAlert: true,
        canDispatchTeam: true,
        canAllocateResources: true,
        canUpdateShelter: true,
        canAssignTasks: true,
        canManageSettings: true,
        canViewAudit: true,
      };
    case 'incident_commander':
      return {
        canCreateIncident: true,
        canEditIncident: true,
        canDeleteIncident: false,
        canBroadcastAlert: true,
        canDispatchTeam: true,
        canAllocateResources: true,
        canUpdateShelter: true,
        canAssignTasks: true,
        canManageSettings: false,
        canViewAudit: true,
      };
    case 'field_responder':
      return {
        canCreateIncident: true,
        canEditIncident: true,
        canDeleteIncident: false,
        canBroadcastAlert: false,
        canDispatchTeam: false,
        canAllocateResources: false,
        canUpdateShelter: false,
        canAssignTasks: true,
        canManageSettings: false,
        canViewAudit: false,
      };
    case 'logistics_officer':
      return {
        canCreateIncident: false,
        canEditIncident: false,
        canDeleteIncident: false,
        canBroadcastAlert: false,
        canDispatchTeam: false,
        canAllocateResources: true,
        canUpdateShelter: true,
        canAssignTasks: true,
        canManageSettings: false,
        canViewAudit: false,
      };
    case 'read_only_analyst':
    default:
      return {
        canCreateIncident: false,
        canEditIncident: false,
        canDeleteIncident: false,
        canBroadcastAlert: false,
        canDispatchTeam: false,
        canAllocateResources: false,
        canUpdateShelter: false,
        canAssignTasks: false,
        canManageSettings: false,
        canViewAudit: false,
      };
  }
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  isDevMode: boolean;
  permissions: PermissionMatrix;
  login: (email: string, role?: Role) => Promise<{ success: boolean; message?: string }>;
  register: (userData: Omit<User, 'id'>) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: Role) => void;
  availablePersonas: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'rakshagrid_current_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Incident Commander for rich immediate evaluation experience
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEMO_USERS[1]; // Col. Rajesh Verma (Incident Commander)
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [user]);

  const role: Role = user ? user.role : 'read_only_analyst';
  const permissions = getRolePermissions(role);

  const login = async (email: string, rolePreference?: Role): Promise<{ success: boolean; message?: string }> => {
    // Check if matching registered user or role
    const matched = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() || (rolePreference && u.role === rolePreference)
    );

    if (matched) {
      setUser(matched);
      DataService.logAudit({
        actor: {
          id: matched.id,
          name: matched.name,
          role: matched.role,
          agency: matched.agency,
        },
        action: 'USER_LOGIN',
        entityType: 'auth',
        entityId: matched.id,
        details: `Personnel ${matched.name} authenticated via ${matched.agency}`,
        severity: 'info',
      });
      return { success: true };
    }

    // Otherwise create authorized operational session
    const customUser: User = {
      id: `usr-custom-${Date.now()}`,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email,
      role: rolePreference || 'incident_commander',
      agency: 'Regional Disaster Response Coordination Unit',
      badgeNumber: `RDR-${Math.floor(100 + Math.random() * 900)}`,
      phone: '+91 99000 00000',
    };

    setUser(customUser);
    DataService.logAudit({
      actor: {
        id: customUser.id,
        name: customUser.name,
        role: customUser.role,
        agency: customUser.agency,
      },
      action: 'USER_LOGIN',
      entityType: 'auth',
      entityId: customUser.id,
      details: `Personnel ${customUser.name} authenticated successfully`,
      severity: 'info',
    });

    return { success: true };
  };

  const register = async (userData: Omit<User, 'id'>): Promise<{ success: boolean; message?: string }> => {
    const newUser: User = {
      ...userData,
      id: `usr-reg-${Date.now()}`,
    };
    setUser(newUser);
    DataService.logAudit({
      actor: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        agency: newUser.agency,
      },
      action: 'USER_REGISTER',
      entityType: 'auth',
      entityId: newUser.id,
      details: `New officer registered: ${newUser.name} (${newUser.agency}, Badge: ${newUser.badgeNumber})`,
      severity: 'info',
    });
    return { success: true };
  };

  const logout = () => {
    if (user) {
      DataService.logAudit({
        actor: {
          id: user.id,
          name: user.name,
          role: user.role,
          agency: user.agency,
        },
        action: 'USER_LOGOUT',
        entityType: 'auth',
        entityId: user.id,
        details: `Personnel ${user.name} logged out from terminal session`,
        severity: 'info',
      });
    }
    setUser(null);
  };

  const switchRole = (newRole: Role) => {
    const persona = DEMO_USERS.find((u) => u.role === newRole);
    if (persona) {
      setUser(persona);
    } else if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isDevMode: false,
        permissions,
        login,
        register,
        logout,
        switchRole,
        availablePersonas: DEMO_USERS,
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
