# 📍 PlaceO'Clock (GeoAlarm)

Aplicación móvil de alta precisión diseñada para pasajeros de transporte público (trenes, autobuses, metro, micro). Su propósito es despertar o alertar al usuario antes de llegar a su destino mediante alertas sonoras locales y hápticas que funcionan **100% offline**, con la **pantalla bloqueada**, e integrando un **mapa interactivo OpenStreetMap**.

---

## ⚠️ ¿Por qué aparece `[runtime not ready]` en Expo Go?

Si al escanear el QR en **Expo Go** recibes el mensaje `[runtime not ready]`, se debe a lo siguiente:

1. **Módulos Nativos y Foreground Service:** PlaceO'Clock utiliza servicios nativos en segundo plano (`Foreground Service`, `Background Location`, `expo-task-manager`, `expo-audio` y `expo-notifications` con canales de máxima prioridad).
2. **Proyecto Precompilado (`expo prebuild`):** La app cuenta con la carpeta nativa `/android` con permisos especiales (`FOREGROUND_SERVICE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `SYSTEM_ALERT_WINDOW`, `MODIFY_AUDIO_SETTINGS`).
3. **Restricción de Expo Go:** La app estándar de Expo Go descargada de Play Store/App Store es un contenedor genérico que **no incluye** los binarios nativos ni los permisos de segundo plano de este proyecto.

> **Solución:** Esta aplicación debe ejecutarse mediante una **Development Build** (compilación nativa de desarrollo) o instalando el APK generado localmente.

---

## 🚀 Requisitos Previos

Para compilar y probar la aplicación en Android necesitarás:

1. **Node.js:** Versión 18 o superior.
2. **Java Development Kit (JDK):** Versión 17 (recomendada por React Native 0.76+ / 0.86+).
3. **Android Studio:**
   - Android SDK instalado (API 34 o 35).
   - Android SDK Platform-Tools configurado en tu `PATH` (comando `adb`).
   - Variable de entorno `ANDROID_HOME` configurada (ej. `C:\Users\<TuUsuario>\AppData\Local\Android\Sdk`).
4. **Dispositivo Físico o Emulador:**
   - **Dispositivo Físico (Recomendado):** Conectado por cable USB con la **Depuración por USB** activada en Opciones de Desarrollador.
   - **Emulador:** Un Virtual Device (AVD) de Android Studio iniciado.

---

## 🛠️ Cómo Compilar y Correr la Aplicación

### Método 1: Compilación Automática con Expo CLI (Recomendado)

Conecta tu teléfono móvil por USB o inicia tu emulador de Android Studio, y ejecuta en la terminal de la raíz del proyecto:

```powershell
# 1. Iniciar la compilación y ejecución directa en tu dispositivo
npx expo run:android
```

Este comando:
* Compilará el código nativo de `/android` usando Gradle.
* Instalará la aplicación de desarrollo en tu teléfono con el paquete `com.placeoclock.geoalarm`.
* Abrirá la aplicación e iniciará el Metro Bundler automáticamente.

---

### Método 2: Generar el APK de Desarrollo Manualmente con Gradle

Si prefieres compilar el APK directamente e instalarlo en cualquier teléfono:

```powershell
# 1. Navegar a la carpeta nativa de Android
cd android

# 2. Compilar el APK en modo Debug
.\gradlew assembleDebug

# 3. El APK resultante quedará en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

Para instalarlo en tu teléfono conectado por USB:
```powershell
adb install app/build/outputs/apk/debug/app-debug.apk
```

Luego, para vincularlo al servidor de código en vivo:
```powershell
cd ..
npx expo start --dev-client
```

---

## 🧪 Guía Paso a Paso para Probar el Sistema

### 1. Verificación Inicial de Permisos y Diagnóstico de Audio
1. Abre la aplicación en tu teléfono.
2. Ve a la pestaña **Ajustes** (ícono de engranaje en la barra inferior).
3. En la sección **Estado de Permisos**, pulsa **"Verificar / Solicitar Permisos"**:
   * Otorga acceso a la ubicación.
   * Selecciona **"Permitir todo el tiempo"** para que el GPS funcione con la pantalla apagada.
   * Otorga permiso de **Notificaciones**.
4. Pulsa **"Probar Alarma, Notificación y Háptica"**:
   * Sonará el tono `alarma 1.mp3` a volumen alto.
   * Se activará la vibración háptica.
   * Recibirás la notificación de máxima prioridad sobre la pantalla.

---

### 2. Creación y Preescucha de Alarma
1. Ve a la pestaña **Mis Alarmas** y pulsa el botón flotante verde **(+)**.
2. Escribe un nombre (ej. `Estación Central` o `Casa`).
3. En el buscador de OpenStreetMap, escribe una dirección o punto de interés y pulsa la lupa. Selecciona el resultado de la lista.
4. Selecciona el **Radio de Alerta** (ej. `500 m` o `1 km`).
5. En la sección **Tono de Alarma (MP3 Offline)**:
   * Pulsa el ícono de volumen junto a **Alarma Digital 1** o **Alarma Intensa 2** para preescuchar el tono.
6. Elige el patrón de vibración (**Continuo**, **Pulsaciones** o **S.O.S.**).
7. Pulsa **"Guardar y Activar Alarma"**.
8. Verás tu alarma activa en la lista y el badge **"GPS Activo"** en la cabecera.

---

### 3. Exploración del Mapa Interactivo (OpenStreetMap)
1. Pulsa la pestaña central **Mapa**.
2. Observarás el mapa interactivo con estilo *Carto Dark Matter*:
   * **Punto verde neón pulsante:** Tu ubicación actual obtenida por GPS.
   * **Círculos morados con borde verde:** Las geocercas que configuraste con su radio en metros.
3. Pulsa el botón flotante de la mira para recentrar el mapa en tu posición actual.

---

### 4. Simulación de Llegada y Geocerca (Prueba de Campo / Emulador)

Para comprobar cómo salta la alarma al llegar a destino:

#### En Emulador Android Studio:
1. En la ventana del emulador, abre el panel lateral de opciones (**...** tres puntos) y ve a **Location**.
2. Ingresa unas coordenadas lejanas a tu destino (a más de 6 km). Verás en la app que el badge marca `Tier: FAR` (polling cada 45 s para ahorrar batería).
3. Modifica las coordenadas para acercarte a entre 1 y 5 km. El badge cambiará a `Tier: MEDIUM` (polling cada 15 s).
4. Establece las coordenadas exactamente dentro del radio de tu destino:
   * La pantalla cambiará a **¡LLEGASTE A TU DESTINO!** ([ActiveAlarmScreen.tsx](file:///d:/Users/endoe/PlaceO'Clock/src/presentation/screens/ActiveAlarmScreen.tsx)).
   * Empezará a sonar el tono MP3 local en bucle y la vibración continua.
   * Desliza el control **"Desliza para apagar »»"** hacia la derecha para detener el sonido y cancelar el rastreo GPS.

#### En Dispositivo Físico:
* Puedes crear una alarma con un radio de `200 m` en una parada previa de tu trayecto habitual en micro o metro, bloquear la pantalla y guardar el teléfono en tu bolsillo. La alarma despertará la pantalla al entrar en el radio.

---

## 🏛️ Arquitectura del Proyecto

El código sigue los principios de **Clean Architecture / Feature-First**:

```text
PlaceO'Clock/
├── assets/
│   └── sounds/                     # Audios locales (alarma 1.mp3, alarma 2.mp3)
├── src/
│   ├── domain/                     # Reglas de negocio puras y modelos TypeScript
│   │   ├── models/                 # Alarm, Location, User
│   │   └── types/                  # Tipos de navegación
│   ├── infrastructure/             # APIs externas y persistencia
│   │   ├── api/                    # Nominatim (OpenStreetMap Search)
│   │   └── storage/                # Configuración de almacenamiento
│   ├── services/                   # Servicios del sistema y hardware
│   │   ├── audio/                  # AlarmSoundService (reproducción offline y doNotMix)
│   │   ├── location/               # BackgroundLocationTask, Haversine, Filtro GPS adaptativo
│   │   ├── notifications/          # NotificationService (canales de alta prioridad Android)
│   │   └── permissions/            # PermissionsService (Ubicación siempre, batería)
│   └── presentation/               # Capa visual e interactiva
│       ├── components/             # CreateAlarmModal, SlideToDismiss
│       ├── navigation/             # BottomTabNavigator
│       ├── screens/                # AlarmsListScreen, MapScreen, ProfileScreen, ActiveAlarmScreen
│       ├── store/                  # useAlarmStore (Zustand con persistencia AsyncStorage)
│       └── theme/                  # Paleta morada oscura (#12071F) y verde neón (#10B981)
```

---

## 🔧 Comandos Útiles

| Comando | Descripción |
| :--- | :--- |
| `npx expo run:android` | Compila y ejecuta la versión nativa en Android |
| `npx expo start -c` | Inicia el Metro Bundler limpiando la caché |
| `npx tsc --noEmit` | Chequea que no existan errores de tipos en TypeScript |
| `cd android && .\gradlew clean` | Limpia la caché de compilación nativa de Gradle |
