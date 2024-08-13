import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Text, Button, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import barsAndClubs from '../data/barsAndClubs'; // Replace with your data file
import { auth, database, storage } from '../config/firebaseconfig'; // Replace with your Firebase config
import { push, ref, set, remove, onValue } from 'firebase/database';
import { getDownloadURL } from 'firebase/storage';

const Map = () => {
  const [location, setLocation] = useState(null);
  const [selectedBar, setSelectedBar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [checkedInUsers, setCheckedInUsers] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
    })();

    if (auth.currentUser) {
      const email = auth.currentUser.email;
      const username = email.split('@')[0];
      setUsername(username);

      const fetchProfileImage = async () => {
        try {
          const url = await getDownloadURL(ref(storage, `profilePictures/${auth.currentUser.uid}`));
          setProfileImage(url);
        } catch (error) {
          console.log("No profile picture found.");
        }
      };

      fetchProfileImage();
    }
  }, []);

  const handleMarkerPress = (bar) => {
    setSelectedBar(bar);
    fetchCheckedInUsers(bar.id);
    setModalVisible(true);
  };

  const fetchCheckedInUsers = (barId) => {
    const checkinsRef = ref(database, `checkins/${barId}`);
    onValue(checkinsRef, (snapshot) => {
      const users = snapshot.val() ? Object.values(snapshot.val()) : [];
      setCheckedInUsers(users);
      setIsCheckedIn(users.some(user => user.userId === auth.currentUser.uid));
    });
  };

  
const handleCheckIn = async () => {
  if (selectedBar && status) {
    try {
      const checkInData = {
        userId: auth.currentUser.uid,
        username: username,
        profileImageUrl: profileImage,
        barName: selectedBar.name,
        note: status,
        timestamp: Date.now(),
      };

    

      // Save check-in data under the specific bar's check-ins
      const userRef = ref(database, `checkins/${selectedBar.id}/${auth.currentUser.uid}`);
      await set(userRef, checkInData);

      // Push the check-in data to the posts (feed)
      const postsRef = ref(database, 'posts');
      await push(postsRef, checkInData);

      setModalVisible(false);
      setStatus("");
      alert("Check-in successful!");
    } catch (error) {
      console.error("Error checking in: ", error);
      alert("Failed to check in. Please try again.");
    }
  } else {
    alert("Please enter a status before checking in.");
  }
};
  

  const handleCheckOut = async () => {
    if (selectedBar) {
      try {
        const userRef = ref(database, `checkins/${selectedBar.id}/${auth.currentUser.uid}`);
        await remove(userRef);

        setModalVisible(false);
        alert("You have checked out successfully!");
      } catch (error) {
        console.error("Error checking out: ", error);
        alert("Failed to check out. Please try again.");
      }
    }
  };

  let region = {
    latitude: 63.4305,
    longitude: 10.3951,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (location) {
    region = {
      ...region,
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={"You're here"}
          />
        )}

        {barsAndClubs.map((place, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() => handleMarkerPress(place)}
          >
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>{place.name}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalView}>
          <Image
            source={{ uri: selectedBar?.image || 'https://via.placeholder.com/150' }}
            style={styles.barImage}
          />
          <Text style={styles.modalTitle}>{selectedBar?.name}</Text>
          {isCheckedIn ? (
            <Button title="Leave" onPress={handleCheckOut} />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="How's the vibe?"
                value={status}
                onChangeText={setStatus}
              />
              <Button title="Check In" onPress={handleCheckIn} />
            </>
          )}
          <Button title="Cancel" onPress={() => setModalVisible(false)} />

          <FlatList
  data={checkedInUsers}
  keyExtractor={(item) => item.userId}
  renderItem={({ item }) => (
    <View style={styles.userContainer}>
      <Image 
        source={{ uri: item.profileImage || 'https://via.placeholder.com/150' }} 
        style={styles.userImage} 
        onError={() => console.log('Error loading image:', item.profileImage)}
      />
      <Text>{item.username}</Text>
    </View>
  )}
/>

        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
  },
  calloutText: {
    color: '#333',
    fontWeight: 'bold',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  barImage: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  usernameText: {
    fontSize: 16,
  },
});

export default Map;
