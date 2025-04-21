import requests

def get_osrm_route(start_lat, start_lon, end_lat, end_lon):
    url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson&steps=true"

    try:
        response = requests.get(url)
        response.raise_for_status()  # Raises exception for HTTP errors
        data = response.json()

        if 'routes' in data and len(data['routes']) > 0:
            coords = data['routes'][0]['geometry']['coordinates']
            # OSRM returns [lon, lat] — convert to (lat, lon)
            latlon_path = [(lat, lon) for lon, lat in coords]
            return latlon_path
        else:
            print("❌ No route found in the API response.")
            return []
    except requests.exceptions.RequestException as e:
        print(f"❌ Error calling OSRM API: {e}")
        return []

# Example usage
if __name__ == "__main__":
    start_lat, start_lon = 12.9716, 77.5946   # MG Road, Bangalore
    end_lat, end_lon = 12.9352, 77.6146       # Koramangala, Bangalore

    path = get_osrm_route(start_lat, start_lon, end_lat, end_lon)
    
    if path:
        print(f"✅ Route fetched: {len(path)} points")
        print("Preview (first 10 points):")
        for pt in path[:10]:
            print(f"  {pt}")
    else:
        print("⚠️ No valid route returned.")
