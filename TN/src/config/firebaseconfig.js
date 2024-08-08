// src/config/firebaseConfig.js
import { initializeApp } from '@firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC9JaC58GIuB_I7FALFx9qPNZj8mT1aAXQ",
  authDomain: "trondheimnightlife.firebaseapp.com",
  databaseURL: "https://trondheimnightlife-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "trondheimnightlife",
  storageBucket: "trondheimnightlife.appspot.com",
  messagingSenderId: "616999947557",
  appId: "1:616999947557:web:74d1a7d507dc04e833decc",
  measurementId: "G-4XDK5ZVW1V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage for persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { app, auth };





