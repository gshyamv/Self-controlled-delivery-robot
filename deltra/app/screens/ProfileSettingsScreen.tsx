// src/screens/ProfileSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword, 
  signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { ProfileSettingsScreenProps } from '../types/navigation';

const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({ navigation }) => {
  const user = auth.currentUser;
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user is logged in.</Text>
      </View>
    );
  }

  // State for last password change
  const [lastPasswordChange, setLastPasswordChange] = useState<string | null>(null);

  // States for updating password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Fetch last password change from Firestore on mount
  useEffect(() => {
    const fetchLastPasswordChange = async () => {
      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lastPasswordChange) {
          setLastPasswordChange(data.lastPasswordChange);
        }
      }
    };
    fetchLastPasswordChange();
  }, [user]);

  // Handle Password Update
  const handleUpdatePassword = async (): Promise<void> => {
    if (newPassword.trim() === '' || passwordCurrentPassword.trim() === '' || confirmNewPassword.trim() === '') {
      Alert.alert("Error", "Please enter all required fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    setIsPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, passwordCurrentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      // Update Firestore with new timestamp
      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);
      const timestamp = new Date().toISOString();
      await setDoc(userDocRef, { lastPasswordChange: timestamp }, { merge: true });
      setLastPasswordChange(timestamp);

      Alert.alert("Success", "Password updated successfully!");
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordCurrentPassword('');
    } catch (error: any) {
      console.error("Password update error: ", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login'); // Redirect to login screen
    } catch (error) {
      Alert.alert("Error", "Failed to log out.");
    }
  };

  // Format last password change date
  const formattedLastChange = lastPasswordChange ? new Date(lastPasswordChange).toLocaleString() : "Not available";

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with Logout */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Security</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.lastPasswordChange}>Last password change: {formattedLastChange}</Text>

        {/* Change Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Enter current password"
              value={passwordCurrentPassword}
              onChangeText={setPasswordCurrentPassword}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="At least 8 characters"
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Re-enter new password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
          </View>
          
          <Text style={styles.passwordRequirements}>
            Password must contain:
            {'\n'}• At least 8 characters
            {'\n'}• One uppercase letter
            {'\n'}• One lowercase letter
            {'\n'}• One number
          </Text>
          
          <TouchableOpacity style={styles.changeButton} onPress={handleUpdatePassword} disabled={isPasswordLoading}>
            <Text style={styles.changeButtonText}>{isPasswordLoading ? "Updating..." : "Change Password"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2'
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0782F9'
  },
  logoutButton: {
    backgroundColor: '#FF4C4C',
    padding: 8,
    borderRadius: 6
  },
  lastPasswordChange: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  inputGroup: {
    marginBottom: 12
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333'
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14
  },
  passwordRequirements: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 18
  },
  changeButton: {
    backgroundColor: '#0782F9',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center'
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center'
  }
});
