import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alarmSoundService } from '../../services/audio/alarmSoundService';
import { notificationService } from '../../services/notifications/notificationService';
import { permissionsService, AppPermissionsStatus } from '../../services/permissions/permissionsService';
import { useAlarmStore } from '../store/useAlarmStore';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { COLORS } from '../theme/colors';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useAlarmStore((s) => s.isDarkMode);
  const toggleDarkMode = useAlarmStore((s) => s.toggleDarkMode);

  const theme = COLORS[isDarkMode ? 'dark' : 'light'];

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

  const bottomBarPadding = Math.max(insets.bottom, 10);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 120 + bottomBarPadding }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>Ajustes y Diagnóstico</Text>

      {/* Sección de Permisos Críticos */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? theme.textSecondary : theme.primaryDark }]}>
          Estado de Permisos
        </Text>

        <View style={styles.permRow}>
          <MaterialCommunityIcons
            name={permissions?.foregroundLocation ? 'check-circle' : 'close-circle'}
            size={22}
            color={permissions?.foregroundLocation ? (isDarkMode ? theme.accent : theme.accentDark) : theme.danger}
          />
          <Text style={[styles.permText, { color: theme.textPrimary }]}>Ubicación al Usar la App</Text>
        </View>

        <View style={styles.permRow}>
          <MaterialCommunityIcons
            name={permissions?.backgroundLocation ? 'check-circle' : 'alert-circle'}
            size={22}
            color={permissions?.backgroundLocation ? (isDarkMode ? theme.accent : theme.accentDark) : '#F59E0B'}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.permText, { color: theme.textPrimary }]}>
              Ubicación Permanente ("Siempre")
            </Text>
            <Text style={[styles.permSubtext, { color: theme.textSecondary }]}>
              Permite despertar la alarma con la pantalla bloqueada
            </Text>
          </View>
        </View>

        <View style={styles.permRow}>
          <MaterialCommunityIcons
            name={permissions?.notifications ? 'check-circle' : 'close-circle'}
            size={22}
            color={permissions?.notifications ? (isDarkMode ? theme.accent : theme.accentDark) : theme.danger}
          />
          <Text style={[styles.permText, { color: theme.textPrimary }]}>Notificaciones de Alerta Crítica</Text>
        </View>

        <TouchableOpacity
          style={[styles.permButton, { backgroundColor: isDarkMode ? theme.primary : theme.primaryDark }]}
          onPress={handleRequestPermissions}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="shield-account" size={18} color="#FFFFFF" />
          <Text style={styles.permButtonText}>Verificar / Solicitar Permisos</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de Diagnóstico */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? theme.textSecondary : theme.primaryDark }]}>
          Diagnóstico en Vivo
        </Text>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            isTestingAlarm && { borderColor: theme.accent, borderWidth: 1.5 },
          ]}
          onPress={handleCalibrationTest}
          disabled={isTestingAlarm}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name={isTestingAlarm ? 'volume-vibrate' : 'volume-high'}
            size={22}
            color={isDarkMode ? theme.accent : theme.accentDark}
          />
          <Text style={[styles.actionText, { color: theme.textPrimary }]}>
            {isTestingAlarm ? 'Probando Alarma (4 seg)...' : 'Probar Alarma, Notificación y Háptica'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          onPress={handleBatteryOptimization}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="battery-charging-high"
            size={22}
            color={isDarkMode ? '#C084FC' : theme.primary}
          />
          <Text style={[styles.actionText, { color: theme.textPrimary }]}>
            Configurar Exención de Batería
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sección de Preferencias con el Switch Animado Sol/Luna */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? theme.textSecondary : theme.primaryDark }]}>
          Preferencias
        </Text>

        {/* Alternador Modo Claro / Modo Oscuro con Switch personalizado */}
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              Modo Claro / Modo Oscuro
            </Text>
            <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>
              {isDarkMode ? 'Tema Oscuro Morado activo' : 'Tema Rosa y Verde Pastel activo'}
            </Text>
          </View>
          <ThemeSwitch isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
        </View>

        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', paddingTop: 12, marginTop: 12 }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Sincronización Cloud Supabase</Text>
            <Text style={[styles.rowSubLabel, { color: theme.textSecondary }]}>
              {isCloudSync ? 'Conectado a la nube' : 'Modo local sin conexión'}
            </Text>
          </View>
          <Switch
            value={isCloudSync}
            onValueChange={setIsCloudSync}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={isCloudSync ? (isDarkMode ? '#FFFFFF' : '#064E3B') : '#F4F3F4'}
          />
        </View>
      </View>

      {/* Caja de Información de Arquitectura */}
      <View style={[styles.infoBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <MaterialCommunityIcons
          name="shield-check"
          size={24}
          color={isDarkMode ? theme.accent : theme.accentDark}
        />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
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
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
  },
  section: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  permText: {
    fontSize: 14,
    fontWeight: '700',
  },
  permSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  permButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 6,
    gap: 8,
    elevation: 3,
  },
  permButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
  },
  actionButtonActive: {
    opacity: 0.8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
});
