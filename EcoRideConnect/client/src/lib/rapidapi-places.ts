// RapidAPI Places service for location search and autocomplete
export class RapidAPIPlacesService {
  private apiKey = '2ba8df3163msh2946cf9f6f42632p18bb19jsn37d35fac71f1';
  private baseUrl = 'https://rapidapi.com';

  private async makeRequest(endpoint: string, params: Record<string, string>) {
    const url = new URL(endpoint, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Search for places near a location
  async nearbySearch(params: {
    location: string; // latitude,longitude
    radius?: string; // radius in meters (default: 1500)
    type?: string; // place type (restaurant, gas_station, etc.)
    keyword?: string; // search keyword
  }) {
    return this.makeRequest('/places/nearby-search', {
      location: params.location,
      radius: params.radius || '1500',
      ...(params.type && { type: params.type }),
      ...(params.keyword && { keyword: params.keyword }),
    });
  }

  // Text-based search for places
  async textSearch(params: {
    query: string; // search query
    location?: string; // latitude,longitude for bias
    radius?: string; // search radius in meters
  }) {
    return this.makeRequest('/places/text-search', {
      query: params.query,
      ...(params.location && { location: params.location }),
      ...(params.radius && { radius: params.radius }),
    });
  }

  // Get detailed information about a place
  async placeDetails(placeId: string) {
    return this.makeRequest('/places/place-details', {
      place_id: placeId,
    });
  }

  // Autocomplete for place predictions
  async autocomplete(params: {
    input: string; // user input
    location?: string; // latitude,longitude for bias
    radius?: string; // bias radius in meters
    types?: string; // restrict to specific types
  }) {
    return this.makeRequest('/places/autocomplete', {
      input: params.input,
      ...(params.location && { location: params.location }),
      ...(params.radius && { radius: params.radius }),
      ...(params.types && { types: params.types }),
    });
  }

  // Get photo for a place
  async placePhoto(params: {
    photoreference: string;
    maxwidth?: string;
    maxheight?: string;
  }) {
    return this.makeRequest('/places/place-photo', {
      photoreference: params.photoreference,
      maxwidth: params.maxwidth || '400',
      ...(params.maxheight && { maxheight: params.maxheight }),
    });
  }

  // Utility method to find eco-friendly places (charging stations, bike rentals, etc.)
  async findEcoFriendlyPlaces(location: string, radius: string = '5000') {
    const ecoTypes = [
      'electric_vehicle_charging_station',
      'bicycle_store', 
      'subway_station',
      'bus_station',
      'train_station',
    ];

    const promises = ecoTypes.map(type => 
      this.nearbySearch({ location, radius, type }).catch(() => ({ results: [] }))
    );

    const results = await Promise.all(promises);
    return results.flatMap(result => result.results || []);
  }
}

// Export singleton instance
export const rapidAPIPlaces = new RapidAPIPlacesService();