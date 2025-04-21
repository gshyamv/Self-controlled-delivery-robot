import serial
import requests
import math
import time
from gpiozero import PWMOutputDevice, OutputDevice

# ——————————————————————————————————————————————
# 0) Custom NMEA Parser (GPRMC Only)
# ——————————————————————————————————————————————

def parse_gprmc(sentence):
    """
    A minimal parser for GPRMC sentences.
    
    Example sentence:
    $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A

    Returns:
        (lat, lon) in decimal degrees.
    
    Raises:
        ValueError if the sentence is not valid or data is not available.
    """
    parts = sentence.split(',')
    # Ensure the sentence type is GPRMC
    if parts[0] != "$GPRMC":
        raise ValueError("Not a GPRMC sentence")
    # Check data validity: field 2 should be 'A'
    if parts[2] != "A":
        raise ValueError("Data not valid (status != A)")

    # Extract latitude and longitude strings and their directions.
    lat_str = parts[3]
    lat_dir = parts[4]
    lon_str = parts[5]
    lon_dir = parts[6]

    # Validate expected length (latitude should be at least ddmm.mmmm)
    if len(lat_str) < 4 or len(lon_str) < 5:
        raise ValueError("Invalid lat/lon format")

    # Convert latitude from ddmm.mmmm to decimal degrees
    lat_deg = float(lat_str[:2])
    lat_min = float(lat_str[2:])
    lat = lat_deg + (lat_min / 60.0)
    if lat_dir == 'S':
        lat = -lat

    # Convert longitude from dddmm.mmmm to decimal degrees
    lon_deg = float(lon_str[:3])
    lon_min = float(lon_str[3:])
    lon = lon_deg + (lon_min / 60.0)
    if lon_dir == 'W':
        lon = -lon

    return lat, lon

# ——————————————————————————————————————————————
# 1) GPS Reading
# ——————————————————————————————————————————————

class GPS:
    def __init__(self, port='/dev/ttyUSB0', baud=9600, timeout=1):
        self.ser = serial.Serial(port, baud, timeout=timeout)

    def get_position(self):
        """
        Blocks until a valid GPRMC sentence is read and parsed.
        Returns:
            (lat, lon) as floats in decimal degrees.
        """
        while True:
            try:
                line = self.ser.readline().decode('ascii', errors='replace').strip()
            except Exception as e:
                continue
            # Only process GPRMC sentences
            if not line.startswith('$GPRMC'):
                continue
            try:
                lat, lon = parse_gprmc(line)
                return lat, lon
            except Exception:
                # Skip invalid/malformed sentences
                continue

# ——————————————————————————————————————————————
# 2) Route Fetching from OSRM
# ——————————————————————————————————————————————

def get_osrm_route(start_lat, start_lon, end_lat, end_lon):
    """
    Fetches a driving route from OSRM between the start and end points.
    Returns:
        A list of (lat, lon) tuples representing waypoints.
    """
    url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{start_lon},{start_lat};{end_lon},{end_lat}"
        "?overview=full&geometries=geojson"
    )
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()

    coords = data['routes'][0]['geometry']['coordinates']
    # OSRM returns coordinates in the form [lon, lat], so we flip them.
    latlon_path = [(lat, lon) for lon, lat in coords]
    return latlon_path

# ——————————————————————————————————————————————
# 3) Motor Interface (Using gpiozero)
# ——————————————————————————————————————————————

# Motor A - Left
IN1 = OutputDevice(17)
IN2 = OutputDevice(18)
ENA = PWMOutputDevice(12)  # hardware PWM

# Motor B - Right
IN3 = OutputDevice(22)
IN4 = OutputDevice(23)
ENB = PWMOutputDevice(13)  # hardware PWM

def set_speed(speed):
    ENA.value = speed
    ENB.value = speed

def forward(speed=0.6):
    set_speed(speed)
    IN1.on();  IN2.off()
    IN3.on();  IN4.off()

def backward(speed=0.6):
    set_speed(speed)
    IN1.off(); IN2.on()
    IN3.off(); IN4.on()

