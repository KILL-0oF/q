import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { TrendingUp, Smartphone, CircleAlert as AlertCircle, ChartBar as BarChart3, ChartPie as PieChart, Award, Star } from 'lucide-react-native';
import { statisticsService, CommonIssue, CommonDevice } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [commonIssues, setCommonIssues] = useState<CommonIssue[]>([]);
  const [commonDevices, setCommonDevices] = useState<CommonDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('issues');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [issuesData, devicesData] = await Promise.all([
        statisticsService.getMostCommonIssues(20),
        statisticsService.getMostCommonDevices(20),
      ]);

      setCommonIssues(issuesData);
      setCommonDevices(devicesData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const renderRankItem = (item: any, index: number, type: 'issue' | 'device') => {
    const getRankColor = (rank: number) => {
      if (rank === 0) return '#ffd700'; // ذهبي
      if (rank === 1) return '#c0c0c0'; // فضي
      if (rank === 2) return '#cd7f32'; // برونزي
      return '#667eea'; // أزرق
    };

    const getRankIcon = (rank: number) => {
      if (rank < 3) return Award;
      return Star;
    };

    const RankIcon = getRankIcon(index);
    const rankColor = getRankColor(index);

    return (
      <BlurView key={index} intensity={20} style={styles.rankItem}>
        <View style={styles.rankItemContent}>
          <View style={styles.rankLeft}>
            <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <RankIcon size={20} color={rankColor} style={styles.rankIcon} />
          </View>
          
          <View style={styles.rankInfo}>
            <Text style={styles.rankTitle}>
              {type === 'issue' ? item.issue : item.device}
            </Text>
            <Text style={styles.rankSubtitle}>
              {type === 'issue' ? 'نوع العطل' : 'نوع الجهاز'}
            </Text>
          </View>
          
          <View style={styles.rankRight}>
            <Text style={styles.rankCount}>{item.count}</Text>
            <Text style={styles.rankLabel}>
              {type === 'issue' ? 'جهاز' : 'جهاز'}
            </Text>
          </View>
        </View>
      </BlurView>
    );
  };

  const calculatePercentage = (count: number, total: number) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0';
  };

  const totalIssues = commonIssues.reduce((sum, item) => sum + item.count, 0);
  const totalDevices = commonDevices.reduce((sum, item) => sum + item.count, 0);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التحليلات والإحصائيات</Text>
      </View>

      {/* التبويبات */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'issues' && styles.activeTab
          ]}
          onPress={() => setActiveTab('issues')}
        >
          <AlertCircle size={18} color={activeTab === 'issues' ? '#ef4444' : '#ffffff60'} />
          <Text style={[
            styles.tabText,
            activeTab === 'issues' && styles.activeTabText
          ]}>
            أكثر الأعطال
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'devices' && styles.activeTab
          ]}
          onPress={() => setActiveTab('devices')}
        >
          <Smartphone size={18} color={activeTab === 'devices' ? '#10b981' : '#ffffff60'} />
          <Text style={[
            styles.tabText,
            activeTab === 'devices' && styles.activeTabText
          ]}>
            أكثر الأجهزة
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'issues' ? (
          <View style={styles.section}>
            <BlurView intensity={20} style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <AlertCircle size={24} color="#ef4444" />
                <Text style={styles.sectionTitle}>أكثر الأعطال شيوعاً</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                إجمالي الأعطال المسجلة: {totalIssues}
              </Text>
            </BlurView>

            <View style={styles.ranksList}>
              {commonIssues.length > 0 ? (
                commonIssues.map((item, index) => renderRankItem(item, index, 'issue'))
              ) : (
                <BlurView intensity={20} style={styles.noDataCard}>
                  <Text style={styles.noDataText}>لا توجد بيانات أعطال</Text>
                </BlurView>
              )}
            </View>

            {/* إحصائيات إضافية */}
            {commonIssues.length > 0 && (
              <BlurView intensity={20} style={styles.statsCard}>
                <Text style={styles.statsTitle}>إحصائيات الأعطال</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {calculatePercentage(commonIssues[0]?.count || 0, totalIssues)}%
                    </Text>
                    <Text style={styles.statLabel}>العطل الأكثر شيوعاً</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{commonIssues.length}</Text>
                    <Text style={styles.statLabel}>أنواع الأعطال</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {(totalIssues / commonIssues.length).toFixed(1)}
                    </Text>
                    <Text style={styles.statLabel}>متوسط الأعطال</Text>
                  </View>
                </View>
              </BlurView>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <BlurView intensity={20} style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <Smartphone size={24} color="#10b981" />
                <Text style={styles.sectionTitle}>أكثر الأجهزة شيوعاً</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                إجمالي الأجهزة المسجلة: {totalDevices}
              </Text>
            </BlurView>

            <View style={styles.ranksList}>
              {commonDevices.length > 0 ? (
                commonDevices.map((item, index) => renderRankItem(item, index, 'device'))
              ) : (
                <BlurView intensity={20} style={styles.noDataCard}>
                  <Text style={styles.noDataText}>لا توجد بيانات أجهزة</Text>
                </BlurView>
              )}
            </View>

            {/* إحصائيات إضافية */}
            {commonDevices.length > 0 && (
              <BlurView intensity={20} style={styles.statsCard}>
                <Text style={styles.statsTitle}>إحصائيات الأجهزة</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {calculatePercentage(commonDevices[0]?.count || 0, totalDevices)}%
                    </Text>
                    <Text style={styles.statLabel}>الجهاز الأكثر شيوعاً</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{commonDevices.length}</Text>
                    <Text style={styles.statLabel}>أنواع الأجهزة</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {(totalDevices / commonDevices.length).toFixed(1)}
                    </Text>
                    <Text style={styles.statLabel}>متوسط الأجهزة</Text>
                  </View>
                </View>
              </BlurView>
            )}
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
    backgroundColor: '#ffffff20',
    borderColor: '#ffffff40',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#ffffff60',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff80',
  },
  ranksList: {
    gap: 12,
    marginBottom: 20,
  },
  rankItem: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  rankItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankNumber: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  rankIcon: {
    marginRight: 5,
  },
  rankInfo: {
    flex: 1,
  },
  rankTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginBottom: 3,
  },
  rankSubtitle: {
    fontSize: 12,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff60',
  },
  rankRight: {
    alignItems: 'center',
  },
  rankCount: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  rankLabel: {
    fontSize: 12,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff60',
  },
  noDataCard: {
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff60',
  },
  statsCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff80',
    textAlign: 'center',
  },
});