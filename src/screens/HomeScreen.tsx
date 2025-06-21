// src/screens/HomeScreen.js

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import Icon from 'react-native-vector-icons/Feather';
import Carousel from 'react-native-reanimated-carousel';

// Helpers & Constants
const { width: screenWidth } = Dimensions.get('window');
const SMALL_SCREEN_WIDTH = 375;

const responsiveValue = (smallValue, largeValue) => {
  return screenWidth <= SMALL_SCREEN_WIDTH ? smallValue : largeValue;
};

// Sub-components
const HeroBanner = () => {
    const [slidesData, setSlidesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBannerImages = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase.from('hero_banners').select('id, image_url, alt_text, link_url').order('sort_order', { ascending: true });
                if (fetchError) throw fetchError;
                const formattedSlides = data.map(banner => ({ id: banner.id, src: banner.image_url, alt: banner.alt_text, link: banner.link_url }));
                setSlidesData(formattedSlides);
            } catch (err) {
                console.error("Error fetching banner images:", err);
                setError("ไม่สามารถโหลดข้อมูล Banner ได้");
            } finally {
                setLoading(false);
            }
        };
        fetchBannerImages();
    }, []);

    const renderSlide = ({ item }) => {
        const handlePress = () => item.link && Linking.openURL(item.link).catch(err => console.error('Failed to open URL:', err));
        return (
            <TouchableOpacity onPress={handlePress} disabled={!item.link} activeOpacity={0.8}>
                <Image source={{ uri: item.src }} style={styles.bannerImage} resizeMode="cover" />
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={[styles.bannerContainer, styles.bannerCenterContent]}><ActivityIndicator size="large" color="#023047" /></View>;
    if (error) return <View style={[styles.bannerContainer, styles.bannerCenterContent, { backgroundColor: '#f8d7da' }]}><Text style={styles.bannerErrorText}>{error}</Text></View>;
    if (!slidesData.length) return <View style={[styles.bannerContainer, styles.bannerCenterContent, { backgroundColor: '#e9ecef' }]}><Text>ไม่มี Banner ในขณะนี้</Text></View>;

    return (
        <View style={styles.carouselWrapper}>
            <Carousel loop width={screenWidth - responsiveValue(16, 24) * 2} height={screenWidth * 0.5} autoPlay={true} autoPlayInterval={5000} data={slidesData} scrollAnimationDuration={1000} renderItem={renderSlide} />
        </View>
    );
};

const ActionItem = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress} disabled={!onPress}>
        <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
            <Icon name={icon} size={responsiveValue(22, 26)} color="#FFFFFF" />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
);

const EventCard = ({ event, onCardClick }) => (
    <TouchableOpacity style={styles.eventCard} onPress={() => onCardClick(event)} activeOpacity={0.8}>
        <Image source={{ uri: event.image }} style={styles.eventCardImage} />
        <View style={styles.eventCardContent}>
            <View style={styles.eventDateBadge}>
                <Icon name="calendar" size={12} color="#FFFFFF" />
                <Text style={styles.eventDateText}>{new Date(event.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
            </View>
            <Text style={styles.eventCardTitle} numberOfLines={2}>{event.title}</Text>
            <Text style={styles.eventCardDescription} numberOfLines={3}>{event.shortDescription}</Text>
            <View style={styles.readMoreButton}>
                <Text style={styles.readMoreText}>อ่านเพิ่มเติม</Text>
                <Icon name="arrow-right" size={16} color="#023047" />
            </View>
        </View>
    </TouchableOpacity>
);

// Component สำหรับแสดงกิจกรรมล่าสุด
const LatestEventSection = ({ onEventSelect }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLatestEvents = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase.from('events').select('id, title, description, short_description, image_url, event_date').order('event_date', { ascending: false });
                if (fetchError) throw fetchError;
                
                const latestEvents = data.slice(0, 4);
                
                const processedEvents = latestEvents.map(event => ({ id: event.id, title: event.title, date: event.event_date, image: event.image_url, fullDescription: event.description, shortDescription: event.short_description || (event.description ? event.description.substring(0, 120) + '...' : '') }));
                
                setEvents(processedEvents);
            } catch (err) {
                console.error("Error fetching latest events:", err);
                setError("ไม่สามารถโหลดข้อมูลกิจกรรมได้");
            } finally {
                setLoading(false);
            }
        };
        fetchLatestEvents();
    }, []);

    if (loading) return <ActivityIndicator size="large" color="#023047" style={{ marginVertical: 20 }} />;
    if (error) return <Text style={styles.bannerErrorText}>{error}</Text>;

    return (
        <View style={styles.actionsContainer}>
            <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionTitle}>กิจกรรมล่าสุด</Text>
            </View>
            
            {events.length > 0 ? (
                <View style={styles.eventGrid}>
                    {events.map(event => <EventCard key={event.id} event={event} onCardClick={onEventSelect} />)}
                </View>
            ) : (
                <View style={styles.noEventsContainer}>
                    <Icon name="calendar" size={40} color="#adb5bd" />
                    <Text style={styles.noEventsText}>ยังไม่มีกิจกรรมล่าสุด</Text>
                </View>
            )}
        </View>
    );
};


