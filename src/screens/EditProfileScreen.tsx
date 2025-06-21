import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    TextInput,
    ScrollView,
    Platform
} from 'react-native';
import { supabase } from '../supabaseClient';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer'; // <-- Library สำหรับแปลง Base64

const BUCKET_NAME = 'avatars';

const EditProfileScreen: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    // States for form fields
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    
    // State for new image to upload
    const [newAvatar, setNewAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);

    const navigation = useNavigation();

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setUser(authUser);
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                
                if (profileData) {
                    setFullName(profileData.full_name || '');
                    setUsername(profileData.username || '');
                    setBio(profileData.bio || '');
                    setAvatarUrl(profileData.avatar_url || null);
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    const pickImage = async () => {
        // ขออนุญาตเข้าถึงคลังภาพ
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('ขออภัย', 'แอปต้องการสิทธิ์เพื่อเข้าถึงคลังภาพของคุณ');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true, // <-- สำคัญ: ขอข้อมูลไฟล์เป็น Base64 เพื่ออัปโหลด
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            setNewAvatar(result.assets[0]); // เก็บข้อมูลรูปใหม่
            setAvatarUrl(result.assets[0].uri); // แสดง preview รูปใหม่
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        
        let newAvatarPublicUrl = avatarUrl; // เริ่มต้นด้วย URL เดิม

        try {
            // Step 1: ถ้ามีการเลือกรูปใหม่ ให้อัปโหลดก่อน
            if (newAvatar && newAvatar.base64) {
                const fileExt = newAvatar.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
                const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, decode(newAvatar.base64), {
                        contentType: `image/${fileExt}`,
                        upsert: true,
                    });
                
                if (uploadError) throw uploadError;

                const { data: publicURLData } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);

                newAvatarPublicUrl = `${publicURLData.publicUrl}?t=${new Date().getTime()}`;
            }

            // Step 2: อัปเดตข้อมูลในตาราง 'profiles'
            const updates = {
                id: user.id,
                full_name: fullName,
                username: username,
                bio: bio,
                avatar_url: newAvatarPublicUrl,
                updated_at: new Date().toISOString(),
            };

            const { error: upsertError } = await supabase.from('profiles').upsert(updates);

            if (upsertError) throw upsertError;

            Alert.alert('สำเร็จ', 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
            navigation.goBack(); // กลับไปหน้า ProfileScreen

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            Alert.alert('เกิดข้อผิดพลาด', message);
        } finally {
            setIsSaving(false);
        }
    };


    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#023047" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickImage} disabled={isSaving}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Icon name="user" size={50} color="#4a4e69" />
                            </View>
                        )}
                        <View style={styles.cameraOverlay}>
                            <Icon name="camera" size={24} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>ชื่อ-นามสกุล</Text>
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="เช่น สมชาย ใจดี"
                        autoCapitalize="words"
                    />

                    <Text style={styles.label}>ชื่อผู้ใช้ (Username)</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="เช่น somchai_jaidee"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>เกี่ยวกับฉัน (Bio)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="เล่าเรื่องราวเกี่ยวกับตัวคุณ..."
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                    onPress={handleUpdateProfile} 
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>บันทึกการเปลี่ยนแปลง</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        padding: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4a4e69',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#023047',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonDisabled: {
        backgroundColor: '#6c757d',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditProfileScreen;