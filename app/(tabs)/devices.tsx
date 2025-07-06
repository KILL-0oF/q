import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Plus, Search, Eye, CreditCard as Edit3, Trash2, CircleCheck as CheckCircle, Circle as XCircle, Package, Clock, Phone, User, Calendar, DollarSign, CircleAlert as AlertCircle, Save, X } from 'lucide-react-native';
import { deviceService, Device } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [mounted, setMounted] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_type: '',
    customer_name: '',
    customer_phone: '',
    issue_description: '',
    service_price: '',
    amount_paid: '',
    serial_number: '',
    customer_notes: '',
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadDevices();
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      filterDevices();
    }
  }, [devices, activeTab, searchText, mounted]);

  const loadDevices = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      const data = await deviceService.getDevices();
      if (mounted) {
        setDevices(data || []);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      if (mounted) {
        setDevices([]);
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
    await loadDevices();
    if (mounted) {
      setRefreshing(false);
    }
  };

  const filterDevices = () => {
    if (!mounted) return;
    
    let filtered = devices.filter(device => device.status === activeTab);
    
    if (searchText) {
      filtered = filtered.filter(device =>
        device.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
        device.customer_phone.includes(searchText) ||
        device.device_type.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    setFilteredDevices(filtered);
  };

  const handleAddDevice = async () => {
    if (!mounted) return;
    
    try {
      if (!newDevice.device_type || !newDevice.customer_name || !newDevice.customer_phone || !newDevice.issue_description) {
        Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const deviceData = {
        ...newDevice,
        service_price: parseFloat(newDevice.service_price) || 0,
        amount_paid: parseFloat(newDevice.amount_paid) || 0,
        status: 'pending' as const,
        created_by: 'current_user_id', // سيتم تحديثه لاحقاً
      };

      await deviceService.createDevice(deviceData);
      if (mounted) {
        setShowAddModal(false);
        setNewDevice({
          device_type: '',
          customer_name: '',
          customer_phone: '',
          issue_description: '',
          service_price: '',
          amount_paid: '',
          serial_number: '',
          customer_notes: '',
        });
        loadDevices();
        Alert.alert('تم', 'تم إضافة الجهاز بنجاح');
      }
    } catch (error) {
      if (mounted) {
        Alert.alert('خطأ', 'حدث خطأ أثناء إضافة الجهاز');
      }
    }
  };

  const handleUpdateDevice = async () => {
    if (!mounted || !selectedDevice) return;
    
    try {
      const updates = {
        device_type: selectedDevice.device_type,
        customer_name: selectedDevice.customer_name,
        customer_phone: selectedDevice.customer_phone,
        issue_description: selectedDevice.issue_description,
        service_price: selectedDevice.service_price,
        amount_paid: selectedDevice.amount_paid,
        serial_number: selectedDevice.serial_number,
        customer_notes: selectedDevice.customer_notes,
      };

      await deviceService.updateDevice(selectedDevice.id, updates);
      if (mounted) {
        setShowEditModal(false);
        setSelectedDevice(null);
        loadDevices();
        Alert.alert('تم', 'تم تحديث الجهاز بنجاح');
      }
    } catch (error) {
      if (mounted) {
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الجهاز');
      }
    }
  };

  const handleDeleteDevice = (device: Device) => {
    if (!mounted) return;
    
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الجهاز؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => confirmDelete(device.id) },
      ]
    );
  };

  const confirmDelete = async (deviceId: string) => {
    if (!mounted) return;
    
    try {
      await deviceService.deleteDevice(deviceId);
      if (mounted) {
        loadDevices();
        Alert.alert('تم', 'تم حذف الجهاز بنجاح');
      }
    } catch (error) {
      if (mounted) {
        Alert.alert('خطأ', 'حدث خطأ أثناء حذف الجهاز');
      }
    }
  };

  const handleStatusChange = async (device: Device, newStatus: Device['status'], notes?: string) => {
    if (!mounted) return;
    
    try {
      if (newStatus === 'delivered' && device.remaining_amount > 0) {
        Alert.alert('تحذير', 'لم يتم سداد القيمة المستحقة');
        return;
      }

      await deviceService.updateDeviceStatus(device.id, newStatus, notes);
      if (mounted) {
        loadDevices();
        Alert.alert('تم', 'تم تحديث حالة الجهاز بنجاح');
      }
    } catch (error) {
      if (mounted) {
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الجهاز');
      }
    }
  };

  const handleCannotRepair = (device: Device) => {
    if (!mounted) return;
    
    Alert.prompt(
      'سبب عدم إمكانية الإصلاح',
      'يرجى إدخال سبب عدم إمكانية إصلاح هذا الجهاز',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تأكيد', 
          onPress: (reason) => {
            if (reason && mounted) {
              handleStatusChange(device, 'cannot_repair', reason);
            }
          }
        },
      ],
      'plain-text'
    );
  };

  const tabs = [
    { key: 'pending', title: 'قيد الانتظار', icon: Clock, color: '#f59e0b' },
    { key: 'repaired', title: 'تم صيانته', icon: CheckCircle, color: '#10b981' },
    { key: 'cannot_repair', title: 'لا يمكن تصليحه', icon: XCircle, color: '#ef4444' },
    { key: 'delivered', title: 'تم تسليمه', icon: Package, color: '#8b5cf6' },
  ];

  const renderDevice = (device: Device) => (
    <BlurView key={device.id} intensity={20} style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceTitle} numberOfLines={1}>{device.device_type}</Text>
          <View style={styles.deviceMeta}>
            <User size={14} color="#ffffff80" />
            <Text style={styles.deviceMetaText} numberOfLines={1}>{device.customer_name}</Text>
          </View>
          <View style={styles.deviceMeta}>
            <Phone size={14} color="#ffffff80" />
            <Text style={styles.deviceMetaText} numberOfLines={1}>{device.customer_phone}</Text>
          </View>
        </View>
        <View style={styles.deviceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedDevice(device);
              setShowViewModal(true);
            }}
          >
            <Eye size={16} color="#667eea" />
          </TouchableOpacity>
          
          {device.status !== 'delivered' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedDevice(device);
                setShowEditModal(true);
              }}
            >
              <Edit3 size={16} color="#10b981" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteDevice(device)}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.deviceIssue} numberOfLines={2}>{device.issue_description}</Text>
      
      <View style={styles.deviceFooter}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>السعر: {device.service_price} جنية</Text>
          {device.remaining_amount > 0 && (
            <Text style={styles.remainingAmount}>
              المتبقي: {device.remaining_amount} جنية
            </Text>
          )}
        </View>
        
        <View style={styles.statusActions}>
          {device.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#10b981' }]}
                onPress={() => handleStatusChange(device, 'repaired')}
              >
                <CheckCircle size={14} color="#ffffff" />
                <Text style={styles.statusButtonText}>تم صيانته</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#ef4444' }]}
                onPress={() => handleCannotRepair(device)}
              >
                <XCircle size={14} color="#ffffff" />
                <Text style={styles.statusButtonText}>لا يمكن تصليحه</Text>
              </TouchableOpacity>
            </>
          )}
          
          {(device.status === 'repaired' || device.status === 'cannot_repair') && (
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#8b5cf6' }]}
              onPress={() => handleStatusChange(device, 'delivered')}
            >
              <Package size={14} color="#ffffff" />
              <Text style={styles.statusButtonText}>تسليم الجهاز</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BlurView>
  );

  const renderModal = (visible: boolean, onClose: () => void, title: string, content: React.ReactNode) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );

  if (!mounted) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة الأجهزة</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* شريط البحث */}
      <View style={styles.searchContainer}>
        <BlurView intensity={20} style={styles.searchBar}>
          <Search size={20} color="#ffffff80" />
          <TextInput
            style={styles.searchInput}
            placeholder="البحث عن جهاز..."
            placeholderTextColor="#ffffff60"
            value={searchText}
            onChangeText={setSearchText}
          />
        </BlurView>
      </View>

      {/* التبويبات */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { backgroundColor: `${tab.color}40` }
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <tab.icon size={18} color={activeTab === tab.key ? tab.color : '#ffffff60'} />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && { color: tab.color }
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* قائمة الأجهزة */}
      <ScrollView
        style={styles.devicesList}
        contentContainerStyle={styles.devicesListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredDevices.length > 0 ? (
          filteredDevices.map(renderDevice)
        ) : (
          <BlurView intensity={20} style={styles.noDataContainer}>
            <Text style={styles.noDataText}>لا توجد أجهزة في هذا القسم</Text>
          </BlurView>
        )}
      </ScrollView>

      {/* نافذة إضافة جهاز جديد */}
      {renderModal(showAddModal, () => setShowAddModal(false), 'إضافة جهاز جديد', (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.formInput}
            placeholder="نوع الجهاز"
            placeholderTextColor="#ffffff60"
            value={newDevice.device_type}
            onChangeText={(text) => setNewDevice({...newDevice, device_type: text})}
          />
          <TextInput
            style={styles.formInput}
            placeholder="اسم العميل"
            placeholderTextColor="#ffffff60"
            value={newDevice.customer_name}
            onChangeText={(text) => setNewDevice({...newDevice, customer_name: text})}
          />
          <TextInput
            style={styles.formInput}
            placeholder="رقم هاتف العميل"
            placeholderTextColor="#ffffff60"
            value={newDevice.customer_phone}
            onChangeText={(text) => setNewDevice({...newDevice, customer_phone: text})}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.formInput, styles.textArea]}
            placeholder="وصف العطل"
            placeholderTextColor="#ffffff60"
            value={newDevice.issue_description}
            onChangeText={(text) => setNewDevice({...newDevice, issue_description: text})}
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={styles.formInput}
            placeholder="سعر الخدمة"
            placeholderTextColor="#ffffff60"
            value={newDevice.service_price}
            onChangeText={(text) => setNewDevice({...newDevice, service_price: text})}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.formInput}
            placeholder="المبلغ المدفوع"
            placeholderTextColor="#ffffff60"
            value={newDevice.amount_paid}
            onChangeText={(text) => setNewDevice({...newDevice, amount_paid: text})}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.formInput}
            placeholder="الرقم التسلسلي (اختياري)"
            placeholderTextColor="#ffffff60"
            value={newDevice.serial_number}
            onChangeText={(text) => setNewDevice({...newDevice, serial_number: text})}
          />
          <TextInput
            style={[styles.formInput, styles.textArea]}
            placeholder="ملاحظات العميل (اختياري)"
            placeholderTextColor="#ffffff60"
            value={newDevice.customer_notes}
            onChangeText={(text) => setNewDevice({...newDevice, customer_notes: text})}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleAddDevice}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.submitButtonGradient}
            >
              <Save size={18} color="#ffffff" />
              <Text style={styles.submitButtonText}>حفظ الجهاز</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ))}

      {/* نافذة تعديل الجهاز */}
      {renderModal(showEditModal, () => setShowEditModal(false), 'تعديل الجهاز', (
        selectedDevice && (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.formInput}
              placeholder="نوع الجهاز"
              placeholderTextColor="#ffffff60"
              value={selectedDevice.device_type}
              onChangeText={(text) => setSelectedDevice({...selectedDevice, device_type: text})}
            />
            <TextInput
              style={styles.formInput}
              placeholder="اسم العميل"
              placeholderTextColor="#ffffff60"
              value={selectedDevice.customer_name}
              onChangeText={(text) => setSelectedDevice({...selectedDevice, customer_name: text})}
            />
            <TextInput
              style={styles.formInput}
              placeholder="رقم هاتف العميل"
              placeholderTextColor="#ffffff60"
              value={selectedDevice.customer_phone}
              onChangeText={(text) => setSelectedDevice({...selectedDevice, customer_phone: text})}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="وصف العطل"
              placeholderTextColor="#ffffff60"
              value={selectedDevice.issue_description}
              onChangeText={(text) => setSelectedDevice({...selectedDevice, issue_description: text})}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.formInput}
              placeholder="سعر الخدمة"
              placeholderTextColor="#ffffff60"
              value={selectedDevice.service_price.toString()}
              onChangeText={(text) => setSelectedDevice({...selectedDevice, service_price: parseFloat(text) || 0})}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.formInput}
              placeholder="المبلغ المدفوع"
              placeholderTextColor="#ffffff60"
              value={selectedDevice.amount_paid.toString()}
              onChangeText={(text) => setSelectedDevice({...selectedDevice, amount_paid: parseFloat(text) || 0})}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.formInput}
              placeholder="الرقم التسلسلي (اختياري)"
              placeholderTextColor="#ffffff60"
              value={selectedDevice.serial_number || ''}
              onChangeText={(text) => setSelectedDevice({...selectedDevice, serial_number: text})}
            />
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="ملاحظات العميل (اختياري)"
              placeholderTextColor="#ffffff60"
              value={selectedDevice.customer_notes || ''}
              onChangeText={(text) => setSelectedDevice({...selectedDevice, customer_notes: text})}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleUpdateDevice}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.submitButtonGradient}
              >
                <Save size={18} color="#ffffff" />
                <Text style={styles.submitButtonText}>حفظ التعديلات</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )
      ))}

      {/* نافذة عرض تفاصيل الجهاز */}
      {renderModal(showViewModal, () => setShowViewModal(false), 'تفاصيل الجهاز', (
        selectedDevice && (
          <View style={styles.viewContainer}>
            <View style={styles.viewField}>
              <Text style={styles.viewLabel}>نوع الجهاز:</Text>
              <Text style={styles.viewValue}>{selectedDevice.device_type}</Text>
            </View>
            <View style={styles.viewField}>
              <Text style={styles.viewLabel}>اسم العميل:</Text>
              <Text style={styles.viewValue}>{selectedDevice.customer_name}</Text>
            </View>
            <View style={styles.viewField}>
              <Text style={styles.viewLabel}>رقم الهاتف:</Text>
              <Text style={styles.viewValue}>{selectedDevice.customer_phone}</Text>
            </View>
            <View style={styles.viewField}>
              <Text style={styles.viewLabel}>وصف العطل:</Text>
              <Text style={styles.viewValue}>{selectedDevice.issue_description}</Text>
            </View>
            <View style={styles.viewField}>
              <Text style={styles.viewLabel}>سعر الخدمة:</Text>
              <Text style={styles.viewValue}>{selectedDevice.service_price} جنية</Text>
            </View>
            <View style={styles.viewField}>
              <Text style={styles.viewLabel}>المبلغ المدفوع:</Text>
              <Text style={styles.viewValue}>{selectedDevice.amount_paid} جنية</Text>
            </View>
            <View style={styles.viewField}>
              <Text style={styles.viewLabel}>المبلغ المتبقي:</Text>
              <Text style={styles.viewValue}>{selectedDevice.remaining_amount} جنية</Text>
            </View>
            {selectedDevice.serial_number && (
              <View style={styles.viewField}>
                <Text style={styles.viewLabel}>الرقم التسلسلي:</Text>
                <Text style={styles.viewValue}>{selectedDevice.serial_number}</Text>
              </View>
            )}
            {selectedDevice.customer_notes && (
              <View style={styles.viewField}>
                <Text style={styles.viewLabel}>ملاحظات العميل:</Text>
                <Text style={styles.viewValue}>{selectedDevice.customer_notes}</Text>
              </View>
            )}
            {selectedDevice.repair_notes && (
              <View style={styles.viewField}>
                <Text style={styles.viewLabel}>ملاحظات الصيانة:</Text>
                <Text style={styles.viewValue}>{selectedDevice.repair_notes}</Text>
              </View>
            )}
            <View style={styles.viewField}>
              <Text style={styles.viewLabel}>تاريخ التسجيل:</Text>
              <Text style={styles.viewValue}>
                {new Date(selectedDevice.created_at).toLocaleDateString('ar-SA')}
              </Text>
            </View>
            {selectedDevice.delivered_at && (
              <View style={styles.viewField}>
                <Text style={styles.viewLabel}>تاريخ التسليم:</Text>
                <Text style={styles.viewValue}>
                  {new Date(selectedDevice.delivered_at).toLocaleDateString('ar-SA')}
                </Text>
              </View>
            )}
          </View>
        )
      ))}
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
  addButton: {
    backgroundColor: '#ffffff20',
    borderRadius: 50,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff20',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    maxHeight: 50,
  },
  tabsContent: {
    paddingRight: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#ffffff20',
    minWidth: 120,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#ffffff60',
  },
  devicesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  devicesListContent: {
    paddingBottom: 20,
  },
  deviceCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: '#ffffff10',
  },
  deviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  deviceTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  deviceMetaText: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff80',
    marginLeft: 5,
    flex: 1,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#ffffff20',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  deviceIssue: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff90',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  deviceFooter: {
    padding: 15,
  },
  priceInfo: {
    marginBottom: 15,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#ffffff80',
    marginBottom: 2,
  },
  remainingAmount: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#f59e0b',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
    minWidth: 100,
  },
  statusButtonText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#ffffff',
  },
  noDataContainer: {
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff30',
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff60',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff10',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  modalContent: {
    padding: 20,
    maxHeight: '80%',
  },
  formContainer: {
    gap: 15,
  },
  formInput: {
    backgroundColor: '#ffffff20',
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    borderWidth: 1,
    borderColor: '#ffffff30',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff',
  },
  viewContainer: {
    gap: 15,
  },
  viewField: {
    backgroundColor: '#ffffff10',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  viewLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#ffffff80',
    marginBottom: 5,
  },
  viewValue: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    color: '#ffffff',
    textAlign: 'right',
  },
});