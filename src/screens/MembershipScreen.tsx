// src/screens/MembershipScreen.js

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import QRCode from 'react-native-qrcode-svg';

// ข้อมูลระดับสมาชิกตามรูปภาพ
const tiers = [
    { name: 'SAPPHIRE', minPoints: 0, color: '#3B82F6' },
    { name: 'EMERALD', minPoints: 200, color: '#10B981' },
    { name: 'RUBY', minPoints: 600, color: '#EF4444' },
    { name: 'DIAMOND', minPoints: 1500, color: '#A855F7' },
    { name: 'BLACK', minPoints: -1, color: '#1F2937' }, // -1 for special case
];

// ฟังก์ชันสำหรับหาระดับและสีปัจจุบันจากคะแนน
const getTierInfo = (points, isInvited) => {    
    if (isInvited) {
        return tiers.find(t => t.name === 'BLACK');
    }
    // หาจากล่างขึ้นบน
    for (let i = tiers.length - 2; i >= 0; i--) {
        if (points >= tiers[i].minPoints) {
            return tiers[i];
        }
    }
    return tiers[0]; // Default to SAPPHIRE
};


const MembershipScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    
    const fetchProfile = useCallback(async () => {
        // ในรอบนี้เราไม่ set loading ทันที เพื่อให้การ re-fetch ราบรื่นขึ้น
        setError(null); 
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("กรุณาเข้าสู่ระบบเพื่อดูข้อมูลสมาชิก");
            }
            setUser(user);

            const { data, error: profileError } = await supabase
                .from('profiles')
                .select('points, is_invited_member')
                .eq('id', user.id)
                .single();

            if (profileError) {
                throw profileError;
            }
            
            setProfile(data);

        } catch (err) {
            if (err.code === 'PGRST116') {
                console.warn("Profile not found for this user. Attempting to create one.");
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                
                if (currentUser) {
                    // ===== จุดที่แก้ไข: ลบ email ออกจากการ insert =====
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert({ 
                            id: currentUser.id, 
                            points: 0,
                            is_invited_member: false 
                        });
                    // =================================================

                    if (insertError) {
                        console.error("Failed to create profile:", insertError);
                        setError("เกิดข้อผิดพลาดในการสร้างโปรไฟล์ของคุณ: " + insertError.message);
                    } else {
                        console.log("Profile created successfully. Refetching...");
                        fetchProfile(); 
                        return; 
                    }
                }
            } else {
                setError(err.message);
                console.error("Error fetching profile:", err);
            }
        } 
        
        setLoading(false);
    }, []); 

    useFocusEffect(
      useCallback(() => {
        setLoading(true); // set loading เป็น true เมื่อหน้าจอถูก focus
        fetchProfile();
      }, [fetchProfile])
    );

    const tierInfo = profile ? getTierInfo(profile.points, profile.is_invited_member) : tiers[0];

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator size="large" color="#023047" style={{ marginTop: 50 }}/>;
        }

        if (error) {
            return <Text style={styles.errorText}>{error}</Text>;
        }

        if (profile) {
            return (
                <>
                    <View style={[styles.card, { backgroundColor: tierInfo.color }]}>
                        <View style={styles.tierHeader}>
                           <Text style={styles.tierLabel}>ระดับสมาชิกของคุณ</Text>
                           <Text style={styles.tierName}>{tierInfo.name}</Text>
                        </View>
                        <Text style={styles.pointsText}>
                            {profile.points.toLocaleString()} คะแนน
                        </Text>
                    </View>

                    <View style={styles.qrCard}>
                         <Text style={styles.qrTitle}>รับคะแนนสะสม</Text>
                         <Text style={styles.qrSubtitle}>แสดง QR Code นี้ให้เจ้าหน้าที่เพื่อสแกน</Text>
                         <View style={styles.qrCodeContainer}>
                            {user?.id ? (
                                <QRCode
                                    value={user.id} 
                                    size={220}
                                    backgroundColor='white'
                                    color='black'
                                />
                            ) : null}
                         </View>
                    </View>
                </>
            );
        }

        return null;
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#023047" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>บัตรสมาชิก</Text>
                <View style={styles.backButton} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {renderContent()}
            </ScrollView>
        </SafeAreaView>
    );
};

export default MembershipScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E9ECEF'},
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1d3557' },
    backButton: { padding: 5, width: 34 },
    scrollContainer: { padding: 20 },
    card: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    tierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
        paddingBottom: 12,
        marginBottom: 12,
    },
    tierLabel: {
        fontSize: 16,
        color: 'white',
    },
    tierName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    pointsText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    qrCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        
    },
    qrTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1d3557',
        marginBottom: 4,
    },
    qrSubtitle: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 20,
    },
    qrCodeContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    errorText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#EF4444',
        marginTop: 40,
    }
});