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
import { DistanceSlider } from './DistanceSlider';
import { TonePickerModal } from './TonePickerModal';
import { LocationMapPicker } from './LocationMapPicker';
import { COLORS } from '../theme/colors';

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
  const isDarkMode = useAlarmStore((s) => s.isDarkMode);
  const currentLocation = useAlarmStore((s) => s.currentLocation);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);

  const theme = COLORS[isDarkMode ? 'dark' : 'light'];

  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(500);
  const [selectedSound, setSelectedSound] = useState<SoundKey>('alarm1');
  const [customSoundUri, setCustomSoundUri] = useState<string | undefined>(undefined);
  const [customSoundName, setCustomSoundName] = useState<string | undefined>(undefined);
  const [selectedVibration, setSelectedVibration] = useState<VibrationPatternId>('continuous');
  const [searchResults, setSearchResults] = useState<NominatimPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NominatimPlace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTonePickerVisible, setIsTonePickerVisible] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    if (alarmToEdit) {
      setName(alarmToEdit.name);
      setRadiusMeters(alarmToEdit.radiusMeters);
      setSelectedSound(alarmToEdit.audioConfig.soundKey || 'alarm1');
      setCustomSoundUri(alarmToEdit.audioConfig.customSoundUri);
      setCustomSoundName(alarmToEdit.audioConfig.customSoundName);
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
      setCustomSoundUri(undefined);
      setCustomSoundName(undefined);
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

  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      alarmSoundService.stopAlarm();
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      if (customSoundUri) {
        alarmSoundService.previewSound(customSoundUri, 3500, true);
      } else {
        alarmSoundService.previewSound(selectedSound, 3500, false);
      }
      setTimeout(() => {
        setIsPlayingPreview(false);
      }, 3500);
    }
  };

  const handleLocationPinChange = (lat: number, lon: number) => {
    setSelectedPlace((prev) => ({
      place_id: prev?.place_id || Date.now(),
      osm_id: prev?.osm_id || 0,
      lat: lat.toFixed(6),
      lon: lon.toFixed(6),
      display_name: prev?.display_name || `Ubicación ajustada (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      name: prev?.name || 'Punto en el mapa',
    }));
  };

  const handleSave = async () => {
    if (!selectedPlace || !name.trim()) return;

    const audioConfig = {
      soundKey: selectedSound,
      customSoundUri,
      customSoundName,
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

    alarmSoundService.stopAlarm();
    onClose();
  };

  const currentSoundTitle = customSoundName
    ? customSoundName
    : AVAILABLE_SOUNDS.find((s) => s.id === selectedSound)?.name || 'Alarma Digital 1';

  const previewLat = selectedPlace
    ? parseFloat(selectedPlace.lat)
    : currentLocation?.latitude ?? -33.4489;
  const previewLon = selectedPlace
    ? parseFloat(selectedPlace.lon)
    : currentLocation?.longitude ?? -70.6693;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {alarmToEdit ? 'Editar Alarma de Parada' : 'Nueva Alarma de Parada'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={26} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Nombre de la Alarma */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Nombre de la alarma</Text>
            <TextInput
              placeholder="Ej. Estación Metro Central / Paradero 14"
              placeholderTextColor={isDarkMode ? '#A855F7' : '#9D174D'}
              value={name}
              onChangeText={setName}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
            />

            {/* Ubicación de la Alarma (anteriormente Destino en OpenStreetMap) */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Ubicación de la Alarma</Text>
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Buscar estación, paradero, dirección..."
                placeholderTextColor={isDarkMode ? '#A855F7' : '#9D174D'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[
                  styles.input,
                  {
                    flex: 1,
                    marginBottom: 0,
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                style={[styles.searchBtn, { backgroundColor: theme.primary }]}
                onPress={handleSearch}
              >
                <MaterialCommunityIcons name="magnify" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {isLoading && <ActivityIndicator color={theme.accent} style={{ marginVertical: 8 }} />}

            {/* Resultados de búsqueda */}
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
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                      selectedPlace?.place_id === item.place_id && {
                        borderColor: theme.accent,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => {
                      setSelectedPlace(item);
                      if (!name) setName(item.name || item.display_name.split(',')[0]);
                      setSearchResults([]);
                    }}
                  >
                    <Text style={[styles.placeText, { color: theme.textPrimary }]} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Ubicación seleccionada y coordenadas */}
            {selectedPlace && (
              <View style={[styles.selectedPlaceBadge, { backgroundColor: theme.surfaceElevated, borderColor: theme.accent }]}>
                <MaterialCommunityIcons name="map-marker-check" size={20} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectedPlaceText, { color: theme.textPrimary }]} numberOfLines={2}>
                    {selectedPlace.display_name}
                  </Text>
                  <Text style={[styles.coordsText, { color: theme.textSecondary }]}>
                    Lat: {parseFloat(selectedPlace.lat).toFixed(5)}, Lon: {parseFloat(selectedPlace.lon).toFixed(5)}
                  </Text>
                </View>
              </View>
            )}

            {/* Vista previa interactiva en Mapa para confirmar y ajustar el Pin */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 12 }]}>
              Vista previa y ajuste fino del Pin
            </Text>
            <LocationMapPicker
              latitude={previewLat}
              longitude={previewLon}
              radiusMeters={radiusMeters}
              onLocationChange={handleLocationPinChange}
              theme={theme}
              userLocation={currentLocation}
            />

            {/* Radio de Alerta con Slider preciso y botones rápidos */}
            <View style={styles.radiusContainer}>
              <View style={styles.radiusHeaderRow}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
                  Radio de Alerta:
                </Text>
                <View style={[styles.radiusValueBadge, { backgroundColor: theme.surfaceElevated, borderColor: theme.accent }]}>
                  <Text style={[styles.radiusValueText, { color: theme.accent }]}>
                    {radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`}
                  </Text>
                </View>
              </View>

              {/* Slider interactivo (50m a 2000m) */}
              <DistanceSlider
                value={radiusMeters}
                onValueChange={setRadiusMeters}
                accentColor={theme.accent}
                trackBgColor={theme.surfaceElevated}
                textColor={theme.textSecondary}
              />

              {/* Botones de acceso rápido */}
              <View style={styles.radiusButtons}>
                {[200, 500, 1000, 2000].map((val) => {
                  const isActive = radiusMeters === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isActive ? theme.accent : theme.chipBackground,
                          borderColor: isActive ? theme.accent : theme.border,
                        },
                      ]}
                      onPress={() => setRadiusMeters(val)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isActive ? '#064E3B' : theme.textSecondary,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {val >= 1000 ? `${val / 1000} km` : `${val} m`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tono de Alarma refinado: solo tono actual + botón escuchar + botón cambiar */}
            <View style={styles.soundSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Tono de Alarma</Text>
              <View style={[styles.soundCompactCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <View style={[styles.soundIconWrap, { backgroundColor: theme.primary }]}>
                  <MaterialCommunityIcons
                    name={customSoundUri ? 'folder-music' : 'music-note'}
                    size={22}
                    color="#FFFFFF"
                  />
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.soundTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {currentSoundTitle}
                  </Text>
                  <Text style={[styles.soundSub, { color: theme.textSecondary }]}>
                    {customSoundUri ? 'Archivo personalizado' : 'Tono predeterminado offline'}
                  </Text>
                </View>

                {/* Botón Escuchar / Preescuchar */}
                <TouchableOpacity
                  style={[
                    styles.soundActionBtn,
                    { backgroundColor: isPlayingPreview ? theme.primary : theme.accent },
                  ]}
                  onPress={handleTogglePreview}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={isPlayingPreview ? 'stop' : 'volume-high'}
                    size={20}
                    color={isPlayingPreview ? '#FFFFFF' : '#064E3B'}
                  />
                </TouchableOpacity>

                {/* Botón Cambiar Tono */}
                <TouchableOpacity
                  style={[styles.soundChangeBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setIsTonePickerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.soundChangeBtnText}>Cambiar</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Patrón de Vibración */}
            <View style={styles.radiusContainer}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Patrón de Vibración</Text>
              <View style={styles.vibrationButtons}>
                {(['continuous', 'pulse', 'sos'] as VibrationPatternId[]).map((vibId) => {
                  const isActive = selectedVibration === vibId;
                  const label =
                    vibId === 'continuous' ? 'Continuo' : vibId === 'pulse' ? 'Pulsaciones' : 'S.O.S.';
                  return (
                    <TouchableOpacity
                      key={vibId}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isActive ? theme.accent : theme.chipBackground,
                          borderColor: isActive ? theme.accent : theme.border,
                        },
                      ]}
                      onPress={() => setSelectedVibration(vibId)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isActive ? '#064E3B' : theme.textSecondary,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Botón Guardar / Activar */}
            <TouchableOpacity
              style={[
                styles.createBtn,
                { backgroundColor: theme.accent },
                (!name.trim() || !selectedPlace) && { opacity: 0.5 },
              ]}
              disabled={!name.trim() || !selectedPlace}
              onPress={handleSave}
            >
              <Text style={[styles.createBtnText, { color: '#064E3B' }]}>
                {alarmToEdit ? 'Guardar Cambios' : 'Guardar y Activar Alarma'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Modal de selección de tonos y archivos de audio */}
      <TonePickerModal
        visible={isTonePickerVisible}
        onClose={() => setIsTonePickerVisible(false)}
        selectedSoundKey={selectedSound}
        customSoundUri={customSoundUri}
        customSoundName={customSoundName}
        onSelectTone={(sndKey, uri, customName) => {
          setSelectedSound(sndKey);
          setCustomSoundUri(uri);
          setCustomSoundName(customName);
        }}
        theme={theme}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    padding: 20,
    borderTopWidth: 1,
    elevation: 20,
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
  },
  scrollArea: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  selectedPlaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginVertical: 6,
    gap: 8,
  },
  selectedPlaceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  coordsText: {
    fontSize: 11,
    marginTop: 2,
  },
  placeItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  placeText: {
    fontSize: 13,
  },
  radiusContainer: {
    marginTop: 14,
  },
  radiusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  radiusValueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  radiusValueText: {
    fontSize: 13,
    fontWeight: '800',
  },
  radiusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
  },
  soundSection: {
    marginTop: 16,
  },
  soundCompactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  soundIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  soundSub: {
    fontSize: 11,
    marginTop: 1,
  },
  soundActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  soundChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 2,
    elevation: 2,
  },
  soundChangeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  vibrationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  createBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
    elevation: 6,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
