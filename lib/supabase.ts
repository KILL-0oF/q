import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate that required environment variables are present
if (!supabaseUrl) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with error handling
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// أنواع البيانات
export interface Device {
  id: string;
  device_type: string;
  customer_name: string;
  customer_phone: string;
  issue_description: string;
  service_price: number;
  amount_paid: number;
  remaining_amount: number;
  serial_number?: string;
  customer_notes?: string;
  repair_notes?: string;
  status: 'pending' | 'repaired' | 'cannot_repair' | 'delivered';
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  created_by: string;
}

export interface DeviceImage {
  id: string;
  device_id: string;
  image_url: string;
  image_type: string;
  created_at: string;
}

export interface Statistics {
  id: string;
  stat_type: string;
  stat_value: number;
  stat_date: string;
  created_at: string;
}

export interface CommonIssue {
  issue: string;
  count: number;
}

export interface CommonDevice {
  device: string;
  count: number;
}

// خدمات قاعدة البيانات
export const deviceService = {
  // جلب جميع الأجهزة
  async getDevices() {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return [];
      }

      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching devices:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getDevices:', error);
      return [];
    }
  },

  // جلب الأجهزة حسب الحالة
  async getDevicesByStatus(status: string) {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return [];
      }

      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching devices by status:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getDevicesByStatus:', error);
      return [];
    }
  },

  // إضافة جهاز جديد
  async createDevice(device: Omit<Device, 'id' | 'created_at' | 'updated_at' | 'remaining_amount'>) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('devices')
        .insert([device])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating device:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in createDevice:', error);
      throw error;
    }
  },

  // تحديث جهاز
  async updateDevice(id: string, updates: Partial<Device>) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('devices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating device:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in updateDevice:', error);
      throw error;
    }
  },

  // حذف جهاز
  async deleteDevice(id: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting device:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteDevice:', error);
      throw error;
    }
  },

  // تحديث حالة الجهاز
  async updateDeviceStatus(id: string, status: Device['status'], notes?: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const updates: any = { status };
      if (notes) updates.repair_notes = notes;
      
      const { data, error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating device status:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in updateDeviceStatus:', error);
      throw error;
    }
  }
};

export const statisticsService = {
  // حساب الدخل اليومي
  async getDailyIncome(date?: string) {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return 0;
      }

      const targetDate = date || new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .rpc('calculate_daily_income', { target_date: targetDate });
      
      if (error) {
        console.error('Error calculating daily income:', error);
        return 0;
      }
      return data || 0;
    } catch (error) {
      console.error('Error in getDailyIncome:', error);
      return 0;
    }
  },

  // جلب أكثر الأعطال شيوعاً
  async getMostCommonIssues(limit: number = 10): Promise<CommonIssue[]> {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return [];
      }

      const { data, error } = await supabase
        .rpc('get_most_common_issues', { limit_count: limit });
      
      if (error) {
        console.error('Error fetching common issues:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getMostCommonIssues:', error);
      return [];
    }
  },

  // جلب أكثر الأجهزة شيوعاً
  async getMostCommonDevices(limit: number = 10): Promise<CommonDevice[]> {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return [];
      }

      const { data, error } = await supabase
        .rpc('get_most_common_devices', { limit_count: limit });
      
      if (error) {
        console.error('Error fetching common devices:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getMostCommonDevices:', error);
      return [];
    }
  },

  // حساب الإحصائيات العامة
  async getOverallStats() {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return {
          pending: 0,
          repaired: 0,
          cannot_repair: 0,
          delivered: 0,
          total: 0
        };
      }

      const { data, error } = await supabase
        .from('devices')
        .select('status');
      
      if (error) {
        console.error('Error fetching overall stats:', error);
        return {
          pending: 0,
          repaired: 0,
          cannot_repair: 0,
          delivered: 0,
          total: 0
        };
      }
      
      const stats = {
        pending: 0,
        repaired: 0,
        cannot_repair: 0,
        delivered: 0,
        total: data?.length || 0
      };

      data?.forEach(device => {
        if (device.status in stats) {
          stats[device.status as keyof typeof stats]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getOverallStats:', error);
      return {
        pending: 0,
        repaired: 0,
        cannot_repair: 0,
        delivered: 0,
        total: 0
      };
    }
  }
};

export const authService = {
  // تسجيل الدخول
  async signIn(email: string, password: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.warn('Warning signing in:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.warn('Warning in signIn:', error);
      throw error;
    }
  },

  // تسجيل حساب جديد
  async signUp(email: string, password: string, fullName: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        console.warn('Warning signing up:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.warn('Warning in signUp:', error);
      throw error;
    }
  },

  // تسجيل الخروج
  async signOut() {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  },

  // جلب المستخدم الحالي
  async getCurrentUser() {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return null;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Warning getting current user:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.warn('Warning in getCurrentUser:', error);
      return null;
    }
  }
};