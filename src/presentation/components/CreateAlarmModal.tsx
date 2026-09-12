import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { searchPlacesByText, NominatimPlace } from '../../infrastructure/api/nominatimService';
import { useAlarmStore } from '../store/useAlarmStore';
import {
  Alarm,
  SoundKey,
  VibrationPatternId,
  AVAILABLE_SOUNDS,
  VIBRATION_PRESETS,
} from '../../domain/models/alarm';
import { alarmSoundService } from '../../services/audio/alarmSoundService';

interface CreateAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  alarmToEdit?: Alarm | null;
}

export const CreateAlarmModal: React.FC<CreateAlarmModalProps> = ({
  visible,
  onClose,
  alarmToEdit,
}) => {
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);

  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(500);
  const [selectedSound, setSelectedSound] = useState<SoundKey>('alarm1');
  const [selectedVibration, setSelectedVibration] = useState<VibrationPatternId>('continuous');
  const [searchResults, setSearchResults] = useState<NominatimPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NominatimPlace | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (alarmToEdit) {
      setName(alarmToEdit.name);
      setRadiusMeters(alarmToEdit.radiusMeters);
      setSelectedSound(alarmToEdit.audioConfig.soundKey || 'alarm1');
      setSelectedVibration(alarmToEdit.audioConfig.vibration?.id || 'continuous');
      setSelectedPlace({
        place_id: 0,
        osm_id: 0,
        lat: alarmToEdit.destination.latitude.toString(),
        lon: alarmToEdit.destination.longitude.toString(),
        display_name: alarmToEdit.destination.address || alarmToEdit.destination.name,
        name: alarmToEdit.destination.name,
      });
      setSearchQuery('');
      setSearchResults([]);
    } else {
      setName('');
      setSearchQuery('');
      setRadiusMeters(500);
      setSelectedSound('alarm1');
      setSelectedVibration('continuous');
      setSelectedPlace(null);
      setSearchResults([]);
    }
  }, [alarmToEdit, visible]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    const places = await searchPlacesByText(searchQuery);
    setSearchResults(places);
    setIsLoading(false);
  };

  const handlePreviewSound = (key: SoundKey) => {
    alarmSoundService.previewSound(key, 2500);
  };

  const handleSave = async () => {
    if (!selectedPlace || !name.trim()) return;

    const audioConfig = {
      soundKey: selectedSound,
      volume: 1.0,
      vibration: VIBRATION_PRESETS[selectedVibration] || VIBRATION_PRESETS.continuous,
    };

    if (alarmToEdit) {
      await updateAlarm(alarmToEdit.id, {
        name: name.trim(),
        destination: {
          latitude: parseFloat(selectedPlace.lat),
          longitude: parseFloat(selectedPlace.lon),
          address: selectedPlace.display_name,
          name: selectedPlace.name || name.trim(),
        },
        radiusMeters,
        audioConfig,
      });
    } else {
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
        audioConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncedWithCloud: false,
      };

      await addAlarm(newAlarm);
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {alarmToEdit ? 'Editar Alarma de Parada' : 'Nueva Alarma de Parada'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={26} color="#D8B4FE" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Nombre de la alarma</Text>
            <TextInput
              placeholder="Ej. Estación Metro Central / Paradero 14"
              placeholderTextColor="#A855F7"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <Text style={styles.sectionLabel}>Destino en OpenStreetMap</Text>
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Buscar estación, paradero, dirección..."
                placeholderTextColor="#A855F7"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <MaterialCommunityIcons name="magnify" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {isLoading && <ActivityIndicator color="#10B981" style={{ marginVertical: 8 }} />}

            {selectedPlace && (
              <View style={styles.selectedPlaceBadge}>
                <MaterialCommunityIcons name="map-marker-check" size={20} color="#10B981" />
                <Text style={styles.selectedPlaceText} numberOfLines={2}>
                  {selectedPlace.display_name}
                </Text>
              </View>
            )}

            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.place_id.toString()}
                scrollEnabled={false}
                style={{ marginVertical: 6 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.placeItem,
                      selectedPlace?.place_id === item.place_id && styles.placeItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedPlace(item);
                      if (!name) setName(item.name || item.display_name.split(',')[0]);
                      setSearchResults([]);
                    }}
                  >
                    <Text style={styles.placeText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <View style={styles.radiusContainer}>
              <Text style={styles.sectionLabel}>Radio de Alerta: {radiusMeters} metros</Text>
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

            <View style={styles.radiusContainer}>
              <Text style={styles.sectionLabel}>Tono de Alarma (MP3 Offline)</Text>
              <View style={styles.soundOptionsRow}>
                {AVAILABLE_SOUNDS.slice(0, 2).map((snd) => (
                  <View key={snd.id} style={styles.soundCardWrapper}>
                    <TouchableOpacity
                      style={[styles.soundCard, selectedSound === snd.id && styles.soundCardActive]}
                      onPress={() => setSelectedSound(snd.id)}
                    >
                      <MaterialCommunityIcons
                        name={selectedSound === snd.id ? 'check-circle' : 'music-note'}
                        size={18}
                        color={selectedSound === snd.id ? '#10B981' : '#C084FC'}
                      />
                      <Text
                        style={[styles.soundCardText, selectedSound === snd.id && styles.soundCardTextActive]}
                      >
                        {snd.name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.previewBtn}
                      onPress={() => handlePreviewSound(snd.id)}
                    >
                      <MaterialCommunityIcons name="volume-high" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.radiusContainer}>
              <Text style={styles.sectionLabel}>Patrón de Vibración</Text>
              <View style={styles.radiusButtons}>
                {(['continuous', 'pulse', 'sos'] as VibrationPatternId[]).map((vId) => (
                  <TouchableOpacity
                    key={vId}
                    style={[styles.chip, selectedVibration === vId && styles.chipActive]}
                    onPress={() => setSelectedVibration(vId)}
                  >
                    <Text style={[styles.chipText, selectedVibration === vId && styles.chipTextActive]}>
                      {VIBRATION_PRESETS[vId].name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createBtn, (!name.trim() || !selectedPlace) && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={!name.trim() || !selectedPlace}
            >
              <Text style={styles.createBtnText}>
                {alarmToEdit ? 'Guardar Cambios' : 'Guardar y Activar Alarma'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '90%',
  },
  scrollArea: {
    marginBottom: 10,
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
  sectionLabel: {
    color: '#D8B4FE',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#2D104E',
    color: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4A154B',
    fontSize: 14,
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
  selectedPlaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2D104E',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    marginVertical: 6,
  },
  selectedPlaceText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
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
    marginVertical: 8,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 9,
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
  soundOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  soundCardWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  soundCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#2D104E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A154B',
  },
  soundCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#35165E',
  },
  soundCardText: {
    color: '#C084FC',
    fontWeight: '700',
    fontSize: 11,
  },
  soundCardTextActive: {
    color: '#FFFFFF',
  },
  previewBtn: {
    backgroundColor: '#7E22CE',
    padding: 9,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtn: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
