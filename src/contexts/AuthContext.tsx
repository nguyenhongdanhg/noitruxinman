import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  class_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, username?: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInByLogin: (loginIdentifier: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isClassTeacher: (classId: string) => boolean;
  canAccessMeals: () => boolean;
  canAccessMealStats: () => boolean;
  canAccessAttendance: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }
  };

  const fetchRoles = async (userId: string) => {
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (rolesData) {
      setRoles(rolesData.map(r => r.role));
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(async () => {
            await Promise.all([
              fetchProfile(session.user.id),
              fetchRoles(session.user.id)
            ]);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchRoles(session.user.id)
        ]).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, username?: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName
        }
      }
    });
    
    // Update profile with username and phone after signup
    if (!error && data.user) {
      const updates: { username?: string; phone?: string } = {};
      if (username) updates.username = username;
      if (phone) updates.phone = phone;
      
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', data.user.id);
      }
    }
    
    return { error };
  };

  const recordLoginHistory = async (userId: string, success: boolean) => {
    try {
      await supabase.from('login_history').insert({
        user_id: userId,
        ip_address: null, // Can't get IP from client side
        user_agent: navigator.userAgent,
        success
      });
    } catch (error) {
      console.error('Error recording login history:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data.user) {
      await recordLoginHistory(data.user.id, true);
    }
    
    return { error };
  };

  const signInByLogin = async (loginIdentifier: string, password: string) => {
    // First, look up the email by username or phone
    const { data: emailData, error: lookupError } = await supabase
      .rpc('get_email_by_login', { login_input: loginIdentifier });
    
    if (lookupError || !emailData) {
      return { error: new Error('User not found') };
    }
    
    // Now sign in with the email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailData,
      password
    });
    
    if (!error && data.user) {
      await recordLoginHistory(data.user.id, true);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isClassTeacher = (classId: string): boolean => {
    return hasRole('class_teacher') && profile?.class_id === classId;
  };

  // GVCN và Admin có thể báo cơm
  const canAccessMeals = (): boolean => {
    return hasRole('admin') || hasRole('class_teacher');
  };

  // GVCN, Admin, Kế toán, Nhà bếp có thể xem thống kê bữa ăn
  const canAccessMealStats = (): boolean => {
    return hasRole('admin') || hasRole('class_teacher') || hasRole('accountant') || hasRole('kitchen');
  };

  // Giáo viên, GVCN, Admin có thể điểm danh và xem thống kê sỹ số
  const canAccessAttendance = (): boolean => {
    return hasRole('admin') || hasRole('class_teacher') || hasRole('teacher');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        signUp,
        signIn,
        signInByLogin,
        signOut,
        hasRole,
        isClassTeacher,
        canAccessMeals,
        canAccessMealStats,
        canAccessAttendance,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}