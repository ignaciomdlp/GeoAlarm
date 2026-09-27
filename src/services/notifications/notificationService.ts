import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const ALARM_NOTIFICATION_CHANNEL_ID = 'geoalarm_critical_alarm_channel';

// Configurar cómo se comportan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

class NotificationService {
  private isInitialized = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ALARM_NOTIFICATION_CHANNEL_ID, {
        name: 'Alertas Críticas de Llegada',
        description: 'Canal de máxima prioridad para despertar al pasajero al llegar a su parada',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500, 250, 1000],
        lightColor: '#10B981',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
      });
    }

    this.isInitialized = true;
  }

  public async sendArrivalAlarmNotification(alarmName: string, distanceMeters: number): Promise<string> {
    await this.initialize();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 ¡LLEGASTE A TU DESTINO!',
        body: `Estás a ${distanceMeters}m de: ${alarmName}. Abre para apagar la alarma.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#7E22CE',
        categoryIdentifier: 'ALARM',
        data: {
          alarmName,
          distanceMeters,
          action: 'DISMISS_ALARM',
        },
      },
      trigger: null, // Envío inmediato
    });

    return notificationId;
  }

  public async dismissArrivalNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (e) {
      console.error('[NotificationService] Error dismissing notifications:', e);
    }
  }
}

export const notificationService = new NotificationService();
