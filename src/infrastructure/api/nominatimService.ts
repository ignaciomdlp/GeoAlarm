export interface NominatimPlace {
  place_id: number;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';

export async function searchPlacesByText(query: string): Promise<NominatimPlace[]> {
  if (!query.trim() || query.length < 3) return [];

  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoAlarm-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim query failed: ${response.statusText}`);
    }

    return (await response.json()) as NominatimPlace[];
  } catch (error) {
    console.error('[NominatimService] Search error:', error);
    return [];
  }
}
