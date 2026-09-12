import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlarmStore } from '../store/useAlarmStore';

export const MapScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const alarms = useAlarmStore((s) => s.alarms);
  const currentLocation = useAlarmStore((s) => s.currentLocation);
  const activeAlarms = alarms.filter((a) => a.isActive);

  // Generar HTML con Leaflet y Dark Matter Carto Tiles
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
            background: #12071F;
          }
          .user-marker {
            width: 16px;
            height: 16px;
            background: #10B981;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 14px #10B981;
          }
          .leaflet-popup-content-wrapper {
            background: #1E0B36;
            color: #FFFFFF;
            border: 1px solid #7E22CE;
            border-radius: 12px;
          }
          .leaflet-popup-tip {
            background: #1E0B36;
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
            zoomControl: false
          });

          // Capa CartoDB Dark Matter (OpenStreetMap Tiles optimizadas para modo oscuro)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; OpenStreetMap &copy; CARTO'
          }).addTo(map);

          var userIcon = L.divIcon({
            className: 'user-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
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
                color: '#10B981',
                fillColor: '#7E22CE',
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
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loaderText}>Cargando mapa OpenStreetMap...</Text>
          </View>
        )}
      />

      <View style={styles.overlayHeader}>
        <Text style={styles.headerTitle}>Mapa de Geocercas</Text>
        <Text style={styles.headerSubtitle}>
          {activeAlarms.length === 0
            ? 'Sin alarmas activas'
            : `${activeAlarms.length} ${activeAlarms.length === 1 ? 'geocerca activa' : 'geocercas activas'}`}
        </Text>
      </View>

      <TouchableOpacity style={styles.recenterButton} activeOpacity={0.85} onPress={handleRecenter}>
        <MaterialCommunityIcons name="crosshairs-gps" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12071F',
  },
  map: {
    flex: 1,
    backgroundColor: '#12071F',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#12071F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#C084FC',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  overlayHeader: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30, 11, 54, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4A154B',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  recenterButton: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7E22CE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
    elevation: 8,
  },
});

