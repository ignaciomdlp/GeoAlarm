import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlarmStore } from '../store/useAlarmStore';
import { COLORS } from '../theme/colors';

export const MapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const alarms = useAlarmStore((s) => s.alarms);
  const currentLocation = useAlarmStore((s) => s.currentLocation);
  const isDarkMode = useAlarmStore((s) => s.isDarkMode);
  const activeAlarms = alarms.filter((a) => a.isActive);

  const theme = COLORS[isDarkMode ? 'dark' : 'light'];
  const cartoApiKey = process.env.EXPO_PUBLIC_CARTO_API_KEY || '';

  const bottomBarPadding = Math.max(insets.bottom, 10);
  const barHeight = 64 + bottomBarPadding;

  // Generar HTML con soporte para CARTO con API Key o fallback a OpenStreetMap sin marca de agua
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: ${theme.background};
          }
          ${
            !cartoApiKey && isDarkMode
              ? `
          .leaflet-tile {
            filter: brightness(0.65) invert(0.9) contrast(2.5) hue-rotate(200deg) saturate(0.35);
          }
          `
              : ''
          }
          .user-marker {
            width: 18px;
            height: 18px;
            background: #10B981;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 14px #10B981;
          }
          .leaflet-popup-content-wrapper {
            background: ${theme.surface};
            color: ${theme.textPrimary};
            border: 1px solid ${theme.border};
            border-radius: 12px;
          }
          .leaflet-popup-tip {
            background: ${theme.surface};
          }
          .leaflet-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var defaultLat = ${currentLocation?.latitude ?? -33.4489};
          var defaultLon = ${currentLocation?.longitude ?? -70.6693};
          
          var map = L.map('map', {
            center: [defaultLat, defaultLon],
            zoom: 14,
            zoomControl: false,
            attributionControl: false
          });

          var cartoKey = '${cartoApiKey}';
          var tileUrl = cartoKey
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=' + cartoKey
            : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

          L.tileLayer(tileUrl, {
            maxZoom: 19,
            subdomains: 'abcd'
          }).addTo(map);

          var userIcon = L.divIcon({
            className: 'user-marker',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          var userMarker = null;
          var geofenceLayers = [];

          function updateUserLocation(lat, lon) {
            if (userMarker) {
              userMarker.setLatLng([lat, lon]);
            } else {
              userMarker = L.marker([lat, lon], { icon: userIcon }).addTo(map);
            }
          }

          if (${currentLocation ? 'true' : 'false'}) {
            updateUserLocation(defaultLat, defaultLon);
          }

          function renderGeofences(items) {
            geofenceLayers.forEach(function(l) { map.removeLayer(l); });
            geofenceLayers = [];

            items.forEach(function(alarm) {
              var circle = L.circle([alarm.destination.latitude, alarm.destination.longitude], {
                color: '${theme.accent}',
                fillColor: '${theme.primary}',
                fillOpacity: 0.35,
                radius: alarm.radiusMeters,
                weight: 2
              }).addTo(map);

              var marker = L.marker([alarm.destination.latitude, alarm.destination.longitude])
                .addTo(map)
                .bindPopup('<b>' + alarm.name + '</b><br>Radio: ' + alarm.radiusMeters + 'm');

              geofenceLayers.push(circle);
              geofenceLayers.push(marker);
            });
          }

          renderGeofences(${JSON.stringify(activeAlarms)});

          window.addEventListener('message', function(event) {
            try {
              var data = JSON.parse(event.data);
              if (data.type === 'UPDATE_LOCATION') {
                updateUserLocation(data.latitude, data.longitude);
                if (data.recenter) {
                  map.setView([data.latitude, data.longitude], 15);
                }
              } else if (data.type === 'UPDATE_GEOFENCES') {
                renderGeofences(data.alarms);
              }
            } catch (e) {}
          });
        </script>
      </body>
    </html>
  `;

  // Sincronizar ubicación y geocercas cuando cambian
  useEffect(() => {
    if (webViewRef.current && currentLocation) {
      const msg = JSON.stringify({
        type: 'UPDATE_LOCATION',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        recenter: false,
      });
      webViewRef.current.postMessage(msg);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (webViewRef.current) {
      const msg = JSON.stringify({
        type: 'UPDATE_GEOFENCES',
        alarms: activeAlarms,
      });
      webViewRef.current.postMessage(msg);
    }
  }, [activeAlarms]);

  const handleRecenter = () => {
    if (webViewRef.current && currentLocation) {
      const msg = JSON.stringify({
        type: 'UPDATE_LOCATION',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        recenter: true,
      });
      webViewRef.current.postMessage(msg);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={[styles.map, { backgroundColor: theme.background }]}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loaderText, { color: theme.textSecondary }]}>Cargando mapa...</Text>
          </View>
        )}
      />

      {/* Cabecera descriptiva: Mapa de GeoAlarmas */}
      <View
        style={[
          styles.overlayHeader,
          {
            backgroundColor: isDarkMode ? 'rgba(30, 11, 54, 0.9)' : 'rgba(255, 204, 233, 0.95)',
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Mapa de GeoAlarmas</Text>
        <Text
          style={[
            styles.headerSubtitle,
            { color: isDarkMode ? theme.accentLight : theme.primaryDark },
          ]}
        >
          {activeAlarms.length === 0
            ? 'Sin alarmas activas'
            : `${activeAlarms.length} ${activeAlarms.length === 1 ? 'geoalarma activa' : 'geoalarmas activas'}`}
        </Text>
      </View>

      {/* Botón para centrar mapa en ubicación actual (debajo del botón + de crear alarma) */}
      <TouchableOpacity
        style={[
          styles.recenterButton,
          {
            bottom: barHeight + 12,
            backgroundColor: isDarkMode ? theme.primary : theme.surfaceElevated,
            borderColor: theme.accent,
          },
        ]}
        activeOpacity={0.85}
        onPress={handleRecenter}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={26}
          color={isDarkMode ? '#FFFFFF' : theme.primary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  overlayHeader: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  recenterButton: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 998,
  },
});
