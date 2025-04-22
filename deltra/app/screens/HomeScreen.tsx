// src/screens/HomeScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { HomeScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

// Sample deliveries array with order name added
const deliveries = [
  { id: '1', orderName: 'Order #001', location: '37.7749, -122.4194', eta: '15 mins' },
  { id: '2', orderName: 'Order #002', location: '34.0522, -118.2437', eta: '25 mins' },
  { id: '3', orderName: 'Order #003', location: '40.7128, -74.0060', eta: '30 mins' }
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const toggleDropdown = (): void => {
    setDropdownVisible(prev => !prev);
  };

  const handleProfileSettings = (): void => {
    setDropdownVisible(false);
    navigation.navigate('ProfileSettings');
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
    setDropdownVisible(false);
  };

  // Extract email before '@' symbol
  const userEmail = auth.currentUser?.email || '';
  const displayedEmail = userEmail.split('@')[0];

  return (
    <View style={styles.container}>
      {/* Deltra at top center */}
      <Text style={styles.brandName}>Deltra</Text>

      {/* User info at top right */}
      <View style={styles.userInfo}>
        <Text style={styles.email}>{displayedEmail}</Text>
        <Pressable onPress={toggleDropdown} style={styles.iconButton}>
          <Ionicons name="person-circle-outline" size={36} color="#0782F9" />
        </Pressable>
        {isDropdownVisible && (
          <View style={styles.dropdown}>
            <Pressable style={styles.dropdownItem} onPress={handleProfileSettings}>
              <Ionicons name="settings-outline" size={16} color="#0782F9" style={styles.dropdownIcon} />
              <Text style={styles.dropdownText}>Profile Settings</Text>
            </Pressable>
            <Pressable style={[styles.dropdownItem, styles.lastDropdownItem]} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={16} color="#0782F9" style={styles.dropdownIcon} />
              <Text style={styles.dropdownText}>Sign Out</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>Current Out for Delivery</Text>
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('DeliveryTracker', { deliveryId: item.id })}
              style={({ hovered }) => [
                styles.deliveryItem,
                hovered && { backgroundColor: '#FFD700' } // Gold on hover (web)
              ]}
            >
              {/* Order Name */}
              <Text style={styles.orderName}>{item.orderName}</Text>
              {/* Row with Location and ETA */}
              <View style={styles.detailRow}>
                <Ionicons name="location-sharp" size={20} color="#3B82F6" />
                <Text style={styles.detailText}> {item.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                <Text style={styles.detailText}> {item.eta}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: 40,
  },
  // Deltra brand at the top center
  brandName: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6F61',
    textShadowColor: '#0782F9',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // User info top right
  userInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0782F9',
    marginRight: 10,
  },
  iconButton: {
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#0782F9',
  },
  // Main content
  mainContent: {
    flex: 1,
    marginTop: 80, // space below top elements
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  deliveryItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    // Shadow/elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  detailText: {
    fontSize: 16,
    color: '#4B5563',
  },
});
