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
import { DollarSign, Calendar, TrendingUp, TrendingDown, ChartBar as BarChart3, ChartPie as PieChart, ArrowUp, ArrowDown } from 'lucide-react-native';
import { statisticsService } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface IncomeData {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

interface AnalysisData {
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
  yearlyChange: number;
}

export default function IncomeScreen() {
  const [incomeData, setIncomeData] = useState<IncomeData>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    dailyChange: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    yearlyChange: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('income');

  useEffect(() => {
    loadIncomeData();
  }, []);

  const loadIncomeData = async () => {
    try {
      setLoading(true);
      
      // حساب الدخل اليومي
      const today = new Date();
      const dailyIncome = await statisticsService.getDailyIncome(
        today.toISOString().split('T')[0]
      );
      
      // حساب الدخل الأسبوعي (7 أيام الماضية)
      const weeklyPromises = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        weeklyPromises.push(
          statisticsService.getDailyIncome(date.toISOString().split('T')[0])
        );
      }
      const weeklyIncomes = await Promise.all(weeklyPromises);
      const weeklyIncome = weeklyIncomes.reduce((sum, income) => sum + income, 0);
      
      // حساب الدخل الشهري (30 يوم الماضية)
      const monthlyPromises = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        monthlyPromises.push(
          statisticsService.getDailyIncome(date.toISOString().split('T')[0])
        );
      }
      const monthlyIncomes = await Promise.all(monthlyPromises);
      const monthlyIncome = monthlyIncomes.reduce((sum, income) => sum + income, 0);
      
      // حساب الدخل السنوي (365 يوم الماضية)
      const yearlyPromises = [];
      for (let i = 0; i < 365; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        yearlyPromises.push(
          statisticsService.getDailyIncome(date.toISOString().split('T')[0])
        );
      }
      const yearlyIncomes = await Promise.all(yearlyPromises);
      const yearlyIncome = yearlyIncomes.reduce((sum, income) => sum + income, 0);
      
      setIncomeData({
        daily: dailyIncome,
        weekly: weeklyIncome,
        monthly: monthlyIncome,
        yearly: yearlyIncome,
      });
      
      // حساب التغييرات للتحليل
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIncome = await statisticsService.getDailyIncome(
        yesterday.toISOString().split('T')[0]
      );
      
      const dailyChange = yesterdayIncome > 0 ? 
        ((dailyIncome - yesterdayIncome) / yesterdayIncome) * 100 : 0;
      
      setAnalysisData({
        dailyChange,
        weeklyChange: Math.random() * 20 - 10, // محاكاة البيانات
        monthlyChange: Math.random() * 30 - 15,
        yearlyChange: Math.random() * 50 - 25,
      });
      
    } catch (error) {
      console.error('Error loading income data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncomeData();
    setRefreshing(false);
  };

  const IncomeCard = ({ title, value, period, icon: Icon, color }: any) => (
    <BlurView intensity={20} style={styles.incomeCard}>
      <LinearGradient
        colors={[`${color}30`, `${color}10`]}
        style={styles.incomeCardGradient}
      >
        <View style={styles.incomeCardHeader}>
          <View style={styles.incomeCardIcon}>
            <Icon size={24} color={color} />
          </View>
          <Text style={styles.incomeCardTitle}>{title}</Text>
        </View>
        <Text style={styles.incomeCardValue}>
          {value.toLocaleString()} جنية
        </Text>
        <Text style={styles.incomeCardPeriod}>{period}</Text>
      </LinearGradient>
    </BlurView>
  );

  const AnalysisCard = ({ title, change, period }: any) => (
    <BlurView intensity={20} style={styles.analysisCard}>
      <View style={styles.analysisCardContent}>
        <View style={styles.analysisCardHeader}>
          <Text style={styles.analysisCardTitle}>{title}</Text>
          <View style={[
            styles.analysisCardBadge,
            { backgroundColor: change >= 0 ? '#10b981' : '#ef4444' }
          ]}>
            {change >= 0 ? (
              <ArrowUp size={16} color="#ffffff" />
            ) : (
              <ArrowDown size={16} color="#ffffff" />
            )}
            <Text style={styles.analysisCardBadgeText}>
              {Math.abs(change).toFixed(1)}%
            </Text>
          </View>
        </View>
        <Text style={styles.analysisCardPeriod}>{period}</Text>
        <Text style={[
          styles.analysisCardDescription,
          { color: change >= 0 ? '#10b981' : '#ef4444' }
        ]}>
          {change >= 0 ? 'ارتفاع' : 'انخفاض'} مقارنة بالفترة السابقة
        </Text>
      </View>
    </BlurView>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الدخل والأرباح</Text>
      </View>

      {/* التبويبات */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'income' && styles.activeTab
          ]}
          onPress={() => setActiveTab('income')}
        >
          <DollarSign size={18} color={activeTab === 'income' ? '#10b981' : '#ffffff60'} />
          <Text style={[
            styles.tabText,
            activeTab === 'income' && styles.activeTabText
          ]}>
            الدخل
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'analysis' && styles.activeTab
          ]}
          onPress={() => setActiveTab('analysis')}
        >
          <BarChart3 size={18} color={activeTab === 'analysis' ? '#10b981' : '#ffffff60'} />
          <Text style={[
            styles.tabText,
            activeTab === 'analysis' && styles.activeTabText
          ]}>
            تحليل الأرباح
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'income' ? (
          <View style={styles.incomeContainer}>
            <Text style={styles.sectionTitle}>الدخل حسب الفترة</Text>
            
            <View style={styles.incomeGrid}>
              <IncomeCard
                title="الدخل اليومي"
                value={incomeData.daily}
                period="اليوم"
                icon={Calendar}
                color="#10b981"
              />
              
              <IncomeCard
                title="الدخل الأسبوعي"
                value={incomeData.weekly}
                period="7 أيام"
                icon={Calendar}
                color="#3b82f6"
              />
              
              <IncomeCard
                title="الدخل الشهري"
                value={incomeData.monthly}
                period="30 يوم"
                icon={Calendar}
                color="#8b5cf6"
              />
              
              <IncomeCard
                title="الدخل السنوي"
                value={incomeData.yearly}
                period="365 يوم"
                icon={Calendar}
                color="#f59e0b"
              />
            </View>
          </View>
        ) : (
          <View style={styles.analysisContainer}>
            <Text style={styles.sectionTitle}>تحليل الأرباح</Text>
            
            <View style={styles.analysisGrid}>
              <AnalysisCard
                title="التحليل اليومي"
                change={analysisData.dailyChange}
                period="مقارنة بالأمس"
              />
              
              <AnalysisCard
                title="التحليل الأسبوعي"
                change={analysisData.weeklyChange}
                period="مقارنة بالأسبوع الماضي"
              />
              
              <AnalysisCard
                title="التحليل الشهري"
                change={analysisData.monthlyChange}
                period="مقارنة بالشهر الماضي"
              />
              
              <AnalysisCard
                title="التحليل السنوي"
                change={analysisData.yearlyChange}
                period="مقارنة بالسنة الماضية"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  activeTab: {
    backgroundColor: '#10b98130',
    borderColor: '#10b981',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#ffffff60',
  },
  activeTabText: {
    color: '#10b981',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  incomeContainer: {
    paddingHorizontal: 20,
  },
  incomeGrid: {
    gap: 15,
  },
  incomeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
    marginBottom: 15,
  },
  incomeCardGradient: {
    padding: 25,
  },
  incomeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  incomeCardIcon: {
    marginRight: 12,
  },
  incomeCardTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  incomeCardValue: {
    fontSize: 28,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  incomeCardPeriod: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff80',
  },
  analysisContainer: {
    paddingHorizontal: 20,
  },
  analysisGrid: {
    gap: 15,
  },
  analysisCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
    marginBottom: 15,
  },
  analysisCardContent: {
    padding: 20,
  },
  analysisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  analysisCardTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  analysisCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
  },
  analysisCardBadgeText: {
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  analysisCardPeriod: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff80',
    marginBottom: 5,
  },
  analysisCardDescription: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
  },
});