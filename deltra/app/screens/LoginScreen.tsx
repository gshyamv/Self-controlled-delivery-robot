// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  AuthError
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { LoginScreenProps } from '../types/navigation';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async (): Promise<void> => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in with:', response.user.email);
      navigation.replace('Home');
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      Alert.alert('Login Failed', authError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (): Promise<void> => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registered with:', response.user.email);
      Alert.alert('Success', 'Account created successfully!');
      // Optionally navigate to Home or remain on this screen
    } catch (error) {
      const authError = error as AuthError;
      console.error('Registration error:', authError);
      Alert.alert('Registration Failed', authError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* The centered box with a max width */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>Deltra</Text>
        <Text style={styles.subtitle}>Welcome back! Please log in or register.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.button, styles.buttonPrimary]}
            disabled={isLoading}
          >
            <Text style={styles.buttonPrimaryText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignUp}
            style={[styles.button, styles.buttonOutline]}
            disabled={isLoading}
          >
            <Text style={styles.buttonOutlineText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    // Center everything vertically and horizontally
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  // The "box" that holds the form
  formContainer: {
    width: '100%',
    maxWidth: 400,         // <-- This limits the width on large screens
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',  // Center text/title inside the box
    // Optional shadow/elevation for a "card" look:
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0782F9',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonPrimary: {
    backgroundColor: '#0782F9',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderColor: '#0782F9',
    borderWidth: 2,
  },
  buttonOutlineText: {
    color: '#0782F9',
    fontWeight: '600',
    fontSize: 16,
  },
});
