import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';

interface LocationMapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onLocationChange: (lat: number, lon: number) => void;
  theme: ThemeColors;
  userLocation?: { latitude: number; longitude: number } | null;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  latitude,
  longitude,
  radiusMeters,
  onLocationChange,
  theme,
  userLocation,
}) => {
  const webViewRef = useRef<WebView>(null);
  const cartoApiKey = process.env.EXPO_PUBLIC_CARTO_API_KEY;

  // Si hay CARTO API KEY se usa Dark Matter, si no, se usa OpenStreetMap estándar sin marcas de agua
  const tileUrl = cartoApiKey
    ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${cartoApiKey}`
    : `https://tile.openstreetmap.org/{z}/{x}/{y}.png`;

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            margin: 0; padding: 0; width: 100%; height: 100%;
            background: #12071F; overflow: hidden;
          }
          ${!cartoApiKey ? `
          .leaflet-tile {
            filter: brightness(0.7) invert(0.9) contrast(2.5) hue-rotate(200deg) saturate(0.4);
          }
          ` : ''}
          .custom-pin {
            width: 28px;
            height: 28px;
            background: #7E22CE;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid #10B981;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .custom-pin::after {
            content: '';
            width: 10px;
            height: 10px;
            background: #FFFFFF;
            border-radius: 50%;
            position: absolute;
          }
          .hint-box {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 11, 54, 0.85);
            color: #FFFFFF;
            font-size: 11px;
            font-family: sans-serif;
            padding: 4px 10px;
            border-radius: 12px;
            border: 1px solid #7E22CE;
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="hint-box">Toca o arrastra el Pin para ajustar la ubicación</div>
        <script>
          var lat = ${latitude};
          var lon = ${longitude};
          var radius = ${radiusMeters};

          var map = L.map('map', {
            center: [lat, lon],
            zoom: 15,
            zoomControl: false,
            attributionControl: false
          });

          L.tileLayer('${tileUrl}', {
            maxZoom: 19
          }).addTo(map);

          var pinIcon = L.divIcon({
            className: 'custom-pin-wrap',
            html: '<div class="custom-pin"></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 28]
          });

          var marker = L.marker([lat, lon], {
            draggable: true,
            icon: pinIcon
          }).addTo(map);

          var circle = L.circle([lat, lon], {
            color: '#10B981',
            fillColor: '#7E22CE',
            fillOpacity: 0.35,
            radius: radius,
            weight: 2
          }).addTo(map);

          function notifyChange(newLat, newLon) {
            marker.setLatLng([newLat, newLon]);
            circle.setLatLng([newLat, newLon]);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PIN_MOVED',
                lat: newLat,
                lon: newLon
              }));
            }
          }

          marker.on('dragend', function(e) {
            var pos = marker.getLatLng();
            notifyChange(pos.lat, pos.lng);
          });

          map.on('click', function(e) {
            notifyChange(e.latlng.lat, e.latlng.lng);
          });

          window.addEventListener('message', function(event) {
            try {
              var data = JSON.parse(event.data);
              if (data.type === 'UPDATE_COORDS') {
                marker.setLatLng([data.lat, data.lon]);
                circle.setLatLng([data.lat, data.lon]);
                map.setView([data.lat, data.lon], 15);
              } else if (data.type === 'UPDATE_RADIUS') {
                circle.setRadius(data.radius);
              }
            } catch(e) {}
          });
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'UPDATE_COORDS',
          lat: latitude,
          lon: longitude,
        })
      );
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'UPDATE_RADIUS',
          radius: radiusMeters,
        })
      );
    }
  }, [radiusMeters]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PIN_MOVED') {
        onLocationChange(data.lat, data.lon);
      }
    } catch (e) {
      console.warn('Error reading map message:', e);
    }
  };

  const handleRecenterToUser = () => {
    if (userLocation) {
      onLocationChange(userLocation.latitude, userLocation.longitude);
    }
  };

  return (
    <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={handleMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.loader, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="small" color={theme.accent} />
          </View>
        )}
      />

      {userLocation && (
        <TouchableOpacity
          style={[styles.userLocBtn, { backgroundColor: theme.primary, borderColor: theme.accent }]}
          onPress={handleRecenterToUser}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#FFFFFF" />
          <Text style={styles.userLocText}>Mi Posición</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 190,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    marginVertical: 10,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  userLocText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