def left(speed=0.6):
    set_speed(speed)
    IN1.off(); IN2.on()
    IN3.on();  IN4.off()

def right(speed=0.6):
    set_speed(speed)
    IN1.on();  IN2.off()
    IN3.off(); IN4.on()

def stop():
    ENA.value = 0
    ENB.value = 0
    IN1.off(); IN2.off()
    IN3.off(); IN4.off()

# ——————————————————————————————————————————————
# 4) Navigation Helper Functions
# ——————————————————————————————————————————————

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculates the great-circle distance between two points on the Earth.
    Returns:
        Distance in meters.
    """
    R = 6371000  # Radius of the Earth in meters
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    Δφ = math.radians(lat2 - lat1)
    Δλ = math.radians(lon2 - lon1)
    a = math.sin(Δφ / 2)**2 + math.cos(φ1) * math.cos(φ2) * math.sin(Δλ / 2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def bearing_to(lat1, lon1, lat2, lon2):
    """
    Computes the bearing in degrees from point 1 (lat1, lon1) to point 2 (lat2, lon2).
    """
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    Δλ = math.radians(lon2 - lon1)
    x = math.sin(Δλ) * math.cos(φ2)
    y = math.cos(φ1) * math.sin(φ2) - math.sin(φ1) * math.cos(φ2) * math.cos(Δλ)
    θ = math.degrees(math.atan2(x, y))
    return (θ + 360) % 360

def get_heading():
    """
    Placeholder for actual compass/IMU heading in degrees [0..360).
    This function can be replaced with real sensor input.
    """
    # TODO: integrate real IMU/compass data
    return 0.0

# ——————————————————————————————————————————————
# 5) Main Navigation Loop: Process Waypoints
# ——————————————————————————————————————————————

def navigate(path, waypoint_tolerance=1.0):
    """
    Navigates through a list of waypoints.
    
    Args:
        path: list of (lat, lon) tuples representing waypoints.
        waypoint_tolerance: distance in meters at which a waypoint is considered 'reached'.
    """
    gps = GPS()
    for idx, (wlat, wlon) in enumerate(path):
        print(f"→ Heading to waypoint {idx+1}/{len(path)}: {wlat:.6f},{wlon:.6f}")
        while True:
            lat, lon = gps.get_position()
            dist = haversine(lat, lon, wlat, wlon)
            if dist < waypoint_tolerance:
                print(f"✔ Reached waypoint {idx+1}")
                stop()
                time.sleep(1)
                break

            # Compute steering using a simple proportional controller.
            desired_bearing = bearing_to(lat, lon, wlat, wlon)
            current_heading = get_heading()
            error = (desired_bearing - current_heading + 540) % 360 - 180
            Kp = 0.01  # proportional gain
            turn = max(-1.0, min(1.0, Kp * error))

            base_speed = 0.5
            left_speed = base_speed * (1 - turn)
            right_speed = base_speed * (1 + turn)
            left_speed = max(0.0, min(1.0, left_speed))
            right_speed = max(0.0, min(1.0, right_speed))

            # Drive the motors with calculated speeds.
            ENA.value = left_speed
            ENB.value = right_speed
            IN1.on(); IN2.off()
            IN3.on(); IN4.off()

            print(f"  dist={dist:.1f}m err={error:.1f}° speeds L={left_speed:.2f} R={right_speed:.2f}")
            time.sleep(0.2)

    print("🏁 All waypoints complete. Stopping.")
    stop()

# ——————————————————————————————————————————————
# 6) Example Usage
# ——————————————————————————————————————————————

if __name__ == "__main__":
    # Obtain the current GPS position.
    gps = GPS()
    start_lat, start_lon = gps.get_position()
    print(f"Current position: {start_lat:.6f}, {start_lon:.6f}")

    # Define your destination.
    dest_lat, dest_lon = 12.9352, 77.6146  # Change these values as needed.

    # Fetch the route from OSRM.
    path = get_osrm_route(start_lat, start_lon, dest_lat, dest_lon)
    print(f"Fetched {len(path)} waypoints.")

    # Begin navigation along the route.
    navigate(path)
