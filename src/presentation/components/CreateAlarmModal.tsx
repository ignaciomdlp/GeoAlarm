import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { searchPlacesByText, NominatimPlace } from '../../infrastructure/api/nominatimService';
import { useAlarmStore } from '../store/useAlarmStore';
import { Alarm, VIBRATION_PRESETS } from '../../domain/models/alarm';

interface CreateAlarmModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateAlarmModal: React.FC<CreateAlarmModalProps> = ({ visible, onClose }) => {
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(500);
  const [searchResults, setSearchResults] = useState<NominatimPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NominatimPlace | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    const places = await searchPlacesByText(searchQuery);
    setSearchResults(places);
    setIsLoading(false);
  };

  const handleCreate = () => {
    if (!selectedPlace || !name.trim()) return;

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      name: name.trim(),
      destination: {
        latitude: parseFloat(selectedPlace.lat),
        longitude: parseFloat(selectedPlace.lon),
        address: selectedPlace.display_name,
        name: selectedPlace.name || name.trim(),
      },
      radiusMeters,
      isActive: true,
      audioConfig: {
        soundKey: 'siren',
        volume: 1.0,
        vibration: VIBRATION_PRESETS.continuous,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedWithCloud: false,
    };

    addAlarm(newAlarm);
    setName('');
    setSearchQuery('');
    setSelectedPlace(null);
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Nueva Alarma de Parada</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={26} color="#D8B4FE" />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Nombre (ej. Estación Metro Central)"
            placeholderTextColor="#A855F7"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <View style={styles.searchRow}>
            <TextInput
              placeholder="Buscar dirección en OpenStreetMap..."
              placeholderTextColor="#A855F7"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <MaterialCommunityIcons name="magnify" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {isLoading && <ActivityIndicator color="#10B981" style={{ marginVertical: 10 }} />}

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id.toString()}
            style={{ maxHeight: 120, marginVertical: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.placeItem,
                  selectedPlace?.place_id === item.place_id && styles.placeItemSelected,
                ]}
                onPress={() => setSelectedPlace(item)}
              >
                <Text style={styles.placeText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.radiusContainer}>
            <Text style={styles.label}>Radio de Alerta: {radiusMeters} metros</Text>
            <View style={styles.radiusButtons}>
              {[200, 500, 1000, 2000].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.chip, radiusMeters === val && styles.chipActive]}
                  onPress={() => setRadiusMeters(val)}
                >
                  <Text style={[styles.chipText, radiusMeters === val && styles.chipTextActive]}>
                    {val >= 1000 ? `${val / 1000} km` : `${val} m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createBtn, (!name.trim() || !selectedPlace) && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={!name.trim() || !selectedPlace}
          >
            <Text style={styles.createBtnText}>Guardar y Activar Alarma</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 7, 31, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1E0B36',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#7E22CE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#34D399',
  },
  input: {
    backgroundColor: '#2D104E',
    color: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4A154B',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  searchBtn: {
    backgroundColor: '#7E22CE',
    borderRadius: 14,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeItem: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#2D104E',
    marginBottom: 6,
  },
  placeItemSelected: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  placeText: {
    color: '#E9D5FF',
    fontSize: 13,
  },
  radiusContainer: {
    marginVertical: 12,
  },
  label: {
    color: '#D8B4FE',
    fontWeight: '700',
    marginBottom: 8,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#2D104E',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A154B',
  },
  chipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    color: '#C084FC',
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  createBtn: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
