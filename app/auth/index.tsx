import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { authService } from '@/lib/supabase';
import { User, Lock, Mail, Phone, Eye, EyeOff } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      checkUser();
    }
  }, [mounted]);

  const checkUser = async () => {
    if (!mounted) return;
    
    try {
      const user = await authService.getCurrentUser();
      if (user && mounted) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.warn('Auth check warning:', error);
      // المستخدم غير مسجل - البقاء في صفحة تسجيل الدخول
    }
  };

  const handleAuth = async () => {
    if (!mounted) return;
    
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await authService.signIn(email, password);
        if (mounted) {
          router.replace('/(tabs)');
        }
      } else {
        if (!fullName) {
          Alert.alert('خطأ', 'يرجى إدخال الاسم الكامل');
          return;
        }
        await authService.signUp(email, password, fullName);
        if (mounted) {
          Alert.alert('تم', 'تم إنشاء الحساب بنجاح');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.warn('Auth warning:', error);
      if (mounted) {
        Alert.alert('خطأ', error.message || 'حدث خطأ أثناء المصادقة');
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* الشعار */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#ffffff40', '#ffffff20']}
                style={styles.logoGradient}
              >
                <Text style={styles.logoText}>Fasel Power</Text>
                <Text style={styles.logoSubText}>إدارة صيانة الهواتف</Text>
              </LinearGradient>
            </View>

            {/* نموذج تسجيل الدخول */}
            <BlurView intensity={20} style={styles.formContainer}>
              <View style={styles.form}>
                <Text style={styles.formTitle}>
                  {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                </Text>

                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <User size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="الاسم الكامل"
                      placeholderTextColor="#9ca3af"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Mail size={20} color="#667eea" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="البريد الإلكتروني"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Lock size={20} color="#667eea" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="كلمة المرور"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#667eea" />
                    ) : (
                      <Eye size={20} color="#667eea" />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'جاري المعالجة...' : isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setIsLogin(!isLogin)}
                >
                  <Text style={styles.switchText}>
                    {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب؟ تسجيل الدخول'}
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoGradient: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  logoText: {
    fontSize: 32,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
  },
  logoSubText: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff90',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  form: {
    padding: 30,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff20',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    textAlign: 'right',
  },
  passwordToggle: {
    padding: 5,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#ffffff90',
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
  },
});