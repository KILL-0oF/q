import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { User, Settings, LogOut, Bell, Shield, CircleHelp as HelpCircle, Info, Save, CreditCard as Edit3, Mail, Phone, Calendar, Award } from 'lucide-react-native';
import { authService } from '@/lib/supabase';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        setFullName(userData.user_metadata?.full_name || '');
        setEmail(userData.email || '');
        setPhone(userData.user_metadata?.phone || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تسجيل الخروج', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              router.replace('/auth');
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الخروج');
            }
          }
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      // هنا يمكن إضافة كود لتحديث بيانات المستخدم
      Alert.alert('تم', 'تم حفظ البيانات بنجاح');
      setEditMode(false);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
    }
  };

  const ProfileCard = ({ title, icon: Icon, children }: any) => (
    <BlurView intensity={20} style={styles.profileCard}>
      <View style={styles.profileCardHeader}>
        <Icon size={20} color="#667eea" />
        <Text style={styles.profileCardTitle}>{title}</Text>
      </View>
      <View style={styles.profileCardContent}>
        {children}
      </View>
    </BlurView>
  );

  const SettingItem = ({ icon: Icon, title, subtitle, onPress, rightComponent }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <Icon size={20} color="#667eea" />
        <View style={styles.settingItemText}>
          <Text style={styles.settingItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الحساب الشخصي</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Edit3 size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* بطاقة المستخدم */}
        <BlurView intensity={20} style={styles.userCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.userCardGradient}
          >
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <User size={40} color="#ffffff" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {fullName || 'المستخدم'}
                </Text>
                <Text style={styles.userEmail}>
                  {email}
                </Text>
                <View style={styles.userBadge}>
                  <Award size={14} color="#ffd700" />
                  <Text style={styles.userBadgeText}>مدير النظام</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* معلومات الحساب */}
        <ProfileCard title="معلومات الحساب" icon={User}>
          <View style={styles.infoField}>
            <Mail size={16} color="#667eea" />
            <Text style={styles.infoLabel}>البريد الإلكتروني</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={email}
                onChangeText={setEmail}
                placeholder="البريد الإلكتروني"
                placeholderTextColor="#ffffff60"
              />
            ) : (
              <Text style={styles.infoValue}>{email}</Text>
            )}
          </View>

          <View style={styles.infoField}>
            <User size={16} color="#667eea" />
            <Text style={styles.infoLabel}>الاسم الكامل</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="الاسم الكامل"
                placeholderTextColor="#ffffff60"
              />
            ) : (
              <Text style={styles.infoValue}>{fullName || 'غير محدد'}</Text>
            )}
          </View>

          <View style={styles.infoField}>
            <Phone size={16} color="#667eea" />
            <Text style={styles.infoLabel}>رقم الهاتف</Text>
            {editMode ? (
              <TextInput
                style={styles.infoInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="رقم الهاتف"
                placeholderTextColor="#ffffff60"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{phone || 'غير محدد'}</Text>
            )}
          </View>

          <View style={styles.infoField}>
            <Calendar size={16} color="#667eea" />
            <Text style={styles.infoLabel}>تاريخ الانضمام</Text>
            <Text style={styles.infoValue}>
              {user?.created_at ? 
                new Date(user.created_at).toLocaleDateString('ar-SA') : 
                'غير محدد'
              }
            </Text>
          </View>

          {editMode && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.saveButtonGradient}
              >
                <Save size={18} color="#ffffff" />
                <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ProfileCard>

        {/* الإعدادات */}
        <ProfileCard title="الإعدادات" icon={Settings}>
          <SettingItem
            icon={Bell}
            title="الإشعارات"
            subtitle="تفعيل/إيقاف الإشعارات"
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ffffff30', true: '#10b981' }}
                thumbColor={notifications ? '#ffffff' : '#ffffff80'}
              />
            }
          />

          <SettingItem
            icon={Shield}
            title="الخصوصية والأمان"
            subtitle="إعدادات الأمان"
            onPress={() => Alert.alert('قريباً', 'هذه الميزة ستكون متاحة قريباً')}
          />

          <SettingItem
            icon={HelpCircle}
            title="المساعدة والدعم"
            subtitle="الحصول على المساعدة"
            onPress={() => Alert.alert('الدعم', 'للمساعدة، يرجى التواصل معنا')}
          />

          <SettingItem
            icon={Info}
            title="حول التطبيق"
            subtitle="معلومات عن Fasel Power"
            onPress={() => Alert.alert('Fasel Power', 'نسخة 1.0.0\nتطبيق إدارة محل صيانة الهواتف')}
          />
        </ProfileCard>

        {/* تسجيل الخروج */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <BlurView intensity={20} style={styles.logoutButtonBlur}>
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.logoutButtonGradient}
            >
              <LogOut size={20} color="#ffffff" />
              <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  editButton: {
    backgroundColor: '#ffffff20',
    borderRadius: 25,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  userCardGradient: {
    padding: 25,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#ffffff30',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff80',
    marginBottom: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  userBadgeText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#ffffff',
    marginLeft: 5,
  },
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff10',
  },
  profileCardTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  profileCardContent: {
    padding: 20,
  },
  infoField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#ffffff80',
    marginLeft: 10,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff',
  },
  infoInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff',
    backgroundColor: '#ffffff20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: 15,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 12,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff60',
  },
  logoutButton: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  logoutButtonBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
});