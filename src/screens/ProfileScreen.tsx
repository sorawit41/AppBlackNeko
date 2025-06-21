import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { supabase } from '../supabaseClient'; // << ตรวจสอบ path ให้ถูกต้อง
import Icon from 'react-native-vector-icons/Feather';
import { Session } from '@supabase/supabase-js';
import { useNavigation, useIsFocused } from '@react-navigation/native'; // <-- Import hooks จาก React Navigation

// --- Component ย่อยสำหรับสร้างรายการเมนู ---
interface ProfileMenuItemProps {
    icon: string;
    text: string;
    onPress: () => void;
    isDestructive?: boolean;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ icon, text, onPress, isDestructive = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <Icon name={icon} size={22} color={isDestructive ? '#d90429' : '#023047'} style={styles.menuIcon} />
        <Text style={[styles.menuItemText, isDestructive && styles.destructiveText]}>{text}</Text>
        <Icon name="chevron-right" size={20} color="#BDBDBD" />
    </TouchableOpacity>
);

// --- Component หลักของหน้าจอโปรไฟล์ ---
const ProfileScreen: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any>(null); // <-- State สำหรับเก็บข้อมูล profile
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation(); // <-- Hook สำหรับการนำทาง
    const isFocused = useIsFocused(); // <-- Hook สำหรับเช็คว่าหน้าจอนี้กำลังถูกแสดงผลหรือไม่

    // useEffect จะทำงานทุกครั้งที่ผู้ใช้กลับมาที่หน้านี้ (isFocused === true)
    useEffect(() => {
        if (isFocused) {
            setLoading(true);
            const fetchData = async () => {
                try {
                    // 1. ดึงข้อมูล session
                    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) throw sessionError;
                    setSession(currentSession);

                    if (currentSession) {
                        // 2. ถ้ามี session ให้ดึงข้อมูลจากตาราง profiles
                        const { data: profileData, error: profileError } = await supabase
                            .from('profiles')
                            .select('full_name, avatar_url')
                            .eq('id', currentSession.user.id)
                            .single();
                        
                        if (profileError && profileError.code !== 'PGRST116') {
                           throw profileError;
                        }
                        setProfile(profileData);
                    }
                } catch (error) {
                    if (error instanceof Error) {
                       Alert.alert("เกิดข้อผิดพลาด", error.message);
                    }
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isFocused]); // <-- dependency array มี isFocused

    const handleLogout = () => {
        Alert.alert(
            "ออกจากระบบ",
            "คุณต้องการออกจากระบบใช่หรือไม่?",
            [
                { text: "ยกเลิก", style: "cancel" },
                {
                    text: "ยืนยัน",
                    onPress: async () => {
                        await supabase.auth.signOut();
                        // หลังจาก signOut, React Navigation จะจัดการพาผู้ใช้กลับไปหน้า Login (หากตั้งค่าไว้)
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#023047" />
            </SafeAreaView>
        );
    }
    
    // --- ดึงข้อมูลมาแสดงผล ---
    const userEmail = session?.user?.email ?? 'ไม่พบอีเมล';
    // ใช้ avatar_url จาก state ของ profile ก่อน, ถ้าไม่มีให้ใช้ของ user_metadata
    const avatarUrl = profile?.avatar_url ?? session?.user?.user_metadata?.avatar_url;
    const displayName = profile?.full_name ?? userEmail;


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.profileHeader}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Icon name="user" size={40} color="#4a4e69" />
                    </View>
                )}
                <Text style={styles.emailText}>{displayName}</Text>
                {displayName !== userEmail && <Text style={styles.levelText}>{userEmail}</Text>}
            </View>

            <View style={styles.menuGroup}>
                <Text style={styles.menuGroupTitle}>บัญชี</Text>
                {/* เมื่อกดปุ่มนี้ จะนำทางไปหน้า EditProfile */}
                <ProfileMenuItem icon="edit-3" text="แก้ไขข้อมูลส่วนตัว" onPress={() => navigation.navigate('EditProfile')} />
                <ProfileMenuItem icon="shield" text="ความปลอดภัย" onPress={() => Alert.alert('Comming Soon', 'ฟังก์ชันจัดการความปลอดภัยกำลังจะมาเร็วๆ นี้')} />
            </View>

            <View style={styles.menuGroup}>
                 <Text style={styles.menuGroupTitle}>ทั่วไป</Text>
                 <ProfileMenuItem icon="bell" text="การแจ้งเตือน" onPress={() => Alert.alert('Comming Soon', 'ฟังก์ชันตั้งค่าการแจ้งเตือนกำลังจะมาเร็วๆ นี้')} />
                 <ProfileMenuItem icon="settings" text="การตั้งค่า" onPress={() => Alert.alert('Comming Soon', 'ฟังก์ชันตั้งค่าแอปกำลังจะมาเร็วๆ นี้')} />
                 <ProfileMenuItem icon="help-circle" text="ศูนย์ช่วยเหลือ" onPress={() => Alert.alert('Comming Soon', 'ฟังก์ชันศูนย์ช่วยเหลือกำลังจะมาเร็วๆ นี้')} />
            </View>

            <View style={{ flex: 1 }} />

            <View style={styles.logoutSection}>
                <ProfileMenuItem icon="log-out" text="ออกจากระบบ" onPress={handleLogout} isDestructive />
            </View>
        </SafeAreaView>
    );
};

// ... (Styles ไม่เปลี่ยนแปลง สามารถใช้ของเดิมได้)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 3,
        borderColor: '#FFFFFF'
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 3,
        borderColor: '#FFFFFF'
    },
    emailText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1d3557',
        textAlign: 'center',
    },
    levelText: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 6,
    },
    menuGroup: {
        marginTop: 24,
    },
    menuGroupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6c757d',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuIcon: {
        width: 24,
    },
    menuItemText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        color: '#333',
    },
    destructiveText: {
        color: '#d90429',
    },
    logoutSection: {
        paddingBottom: 20,
    }
});


export default ProfileScreen;