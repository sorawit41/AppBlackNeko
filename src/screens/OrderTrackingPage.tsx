// src/screens/OrderTrackingPage.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import { supabase } from '../supabaseClient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// 🚩 1. กำหนด Type สำหรับข้อมูลต่างๆ เพื่อให้เป็น TypeScript ที่สมบูรณ์

// สมมติว่า RootStackParamList ของคุณมีลักษณะนี้ (จากไฟล์ App.tsx)
type RootStackParamList = {
  OrderTracking: undefined;
  // ... หน้าอื่นๆ
};

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTracking'>;

interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
}

interface OrderItem {
  productName: string;
  optionName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  verification_status: string | null;
  shipping_address: string;
  contact_info: ContactInfo | null;
  slip_url: string | null;
  // orderItemsToInsert เก็บข้อมูลเป็น JSON string จาก database
  orderItemsToInsert: string;
}

// 2. 🚩 กำหนด Type ให้กับ Parameter ของฟังก์ชัน
function getVerificationStatusText(status: string, verificationResult: string | null): string {
    if (verificationResult) {
        if (verificationResult === 'Approved') return 'อนุมัติแล้ว';
        if (verificationResult === 'Rejected') return 'ถูกปฏิเสธ';
        if (verificationResult === 'Pending More Info') return 'ต้องการข้อมูลเพิ่มเติม';
        return verificationResult;
    }
    switch (status) {
        case 'payment_uploaded': return 'รอการตรวจสอบสลิป';
        case 'pending_confirmation': return 'รอการยืนยัน';
        case 'payment_verified': return 'การชำระเงินถูกต้อง';
        case 'payment_rejected': return 'การชำระเงินไม่ถูกต้อง';
        case 'processing': return 'กำลังเตรียมสินค้า';
        case 'shipped': return 'จัดส่งแล้ว';
        case 'completed': return 'คำสั่งซื้อสำเร็จ';
        case 'cancelled': return 'ยกเลิกคำสั่งซื้อ';
        default: return status || 'N/A';
    }
}

// 🚩 3. กำหนด Type ของ Component เป็น React.FC (Functional Component) และใส่ Props
const OrderTrackingPage: React.FC<Props> = () => {
  // 🚩 4. กำหนด Type ให้กับ State แต่ละตัว
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('กรุณาเข้าสู่ระบบเพื่อดูคำสั่งซื้อ');
        }

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, orderItemsToInsert, verification_status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        setOrders(ordersData || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);


  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#023047" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูลคำสั่งซื้อ...</Text>
      </View>
    );
  }

  if (error && !selectedOrder) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  if (selectedOrder) {
    const verificationText = getVerificationStatusText(selectedOrder.status, selectedOrder.verification_status);
    const contactInfo = selectedOrder.contact_info;
    let orderItems: OrderItem[] = [];
    try {
        if(selectedOrder.orderItemsToInsert) {
            orderItems = JSON.parse(selectedOrder.orderItemsToInsert);
        }
    } catch(e) {
        console.error("Failed to parse order items:", e);
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container}>
          <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>&lt; กลับไปที่รายการ</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.detailTitle}>รายละเอียดคำสั่งซื้อ</Text>
            <Text style={styles.detailOrderId}>#{selectedOrder.id.substring(0, 8)}</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>วันที่สั่งซื้อ:</Text>
              <Text style={styles.detailValue}>{new Date(selectedOrder.created_at).toLocaleString('th-TH')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ยอดรวม:</Text>
              <Text style={styles.detailValue}>{selectedOrder.total_amount.toFixed(2)} บาท</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>สถานะ:</Text>
              <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>{verificationText}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.detailTitle}>ที่อยู่และข้อมูลติดต่อ</Text>
            <Text style={styles.detailValue}>{selectedOrder.shipping_address}</Text>
            {contactInfo?.name && <Text style={styles.detailValue}>คุณ {contactInfo.name}</Text>}
            {contactInfo?.phone && <Text style={styles.detailValue}>โทร: {contactInfo.phone}</Text>}
          </View>
          
          {selectedOrder.slip_url && (
            <TouchableOpacity style={styles.slipButton} onPress={() => Linking.openURL(selectedOrder.slip_url!)}>
                <Text style={styles.slipButtonText}>ดูหลักฐานการชำระเงิน</Text>
            </TouchableOpacity>
          )}

          <View style={styles.card}>
            <Text style={styles.detailTitle}>รายการสินค้า</Text>
            {orderItems.length > 0 ? orderItems.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemName}>{item.productName} ({item.optionName})</Text>
                <Text style={styles.itemDetails}>จำนวน: {item.quantity} x {item.price.toFixed(2)}</Text>
                <Text style={styles.itemTotal}>รวม: {(item.quantity * item.price).toFixed(2)} บาท</Text>
              </View>
            )) : <Text style={styles.detailValue}>ไม่พบข้อมูลรายการสินค้า</Text>}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🚩 5. กำหนด Type ให้กับ FlatList เพื่อให้ item ใน renderItem เป็น Type Order อัตโนมัติ */}
      <FlatList<Order>
        data={orders}
        keyExtractor={(item) => item.id}
        style={styles.container}
        ListHeaderComponent={<Text style={styles.headerTitle}>รายการคำสั่งซื้อของคุณ</Text>}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.errorText}>คุณยังไม่มีคำสั่งซื้อ</Text>
          </View>
        }
        renderItem={({ item }) => {
          const verificationText = getVerificationStatusText(item.status, item.verification_status);
          return (
            <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedOrder(item)}>
              <View style={styles.orderCardRow}>
                <Text style={styles.orderId}>คำสั่งซื้อ #{item.id.substring(0, 8)}</Text>
                <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString('th-TH')}</Text>
              </View>
              <View style={styles.orderCardRow}>
                <Text style={styles.orderTotal}>{item.total_amount.toFixed(2)} บาท</Text>
                <Text style={styles.orderStatus}>{verificationText}</Text>
              </View>
              <View style={styles.viewDetailsButton}>
                 <Text style={styles.viewDetailsText}>ดูรายละเอียด</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
      marginTop: 10,
      color: '#666'
  },
  errorText: {
    fontSize: 16,
    color: '#888',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d3557',
    marginVertical: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023047',
  },
  orderDate: {
    fontSize: 14,
    color: '#6c757d',
  },
  orderTotal: {
    fontSize: 16,
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FB8500',
  },
  viewDetailsButton: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#f1f1f1'
  },
  viewDetailsText: {
      textAlign: 'center',
      color: '#023047',
      fontWeight: 'bold'
  },
  // -- Detail View Styles --
  backButton: {
    marginVertical: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#023047',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d3557',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10
  },
  detailOrderId: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 15,
    color: '#6c757d',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 10,
  },
  slipButton: {
    backgroundColor: '#FFB703',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  slipButtonText: {
    color: '#023047',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  itemTotal: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'right',
  }
});

export default OrderTrackingPage;