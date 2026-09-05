import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ProfileScreen: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCloudSync, setIsCloudSync] = useState(false);

  const handleCalibrationTest = () => {
    Alert.alert(
      'Calibración de Audio y Háptica',
      'El canal STREAM_ALARM está configurado para sonar a volumen máximo e ignorar el modo silencio.'
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes y Perfil</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tema Oscuro Dinámico</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#4A154B', true: '#10B981' }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Sincronización Supabase Cloud</Text>
          <Switch
            value={isCloudSync}
            onValueChange={setIsCloudSync}
            trackColor={{ false: '#4A154B', true: '#10B981' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnóstico</Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleCalibrationTest}>
          <MaterialCommunityIcons name="volume-high" size={22} color="#10B981" />
          <Text style={styles.actionText}>Probar Alarma Silencio Bypass</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="shield-check" size={24} color="#34D399" />
        <Text style={styles.infoText}>
          Monitoreo Foreground Service activo con optimización de batería por 3 escalones de proximidad.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12071F',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#1E0B36',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4A154B',
  },
  sectionTitle: {
    color: '#C084FC',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLabel: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#2D104E',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    marginTop: 20,
  },
  infoText: {
    color: '#E9D5FF',
    fontSize: 13,
    flex: 1,
  },
});
