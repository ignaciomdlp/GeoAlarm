import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { AVAILABLE_SOUNDS, SoundKey } from '../../domain/models/alarm';
import { alarmSoundService } from '../../services/audio/alarmSoundService';
import { ThemeColors } from '../theme/colors';

interface TonePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSoundKey: SoundKey;
  customSoundUri?: string;
  customSoundName?: string;
  onSelectTone: (soundKey: SoundKey, customUri?: string, customName?: string) => void;
  theme: ThemeColors;
}

export const TonePickerModal: React.FC<TonePickerModalProps> = ({
  visible,
  onClose,
  selectedSoundKey,
  customSoundUri,
  customSoundName,
  onSelectTone,
  theme,
}) => {
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const handlePreview = (soundKeyOrUri: string, isCustom: boolean) => {
    if (playingKey === soundKeyOrUri) {
      alarmSoundService.stopAlarm();
      setPlayingKey(null);
      return;
    }

    setPlayingKey(soundKeyOrUri);
    alarmSoundService.previewSound(soundKeyOrUri, 3500, isCustom);
    setTimeout(() => {
      setPlayingKey((curr) => (curr === soundKeyOrUri ? null : curr));
    }, 3500);
  };

  const handlePickCustomFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const uri = file.uri;
        const name = file.name || 'Audio Personalizado';

        onSelectTone(selectedSoundKey, uri, name);
        handlePreview(uri, true);
        onClose();
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'No se pudo seleccionar el archivo de audio.');
    }
  };

  const handleClose = () => {
    alarmSoundService.stopAlarm();
    setPlayingKey(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="music-box-multiple" size={24} color={theme.accent} />
              <Text style={[styles.title, { color: theme.textPrimary }]}>Tonos de Alarma</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Botón para elegir archivo de audio del teléfono */}
            <TouchableOpacity
              style={[styles.customAudioBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              onPress={handlePickCustomFile}
              activeOpacity={0.8}
            >
              <View style={[styles.customIconWrap, { backgroundColor: theme.accent }]}>
                <MaterialCommunityIcons name="folder-music" size={24} color="#1E0B36" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.customBtnTitle, { color: theme.textPrimary }]}>
                  Elegir de mis archivos
                </Text>
                <Text style={[styles.customBtnSub, { color: theme.textSecondary }]}>
                  Selecciona cualquier archivo MP3, WAV o AAC
                </Text>
              </View>
              <MaterialCommunityIcons name="plus-circle" size={22} color={theme.accent} />
            </TouchableOpacity>

            {/* Si ya hay un archivo personalizado elegido */}
            {customSoundUri && (
              <View style={[styles.itemCard, styles.selectedItem, { borderColor: theme.accent, backgroundColor: theme.surfaceElevated }]}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  onPress={() => onSelectTone(selectedSoundKey, customSoundUri, customSoundName)}
                >
                  <MaterialCommunityIcons name="check-circle" size={22} color={theme.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {customSoundName || 'Audio Personalizado'}
                    </Text>
                    <Text style={[styles.itemSub, { color: theme.accent }]}>Archivo local seleccionado</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.previewBtn, { backgroundColor: playingKey === customSoundUri ? theme.primary : theme.accent }]}
                  onPress={() => handlePreview(customSoundUri, true)}
                >
                  <MaterialCommunityIcons
                    name={playingKey === customSoundUri ? 'stop' : 'volume-high'}
                    size={18}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ padding: 6, marginLeft: 4 }}
                  onPress={() => onSelectTone('alarm1', undefined, undefined)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.danger} />
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Tonos offline incluidos
            </Text>

            {/* Listado de tonos offline predeterminados */}
            {AVAILABLE_SOUNDS.map((snd) => {
              const isSelected = !customSoundUri && selectedSoundKey === snd.id;
              const isPlaying = playingKey === snd.id;

              return (
                <View
                  key={snd.id}
                  style={[
                    styles.itemCard,
                    { backgroundColor: theme.surfaceElevated, borderColor: isSelected ? theme.accent : theme.border },
                    isSelected && styles.selectedItem,
                  ]}
                >
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                    onPress={() => {
                      onSelectTone(snd.id, undefined, undefined);
                      handlePreview(snd.id, false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'check-circle' : 'music-note-outline'}
                      size={22}
                      color={isSelected ? theme.accent : theme.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: theme.textPrimary }]}>{snd.name}</Text>
                      <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{snd.description}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.previewBtn, { backgroundColor: isPlaying ? theme.primary : theme.accent }]}
                    onPress={() => handlePreview(snd.id, false)}
                  >
                    <MaterialCommunityIcons
                      name={isPlaying ? 'stop' : 'volume-high'}
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 24,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    maxHeight: 450,
  },
  customAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 16,
    gap: 12,
  },
  customIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  customBtnSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  selectedItem: {
    borderWidth: 2,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  previewBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});
