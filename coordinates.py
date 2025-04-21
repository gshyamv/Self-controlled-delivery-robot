import serial
import pynmea2

# Replace '/dev/ttyUSB0' with the port name that your GPS device is using.
# Baud rate may vary; 9600 is common, but some GPS devices use higher rates like 115200.
ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=1)

while True:
    # Read a line of data from the serial port
    data = ser.readline().decode('ascii', errors='replace').strip()

    # We are looking for lines that start with typical NMEA prefixes like $GPGGA, $GPRMC, or $GNGGA, etc.
    if data.startswith('$G'):
        try:
            msg = pynmea2.parse(data)

            # Depending on the sentence type, you might have different attributes
            # GGA and RMC sentences typically contain lat/long
            if hasattr(msg, 'latitude') and hasattr(msg, 'longitude'):
                print(f"Latitude: {msg.latitude}, Longitude: {msg.longitude}")
        except pynmea2.ParseError:
            # If we fail to parse a line, we just skip it
            continue
