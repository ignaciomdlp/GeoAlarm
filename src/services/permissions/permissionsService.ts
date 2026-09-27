import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform, Linking, Alert } from 'react-native';

export interface AppPermissionsStatus {
  foregroundLocation: boolean;
  backgroundLocation: boolean;
  notifications: boolean;
  canTrackInBackground: boolean;
}

class PermissionsService {
  public async checkAllPermissions(): Promise<AppPermissionsStatus> {
    const fg = await Location.getForegroundPermissionsAsync();
    const bg = await Location.getBackgroundPermissionsAsync();
    const notif = await Notifications.getPermissionsAsync();

    const foregroundGranted = fg.status === 'granted';
    const backgroundGranted = bg.status === 'granted';
    const notifGranted = notif.status === 'granted';

    return {
      foregroundLocation: foregroundGranted,
      backgroundLocation: backgroundGranted,
      notifications: notifGranted,
      canTrackInBackground: foregroundGranted && backgroundGranted,
    };
  }

  public async requestAllRequiredPermissions(): Promise<AppPermissionsStatus> {
    // 1. Foreground Location
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      Alert.alert(
        'Permiso de Ubicación Necesario',
        'GeoAlarm necesita tu ubicación para calcular la distancia a tu parada de destino.'
      );
      return this.checkAllPermissions();
    }

    // 2. Background Location ("Permitir todo el tiempo")
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
      Alert.alert(
        'Ubicación en Segundo Plano',
        'Para que la alarma suene con la pantalla apagada o mientras usas otras apps, debes seleccionar "Permitir todo el tiempo" en los ajustes de ubicación.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
        ]
      );
    }

    // 3. Notifications (Android 13+ y iOS)
    await Notifications.requestPermissionsAsync();

    return this.checkAllPermissions();
  }

  public openSystemSettings(): void {
    Linking.openSettings();
  }

  public async promptBatteryOptimizationExemption(): Promise<void> {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Optimización de Batería',
        'Para evitar que Android suspenda el rastreo en trayectos largos mientras duermes, configura GeoAlarm como "Sin restricciones" en el uso de batería.',
        [
          { text: 'Más tarde', style: 'cancel' },
          { text: 'Ir a Ajustes', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }
}

export const permissionsService = new PermissionsService();
