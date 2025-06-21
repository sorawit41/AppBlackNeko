// src/screens/EventScreen.js

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { supabase } from '../supabaseClient';
import Icon from 'react-native-vector-icons/Feather';

// Helpers & Constants
const { width: screenWidth } = Dimensions.get('window');
const ALL_MONTHS_ORDER = [ "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

// --- Components ที่เกี่ยวกับ Event ---
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

const AllEventsSection = ({ onEventSelect }) => {
    const [allEvents, setAllEvents] = useState([]);
    const [activeMonth, setActiveMonth] = useState('');
    const [availableMonths, setAvailableMonths] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase.from('events').select('id, title, description, short_description, image_url, event_date').order('event_date', { ascending: false });
                if (fetchError) throw fetchError;
                const processedEvents = data.map(event => ({ id: event.id, title: event.title, date: event.event_date, month: new Date(event.event_date).toLocaleDateString('th-TH', { month: 'long' }), image: event.image_url, fullDescription: event.description, shortDescription: event.short_description || (event.description ? event.description.substring(0, 120) + '...' : '') }));
                setAllEvents(processedEvents);
                if (processedEvents.length > 0) {
                    const monthSet = new Set(processedEvents.map(e => e.month));
                    const monthsWithEvents = ALL_MONTHS_ORDER.filter(m => monthSet.has(m));
                    setAvailableMonths(monthsWithEvents);
                    setActiveMonth(monthsWithEvents[0] || '');
                }
            } catch (err) {
                console.error("Error fetching events:", err);
                setError("ไม่สามารถโหลดข้อมูลกิจกรรมได้");
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        if (!activeMonth) return [];
        return allEvents.filter(event => event.month === activeMonth);
    }, [activeMonth, allEvents]);

    const handleCardPress = (event) => onEventSelect(event);
    const handleMonthChange = (month) => {
        setActiveMonth(month);
        setModalVisible(false);
    };

    if (loading) return <ActivityIndicator size="large" color="#023047" style={{ marginVertical: 20 }} />;
    if (error) return <Text style={styles.bannerErrorText}>{error}</Text>;

    return (
        <View style={styles.eventSectionContainer}>
            <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionTitle}>เลือกดูตามเดือน</Text>
                {availableMonths.length > 0 && (
                    <TouchableOpacity style={styles.monthSelectorButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.monthSelectorText}>{activeMonth}</Text>
                        <Icon name="chevron-down" size={16} color="#023047" />
                    </TouchableOpacity>
                )}
            </View>

            <Modal transparent={true} visible={isModalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity style={styles.monthFilterModalOverlay} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
                    <View style={styles.monthFilterModalContent}>
                        <Text style={styles.modalTitle}>เลือกเดือน</Text>
                        {availableMonths.map(month => (
                            <TouchableOpacity key={month} style={styles.monthItem} onPress={() => handleMonthChange(month)}>
                                <Text style={[styles.monthItemText, activeMonth === month && styles.activeMonthText]}>{month}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {filteredEvents.length > 0 ? (
                <View style={styles.eventGrid}>
                    {filteredEvents.map(event => <EventCard key={event.id} event={event} onCardClick={handleCardPress} />)}
                </View>
            ) : (
                <View style={styles.noEventsContainer}>
                    <Icon name="calendar" size={40} color="#adb5bd" />
                    <Text style={styles.noEventsText}>ไม่มีกิจกรรมสำหรับเดือน {activeMonth}</Text>
                </View>
            )}
        </View>
    );
};

const EventScreen = ({ navigation }) => {
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#023047" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>กิจกรรมและข่าวสารทั้งหมด</Text>
                <View style={styles.backButton} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <AllEventsSection onEventSelect={handleEventSelect} />
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

export default EventScreen;

// --- Styles for EventScreen ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1d3557' },
    backButton: { padding: 5, width: 34 },
    scrollContainer: { padding: 16, paddingBottom: 40 },
    eventSectionContainer: { gap: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    bannerErrorText: { fontSize: 16, fontWeight: 'bold', color: '#721c24', textAlign: 'center', padding: 20 },
    sectionHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8 },
    monthSelectorButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: '#dee2e6' },
    monthSelectorText: { fontSize: 14, fontWeight: '600', color: '#023047' },
    eventGrid: { flexDirection: 'column', gap: 16 },
    eventCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, overflow: 'hidden' },
    eventCardImage: { width: '100%', height: screenWidth * 0.45 },
    eventCardContent: { padding: 16, gap: 8 },
    eventDateBadge: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, gap: 6 },
    eventDateText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
    eventCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1d3557', paddingRight: 100 },
    eventCardDescription: { fontSize: 13, color: '#6c757d', lineHeight: 20 },
    readMoreButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    readMoreText: { fontSize: 14, fontWeight: 'bold', color: '#023047' },
    noEventsContainer: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFFFFF', borderRadius: 16 },
    noEventsText: { textAlign: 'center', color: '#6c757d', marginTop: 16 },
    monthFilterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    monthFilterModalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '80%', maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#1d3557' },
    monthItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    monthItemText: { textAlign: 'center', fontSize: 16, color: '#333' },
    activeMonthText: { color: '#023047', fontWeight: 'bold' },
    eventModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
    eventModalContent: { width: '90%', height: '80%', backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
    eventModalImage: { width: '100%', height: '40%' },
    closeButton: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    eventModalScrollView: { flex: 1 },
    eventModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1d3557', marginBottom: 12, paddingHorizontal: 20, paddingTop: 20 },
    eventModalDescription: { fontSize: 16, color: '#495057', lineHeight: 24, paddingHorizontal: 20, paddingBottom: 20},
});