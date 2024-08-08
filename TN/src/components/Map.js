import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

const Map = () => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 63.4305, // Trondheim coordinates
          longitude: 10.3951,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default Map;
