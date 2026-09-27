# ==============================================================================
# PROJECT_SPEC.md - GeoAlarm
# Especificación de Arquitectura, Dominio, Ciclo de Vida y Reglas de Contexto
# ==============================================================================

## 1. VISIÓN DEL PRODUCTO
GeoAlarm es una aplicación móvil híbrida (iOS y Android) de alta precisión diseñada 
para pasajeros de transporte público (trenes, autobuses, metro, micro). Su función 
central es garantizar que el usuario despierte o se prepare antes de llegar a su estación 
o destino mediante alertas sonoras y hápticas críticas que rompen el modo "Silencio" 
o "No Molestar" (DND), utilizando monitoreo por geolocalización adaptativo para maximizar 
la duración de la batería.

## 2. CONVENCIONES DE CÓDIGO Y ARQUITECTURA
- Clean Architecture / Feature-First:
  - domain/: Modelos, tipos y reglas matemáticas puras.
  - services/: Geolocalización, Audio STREAM_ALARM, Background Task y Háptica.
  - infrastructure/: Clientes de persistencia y API Nominatim / Supabase.
  - presentation/: Screens, UI Components, Floating BottomBar, Zustand Stores.
- TypeScript estricto sin uso de any.
- Paleta: Morados profundos (#4A154B, #6B21A8, #7E22CE) y Acentos Verde Neón (#10B981, #34D399).

## 3. REGLAS DE BACKGROUND Y BATERÍA
- Tier 1 (> 5 km): Polling cada 45-60 s (Balanced).
- Tier 2 (1 km - 5 km): Polling cada 15-20 s (High).
- Tier 3 (< 1 km): Polling cada 3-5 s (BestForNavigation).
