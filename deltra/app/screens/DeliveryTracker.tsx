// src/screens/DeliveryTracker.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import Svg, { Path, Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { DeliveryTrackerProps } from '../types/navigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<'in_transit' | 'arrived' | 'completed'>('in_transit');
  const [eta, setEta] = useState(25);
  const [otp, setOtp] = useState('');
  const [showOtpButton, setShowOtpButton] = useState(false);

  const waypoints = [
    { name: 'Depot', lat: 40.7128, lng: -74.0060 },
    { name: 'Main Street', lat: 40.7138, lng: -74.0050 },
    { name: 'Park Avenue', lat: 40.7148, lng: -74.0040 },
    { name: 'Broadway', lat: 40.7158, lng: -74.0030 },
    { name: 'Destination', lat: 40.7168, lng: -74.0020 }
  ];

  const routePoints = waypoints.map((_, index) => ({
    x: 50 + index * 120,
    y: 100 + Math.sin(index * 1.5) * 30
  }));

  useEffect(() => {
    if (status === 'in_transit') {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < waypoints.length - 1) {
            return prev + 1;
          }
          clearInterval(interval);
          setShowOtpButton(true); // Show OTP button when reaching destination
          return prev;
        });
        setEta((prev) => {
          const newEta = prev - 5;
          if (newEta <= 0) {
            setStatus('arrived');
            clearInterval(interval);
            setShowOtpButton(true);
            return 0;
          }
          return newEta;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const generateOTP = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(newOtp);
    setStatus('completed');
    setShowOtpButton(false);
  };

  const getCurrentPosition = () => {
    if (currentStep === waypoints.length - 1) {
      return routePoints[currentStep];
    }
    const start = routePoints[currentStep];
    const end = routePoints[currentStep + 1];
    const progress = 0.5; // fixed for simplicity
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress
    };
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Top row: Title + Logout */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Deltra</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Track your delivery in real time</Text>

        {/* Map / Route display */}
        <View style={styles.mapContainer}>
          <Svg width="100%" height="200" viewBox="0 0 600 200">
            {/* Full route */}
            <Path
              d={routePoints
                .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
                .join(' ')}
              stroke="#E5E7EB"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
            />
            {/* Completed portion */}
            <Path
              d={routePoints
                .slice(0, currentStep + 1)
                .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
                .join(' ')}
              stroke="#3B82F6"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
            />
            {/* Waypoints and labels */}
            {routePoints.map((point, index) => (
              <G key={index}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill={index <= currentStep ? '#3B82F6' : '#E5E7EB'}
                />
                <SvgText
                  x={point.x}
                  y={point.y + 25}
                  fill="#4B5563"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {waypoints[index].name}
                </SvgText>
              </G>
            ))}
            {/* Current position marker */}
            {(() => {
              const pos = getCurrentPosition();
              return (
                <G transform={`translate(${pos.x - 12}, ${pos.y - 12})`}>
                  <Rect width="24" height="24" fill="#2563EB" rx="4" />
                  <Ionicons
                    name="car-outline"
                    size={24}
                    color="#fff"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                  />
                </G>
              );
            })()}
          </Svg>
        </View>

        {/* Delivery Details */}
        <View style={styles.detailsContainer}>
          {/* Current Location - Clickable */}
          <TouchableOpacity style={styles.detailItem} onPress={() => {}}>
            <View style={styles.detailRow}>
              <Ionicons name="location-sharp" size={20} color="#3B82F6" />
              <Text style={styles.detailLabel}>Current Location:</Text>
            </View>
            <Text style={styles.detailValue}>
              {waypoints[currentStep].lat.toFixed(4)}, {waypoints[currentStep].lng.toFixed(4)}
            </Text>
          </TouchableOpacity>

          {/* Estimated Time - Clickable */}
          <TouchableOpacity style={styles.detailItem} onPress={() => {}}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
              <Text style={styles.detailLabel}>Estimated Time:</Text>
            </View>
            <Text style={styles.detailValue}>{eta} minutes</Text>
          </TouchableOpacity>

          {/* Next Stop - if not at last waypoint */}
          {currentStep < waypoints.length - 1 && (
            <TouchableOpacity style={styles.detailItem} onPress={() => {}}>
              <View style={styles.detailRow}>
                <Ionicons name="arrow-forward-outline" size={20} color="#3B82F6" />
                <Text style={styles.detailLabel}>Next Stop:</Text>
              </View>
              <Text style={styles.detailValue}>{waypoints[currentStep + 1].name}</Text>
            </TouchableOpacity>
          )}

          {/* Boxed container for OTP Button */}
          {showOtpButton && (
            <View style={styles.buttonBox}>
              <TouchableOpacity style={styles.otpButton} onPress={generateOTP}>
                <Ionicons name="key-outline" size={20} color="#fff" />
                <Text style={styles.otpButtonText}>Generate Delivery OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Display */}
          {otp ? (
            <View style={styles.otpDisplay}>
              <Text style={styles.otpTitle}>Your Delivery OTP</Text>
              <Text style={styles.otpValue}>{otp.split('').join(' ')}</Text>
              <Text style={styles.otpNote}>
                Please share this OTP with the delivery bot to complete the delivery
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default DeliveryTracker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    // Center the card
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Card that occupies half the screen width & height
  card: {
    width: screenWidth * 0.5,   // half the screen width
    height: screenHeight * 0.8, // 80% of screen height to fit all
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0782F9',
  },
  logoutButton: {
    backgroundColor: '#FF4C4C',
    padding: 8,
    borderRadius: 6,
  },
  subtitle: {
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  detailsContainer: {
    width: '100%',
    // No scroll needed; the card is tall enough
  },
  detailItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
    color: '#333',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  buttonBox: {
    maxWidth: 300,
    alignSelf: 'center',
    marginTop: 10,
  },
  otpButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  otpDisplay: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: 5,
  },
  otpValue: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#1E40AF',
    marginBottom: 5,
  },
  otpNote: {
    fontSize: 14,
    color: '#1E3A8A',
    textAlign: 'center',
  },
});
