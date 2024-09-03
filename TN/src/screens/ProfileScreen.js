import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { signOut } from 'firebase/auth';
import { ref as dbRef, set, get, child, onValue, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, database, storage } from '../config/firebaseconfig';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';

const ProfileScreen = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const snapshot = await get(child(dbRef(database), `users/${auth.currentUser.uid}/profileImageUrl`));
        if (snapshot.exists()) {
          setProfileImage(snapshot.val());
        } else {
          console.log("No profile picture found.");
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    fetchProfileImage();
  }, []);

  useEffect(() => {
    const postsRef = dbRef(database, 'posts');
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val()
        ? Object.entries(snapshot.val()).filter(([key, value]) => value.userId === auth.currentUser.uid)
        : [];
      setPosts(data.reverse()); // Reverse to show the latest posts first
    });
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

      const imageRef = storageRef(storage, `profilePictures/${auth.currentUser.uid}`);
      await uploadBytes(imageRef, blob);

      const url = await getDownloadURL(imageRef);

      await set(dbRef(database, `users/${auth.currentUser.uid}/profileImageUrl`), url);

      setProfileImage(url);
    } catch (error) {
      console.error("Error uploading image:", error.message);
    }
  };

  const handleDeletePost = async (postId) => {
    const postRef = dbRef(database, `posts/${postId}`);
    await remove(postRef);
  };

  const renderPost = ({ item }) => {
    const postId = item[0];
    const post = item[1];

    return (
      <View style={styles.postContainer}>
        <Image 
          source={{ uri: post.profileImageUrl || 'https://via.placeholder.com/150' }} 
          style={styles.userImage} 
        />
        <View style={styles.postContent}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.time}>{new Date(post.timestamp).toLocaleString()}</Text>
          <Text style={styles.location}>Checked in at: {post.barName}</Text>
          <Text style={styles.note}>{post.note}</Text>

          <View style={styles.interactionRow}>
            <Ionicons name="heart-outline" size={24} color="red" />
            <Text style={styles.likeCount}>{post.likes ? Object.keys(post.likes).length : 0}</Text>
          </View>

          {post.userId === auth.currentUser.uid && (
            <TouchableOpacity onPress={() => handleDeletePost(postId)} style={styles.deleteButton}>
              <Ionicons name="trash" size={24} color="red" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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

      <Text style={styles.postsTitle}>Your Posts</Text>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => index.toString()}
        style={styles.postsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  postsTitle: {
    fontSize: 22,
    marginTop: 20,
    marginBottom: 10,
  },
  postsList: {
    width: '100%',
  },
  postContainer: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  postContent: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  location: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  note: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 5,
    fontSize: 14,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
});

export default ProfileScreen;