// Main Component
const HomeScreen = ({ navigation }) => {
    const [session, setSession] = useState(null);
    const [isEventModalVisible, setEventModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleEventSelect = (event) => {
        setSelectedEvent(event);
        setEventModalVisible(true);
    };

    const handleCloseModal = () => {
        setEventModalVisible(false);
        setSelectedEvent(null);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);

    const handleProfilePress = () => {
        session?.user ? navigation.navigate('Profile') : navigation.navigate('Login');
    };
    
    const handleTrackOrderPress = () => {
        session?.user ? navigation.navigate('OrderTracking') : navigation.navigate('Login');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greetingText}>สวัสดี,</Text>
                        <Text style={styles.userName}>{session?.user?.email ? session.user.email.split('@')[0] : 'Guest'}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarButton} onPress={handleProfilePress}>
                        {session?.user?.user_metadata?.avatar_url ? (
                            <Image source={{ uri: session.user.user_metadata.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}><Icon name="user" size={responsiveValue(22, 24)} color="#4a4e69" /></View>
                        )}
                    </TouchableOpacity>
                </View>

                <HeroBanner />

                <View style={styles.actionsContainer}>
                    <Text style={styles.sectionTitle}>เมนูด่วน</Text>
                    <View style={styles.actionsGrid}>
                        <ActionItem 
                            icon="gitlab"
                            label="น้องแมว" 
                            color="#FFB703"
                            onPress={() => navigation.navigate('Cast')}
                        />
                        <ActionItem 
                            icon="package"
                            label="ติดตามสินค้า" 
                            color="#023047" 
                            onPress={handleTrackOrderPress}
                        />
                        <ActionItem 
                            icon="calendar"
                            label="กิจกรรม"
                            color="#219EBC" 
                            onPress={() => navigation.navigate('Event')}
                        />
                        <ActionItem 
                            icon="award"
                            label="สมาชิก"
                            color="#FB8500" 
                            onPress={() => navigation.navigate('Membership')}
                        />
                    </View>
                </View>
                
                <LatestEventSection onEventSelect={handleEventSelect} />
            </ScrollView>

            {selectedEvent && (
                <Modal animationType="slide" transparent={true} visible={isEventModalVisible} onRequestClose={handleCloseModal}>
                    <View style={styles.eventModalOverlay}>
                        <View style={styles.eventModalContent}>
                            <Image source={{ uri: selectedEvent.image }} style={styles.eventModalImage} />
                            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                                <Icon name="x" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <ScrollView contentContainerStyle={styles.eventModalScrollView}>
                                <Text style={styles.eventModalTitle}>{selectedEvent.title}</Text>
                                <Text style={styles.eventModalDescription}>{selectedEvent.fullDescription}</Text>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
};

export default HomeScreen;

// StyleSheet
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
    scrollContainer: { paddingVertical: 20, paddingHorizontal: responsiveValue(16, 24), gap: responsiveValue(20, 28), paddingBottom: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greetingText: { fontSize: responsiveValue(15, 16), color: '#6c757d' },
    userName: { fontSize: responsiveValue(26, 30), fontWeight: 'bold', color: '#1d3557' },
    avatarButton: { width: responsiveValue(50, 56), height: responsiveValue(50, 56), borderRadius: responsiveValue(25, 28), backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%', borderRadius: responsiveValue(25, 28) },
    avatarPlaceholder: { width: '100%', height: '100%', borderRadius: responsiveValue(25, 28), backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center' },
    carouselWrapper: { borderRadius: 16, overflow: 'hidden', alignItems: 'center' },
    bannerContainer: { width: '100%', height: screenWidth * 0.5, borderRadius: 16 },
    bannerCenterContent: { justifyContent: 'center', alignItems: 'center' },
    bannerImage: { width: '100%', height: '100%' },
    bannerErrorText: { fontSize: 16, fontWeight: 'bold', color: '#721c24', textAlign: 'center', padding: 20 },
    actionsContainer: { gap: 16 },
    sectionTitle: { fontSize: responsiveValue(18, 20), fontWeight: 'bold', color: '#333' },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: responsiveValue(16, 20) },
    actionItem: { alignItems: 'center', width: '22%', gap: 8 },
    actionIconContainer: { width: responsiveValue(60, 64), height: responsiveValue(60, 64), borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    actionLabel: { fontSize: responsiveValue(12, 13), color: '#495057', textAlign: 'center' },
    sectionHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    eventGrid: { flexDirection: 'column', gap: responsiveValue(16, 24) },
    eventCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, overflow: 'hidden' },
    eventCardImage: { width: '100%', height: screenWidth * 0.45 },
    eventCardContent: { padding: 16, gap: 8 },
    eventDateBadge: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, gap: 6 },
    eventDateText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
    eventCardTitle: { fontSize: responsiveValue(16, 18), fontWeight: 'bold', color: '#1d3557', paddingRight: 100 },
    eventCardDescription: { fontSize: responsiveValue(13, 14), color: '#6c757d', lineHeight: 20 },
    readMoreButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    readMoreText: { fontSize: 14, fontWeight: 'bold', color: '#023047' },
    noEventsContainer: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#f8f9fa', borderRadius: 16, borderWidth: 1, borderColor: '#e9ecef' },
    noEventsText: { textAlign: 'center', color: '#6c757d', marginTop: 16 },
    eventModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
    eventModalContent: { width: '90%', height: '80%', backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
    eventModalImage: { width: '100%', height: '40%' },
    closeButton: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    eventModalScrollView: { flex: 1 },
    eventModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1d3557', marginBottom: 12, paddingHorizontal: 20, paddingTop: 20 },
    eventModalDescription: { fontSize: 16, color: '#495057', lineHeight: 24, paddingHorizontal: 20, paddingBottom: 20},
});