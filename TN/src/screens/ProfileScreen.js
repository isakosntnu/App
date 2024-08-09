import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { ref as dbRef, set, get, child } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, database, storage } from '../config/firebaseconfig';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const snapshot = await get(child(dbRef(database), `users/${auth.currentUser.uid}/profileImageUrl`));
        if (snapshot.exists()) {
          const url = snapshot.val();
          setProfileImage(url);
        } else {
          console.log("No profile picture found.");
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    fetchProfileImage();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Auth');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      await uploadImage(uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create a reference to the Firebase Storage
      const imageRef = storageRef(storage, `profilePictures/${auth.currentUser.uid}`);
      await uploadBytes(imageRef, blob);

      // Get the download URL
      const url = await getDownloadURL(imageRef);

      // Save the download URL to the Realtime Database
      await set(dbRef(database, `users/${auth.currentUser.uid}/profileImageUrl`), url);

      setProfileImage(url);
    } catch (error) {
      console.error("Error uploading image:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {profileImage ? (
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
      ) : (
        <Text>No profile picture available</Text>
      )}
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Text style={styles.imagePickerText}>Pick a Profile Picture</Text>
      </TouchableOpacity>
      <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
      <Button title="Logout" onPress={handleLogout} color="#e74c3c" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  imagePicker: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  imagePickerText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ProfileScreen;
