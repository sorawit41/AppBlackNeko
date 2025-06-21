import React, { useState, useEffect, FC } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList, ActivityIndicator,
  Image, TouchableOpacity, TextInput, ListRenderItem, Modal, ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import { supabase } from '../supabaseClient';
import { CastScreenProps, CastType } from '../../App';

const DetailItem: FC<{ icon: string; label: string; value?: string }> = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.detailItemContainer}>
      <Icon name={icon} size={20} color="#023047" style={styles.detailIcon} />
      <View style={{flex: 1}}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
};

const CastScreen = ({ navigation }: CastScreenProps) => {
  const [allCastsData, setAllCastsData] = useState<CastType[]>([]);
  const [filteredCast, setFilteredCast] = useState<CastType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedCast, setSelectedCast] = useState<CastType | null>(null);

  useEffect(() => {
    const fetchCasts = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase.from('casts').select('*').order('id', { ascending: true });
        if (fetchError) throw fetchError;
        setAllCastsData(data || []);
        setFilteredCast(data || []);
      } catch (err) {
        console.error("Error fetching casts:", err);
        setError("ไม่สามารถโหลดข้อมูลน้องแมวได้");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCasts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const newFilteredData = allCastsData.filter(cast => cast.name.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredCast(newFilteredData);
    } else {
      setFilteredCast(allCastsData);
    }
  }, [searchTerm, allCastsData]);

  const handleCardPress = (cast: CastType) => {
    setSelectedCast(cast);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCast(null);
  };

  const CastCard: FC<{ item: CastType; onPress: (item: CastType) => void }> = ({ item, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <Image 
        source={{ uri: item.image_url || 'https://via.placeholder.com/400x533.png?text=No+Image' }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        {item.rank && <Text style={styles.cardRank}>{item.rank}</Text>}
      </View>
    </TouchableOpacity>
  );
  
  const renderItem: ListRenderItem<CastType> = ({ item }) => (
    <CastCard item={item} onPress={handleCardPress} />
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#023047" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูลน้องแมว...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={40} color="red" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาน้องแมวจากชื่อ..."
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>
      <FlatList
        data={filteredCast}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text>ไม่พบน้องแมวที่ตรงกับ "{searchTerm}"</Text>
          </View>
        )}
      />
      {selectedCast && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedCast.image_url }} style={styles.modalImage} />
              <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                  <Icon name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <ScrollView>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalName}>{selectedCast.name}</Text>
                    <View style={styles.modalRankBadge}>
                      <Text style={styles.modalRankText}>{selectedCast.rank}</Text>
                    </View>
                  </View>
                  {selectedCast.message_to_humans && (
                    <Text style={styles.modalQuote}>"{selectedCast.message_to_humans}"</Text>
                  )}
                  <View style={styles.modalDetailsSection}>
                    <DetailItem icon="map-pin" label="สถานที่เกิด" value={selectedCast.birth_place} />
                    <DetailItem icon="award" label="ความสามารถ" value={selectedCast.strength} />
                    <DetailItem icon="coffee" label="อาหารโปรด" value={selectedCast.favorite_food} />
                    <DetailItem icon="heart" label="สิ่งที่รัก" value={selectedCast.love_thing} />
                    <DetailItem icon="smile" label="งานอดิเรก" value={selectedCast.hobby} />
                    <DetailItem icon="aperture" label="สีโปรด" value={selectedCast.favorite_color} />
                  </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333'},
  errorText: { marginTop: 10, color: 'red', fontSize: 16, textAlign: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12,
    marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 12, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, borderWidth: 1, borderColor: '#EFEFEF',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 50, fontSize: 16, color: '#000' },
  listContainer: { paddingHorizontal: 8, paddingBottom: 20 },
  card: {
    flex: 1, margin: 8, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2},
  },
  cardImage: { width: '100%', aspectRatio: 3 / 4 },
  cardContent: { padding: 12 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#1d3557' },
  cardRank: { fontSize: 12, color: '#6c757d', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    height: '85%',
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '45%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  modalName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d3557',
    flexShrink: 1,
  },
  modalRankBadge: {
    backgroundColor: '#023047',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalRankText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalQuote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#6c757d',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalDetailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  detailItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  detailIcon: {
    marginRight: 15,
    marginTop: 3,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1d3557',
    fontWeight: '500',
  },
});

// ***** จุดที่แก้ไข *****
export default CastScreen;