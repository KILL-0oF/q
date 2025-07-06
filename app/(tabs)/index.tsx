import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Smartphone, Clock, CircleCheck as CheckCircle, Circle as XCircle, Package, TrendingUp, Users, Star } from 'lucide-react-native';
import { statisticsService, authService } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface Stats {
  pending: number;
  repaired: number;
  cannot_repair: number;
  delivered: number;
  total: number;
}

export default function HomeScreen() {
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    repaired: 0,
    cannot_repair: 0,
    delivered: 0,
    total: 0
  });
  const [dailyIncome, setDailyIncome] = useState(0);
  const [commonIssues, setCommonIssues] = useState<any[]>([]);
  const [commonDevices, setCommonDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      checkAuth();
      loadData();
    }
  }, [mounted]);

  const checkAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user && mounted) {
        router.replace('/auth');
      }
    } catch (error) {
      console.warn('Auth check warning:', error);
      if (mounted) {
        router.replace('/auth');
      }
    }
  };

  const loadData = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      const [statsData, incomeData, issuesData, devicesData] = await Promise.all([
        statisticsService.getOverallStats(),
        statisticsService.getDailyIncome(),
        statisticsService.getMostCommonIssues(5),
        statisticsService.getMostCommonDevices(5),
      ]);

      if (mounted) {
        setStats(statsData);
        setDailyIncome(incomeData);
        setCommonIssues(issuesData);
        setCommonDevices(devicesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set default values on error
      if (mounted) {
        setStats({
          pending: 0,
          repaired: 0,
          cannot_repair: 0,
          delivered: 0,
          total: 0
        });
        setDailyIncome(0);
        setCommonIssues([]);
        setCommonDevices([]);
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    if (!mounted) return;
    
    setRefreshing(true);
    await loadData();
    if (mounted) {
      setRefreshing(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.statCard}>
      <BlurView intensity={20} style={styles.statCardBlur}>
        <LinearGradient
          colors={[`${color}30`, `${color}10`]}
          style={styles.statCardGradient}
        >
          <View style={styles.statCardContent}>
            <View style={styles.statCardIcon}>
              <Icon size={24} color={color} />
            </View>
            <Text style={styles.statCardValue}>{value}</Text>
            <Text style={styles.statCardTitle}>{title}</Text>
          </View>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );

  const ListCard = ({ title, data, icon: Icon }: any) => (
    <BlurView intensity={20} style={styles.listCard}>
      <View style={styles.listCardHeader}>
        <Icon size={20} color="#667eea" />
        <Text style={styles.listCardTitle}>{title}</Text>
      </View>
      <View style={styles.listCardContent}>
        {data.length > 0 ? (
          data.map((item: any, index: number) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listItemText}>
                {item.issue || item.device}
              </Text>
              <Text style={styles.listItemCount}>{item.count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>لا توجد بيانات</Text>
        )}
      </View>
    </BlurView>
  );

  if (!mounted) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Fasel Power</Text>
          <Text style={styles.headerSubtitle}>لوحة التحكم الرئيسية</Text>
        </View>

        {/* بطاقة الدخل اليومي */}
        <BlurView intensity={20} style={styles.incomeCard}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.incomeGradient}
          >
            <View style={styles.incomeContent}>
              <TrendingUp size={30} color="#ffffff" />
              <Text style={styles.incomeValue}>
                {dailyIncome.toLocaleString()} جنية
              </Text>
              <Text style={styles.incomeTitle}>الدخل اليومي</Text>
            </View>
          </LinearGradient>
        </BlurView>

        {/* إحصائيات الأجهزة */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>إحصائيات الأجهزة</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="قيد الانتظار"
              value={stats.pending}
              icon={Clock}
              color="#f59e0b"
              onPress={() => router.push('/devices')}
            />
            <StatCard
              title="تم صيانته"
              value={stats.repaired}
              icon={CheckCircle}
              color="#10b981"
              onPress={() => router.push('/devices')}
            />
            <StatCard
              title="لا يمكن تصليحه"
              value={stats.cannot_repair}
              icon={XCircle}
              color="#ef4444"
              onPress={() => router.push('/devices')}
            />
            <StatCard
              title="تم تسليمه"
              value={stats.delivered}
              icon={Package}
              color="#8b5cf6"
              onPress={() => router.push('/devices')}
            />
          </View>
        </View>

        {/* التحليلات */}
        <View style={styles.analyticsContainer}>
          <Text style={styles.sectionTitle}>التحليلات</Text>
          <View style={styles.analyticsGrid}>
            <ListCard
              title="أكثر الأعطال شيوعاً"
              data={commonIssues}
              icon={Star}
            />
            <ListCard
              title="أكثر الأجهزة شيوعاً"
              data={commonDevices}
              icon={Smartphone}
            />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff80',
  },
  incomeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  incomeGradient: {
    padding: 25,
  },
  incomeContent: {
    alignItems: 'center',
  },
  incomeValue: {
    fontSize: 28,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginVertical: 10,
  },
  incomeTitle: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff90',
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  statCardBlur: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  statCardGradient: {
    padding: 20,
  },
  statCardContent: {
    alignItems: 'center',
  },
  statCardIcon: {
    marginBottom: 10,
  },
  statCardValue: {
    fontSize: 24,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  statCardTitle: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff90',
    textAlign: 'center',
  },
  analyticsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  analyticsGrid: {
    gap: 15,
  },
  listCard: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff10',
  },
  listCardTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  listCardContent: {
    padding: 15,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  listItemText: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff90',
    flex: 1,
  },
  listItemCount: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#667eea',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff60',
    textAlign: 'center',
    paddingVertical: 20,
  },
});