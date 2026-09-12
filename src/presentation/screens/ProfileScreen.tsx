import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { alarmSoundService } from '../../services/audio/alarmSoundService';
import { notificationService } from '../../services/notifications/notificationService';
import { permissionsService, AppPermissionsStatus } from '../../services/permissions/permissionsService';

export const ProfileScreen: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCloudSync, setIsCloudSync] = useState(false);
  const [isTestingAlarm, setIsTestingAlarm] = useState(false);
  const [permissions, setPermissions] = useState<AppPermissionsStatus | null>(null);

  const refreshPermissions = async () => {
    const status = await permissionsService.checkAllPermissions();
    setPermissions(status);
  };

  useEffect(() => {
    refreshPermissions();
  }, []);

  const handleCalibrationTest = async () => {
    if (isTestingAlarm) return;
    setIsTestingAlarm(true);

    try {
      await Promise.all([
        alarmSoundService.previewSound('alarm1', 4000),
        notificationService.sendArrivalAlarmNotification('Prueba de Sonido y Vibración', 0),
      ]);
    } catch (e) {
      console.error('Calibration error:', e);
    } finally {
      setTimeout(() => {
        setIsTestingAlarm(false);
      }, 4000);
    }
  };

  const handleRequestPermissions = async () => {
    const updated = await permissionsService.requestAllRequiredPermissions();
    setPermissions(updated);
  };

  const handleBatteryOptimization = () => {
    permissionsService.promptBatteryOptimizationExemption();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 130 }}>
      <Text style={styles.title}>Ajustes y Diagnóstico</Text>

      {/* Sección de Permisos Críticos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado de Permisos</Text>

        <View style={styles.permRow}>
          <MaterialCommunityIcons
            name={permissions?.foregroundLocation ? 'check-circle' : 'close-circle'}
            size={20}
            color={permissions?.foregroundLocation ? '#10B981' : '#EF4444'}
          />
          <Text style={styles.permText}>Ubicación al Usar la App</Text>
        </View>

        <View style={styles.permRow}>
          <MaterialCommunityIcons
            name={permissions?.backgroundLocation ? 'check-circle' : 'alert-circle'}
            size={20}
            color={permissions?.backgroundLocation ? '#10B981' : '#F59E0B'}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.permText}>Ubicación Permanente ("Siempre")</Text>
            <Text style={styles.permSubtext}>Permite despertar la alarma con la pantalla bloqueada</Text>
          </View>
        </View>

        <View style={styles.permRow}>
          <MaterialCommunityIcons
            name={permissions?.notifications ? 'check-circle' : 'close-circle'}
            size={20}
            color={permissions?.notifications ? '#10B981' : '#EF4444'}
          />
          <Text style={styles.permText}>Notificaciones de Alerta Crítica</Text>
        </View>

        <TouchableOpacity style={styles.permButton} onPress={handleRequestPermissions}>
          <MaterialCommunityIcons name="shield-account" size={18} color="#FFFFFF" />
          <Text style={styles.permButtonText}>Verificar / Solicitar Permisos</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de Diagnóstico */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnóstico en Vivo</Text>

        <TouchableOpacity
          style={[styles.actionButton, isTestingAlarm && styles.actionButtonActive]}
          onPress={handleCalibrationTest}
          disabled={isTestingAlarm}
        >
          <MaterialCommunityIcons
            name={isTestingAlarm ? 'volume-vibrate' : 'volume-high'}
            size={22}
            color={isTestingAlarm ? '#34D399' : '#10B981'}
          />
          <Text style={styles.actionText}>
            {isTestingAlarm ? 'Probando Alarma (4 seg)...' : 'Probar Alarma, Notificación y Háptica'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleBatteryOptimization}>
          <MaterialCommunityIcons name="battery-charging-high" size={22} color="#C084FC" />
          <Text style={styles.actionText}>Configurar Exención de Batería</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de Preferencias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tema Oscuro Morado</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#4A154B', true: '#10B981' }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Sincronización Cloud Supabase</Text>
          <Switch
            value={isCloudSync}
            onValueChange={setIsCloudSync}
            trackColor={{ false: '#4A154B', true: '#10B981' }}
          />
        </View>
      </View>

      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="shield-check" size={24} color="#34D399" />
        <Text style={styles.infoText}>
          Monitoreo Foreground Service activo con optimización adaptativa por 3 escalones de proximidad:
          {'\n'}• Lejos (&gt;5km): cada 45s
          {'\n'}• Medio (1-5km): cada 15s
          {'\n'}• Cerca (&lt;1km): cada 3s
        </Text>
      </View>
    </ScrollView>
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
    marginBottom: 20,
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
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  permText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  permSubtext: {
    color: '#D8B4FE',
    fontSize: 11,
    marginTop: 1,
  },
  permButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7E22CE',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  permButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  actionButtonActive: {
    opacity: 0.7,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    alignItems: 'flex-start',
    marginTop: 8,
  },
  infoText: {
    color: '#E9D5FF',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
