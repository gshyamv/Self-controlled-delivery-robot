from flask import Flask, request, jsonify, send_from_directory
from gpiozero import PWMOutputDevice, OutputDevice
from time import sleep

app = Flask(__name__, static_url_path='', static_folder='static')

# --- Motor Setup ---

# Motor A - Left (GPIO pins 17, 18, and hardware PWM on 12)
IN1 = OutputDevice(17)
IN2 = OutputDevice(18)
ENA = PWMOutputDevice(12)

# Motor B - Right (GPIO pins 22, 23, and hardware PWM on 13)
IN3 = OutputDevice(22)
IN4 = OutputDevice(23)
ENB = PWMOutputDevice(13)

# --- Motor Control Functions ---

def set_speed(speed):  # speed value from 0.0 to 1.0
    ENA.value = speed
    ENB.value = speed

def right(speed=0.8):
    set_speed(speed)
    IN1.on()
    IN2.off()
    IN3.on()
    IN4.off()

def left(speed=0.8):
    set_speed(speed)
    IN1.off()
    IN2.on()
    IN3.off()
    IN4.on()

def backward(speed=0.8):
    set_speed(speed)
    IN1.off()
    IN2.on()
    IN3.on()
    IN4.off()

def forward(speed=0.8):
    set_speed(speed)
    IN1.on()
    IN2.off()
    IN3.off()
    IN4.on()

def stop_motors():
    ENA.value = 0
    ENB.value = 0
    IN1.off()
    IN2.off()
    IN3.off()
    IN4.off()

# --- Flask API Endpoints ---

@app.route('/command', methods=['POST'])
def command():
    """
    Expects JSON data with:
      - command: string (e.g., "forward", "backward", "left", "right", "stop")
      - speed: float between 0.0 and 1.0 (optional, defaults to 0.8)
    """
    data = request.get_json(force=True)
    cmd = data.get('command')
    speed = float(data.get('speed', 0.8))
    
    try:
        if cmd == 'forward':
            forward(speed)
            sleep(0.3)
            stop_motors()
        elif cmd == 'backward':
            backward(speed)
           # sleep(0.3)
           # stop_motors()
        elif cmd == 'left':
            left(speed)
            sleep(0.1)
            stop_motors()
        elif cmd == 'right':
            right(speed)
            sleep(0.1)
            stop_motors()
        elif cmd == 'stop':
            stop_motors()
        else:
            return jsonify({'status': 'error', 'message': 'Unknown command'}), 400
        
        return jsonify({'status': 'success', 'command': cmd, 'speed': speed})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/')
def index():
    """Serve the frontend interface."""
    return send_from_directory(app.static_folder, 'index.html')

# --- Main Execution ---

if __name__ == '__main__':
    # Run the Flask app on all available interfaces at port 5000.
    app.run(host='0.0.0.0', port=5000)
