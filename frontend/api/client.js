import axios from 'axios';

// IMPORTANT: Replace with your computer's local network IP address
// so your mobile device can connect to your local backend server.
// On Windows, find it with `ipconfig`. On macOS, use `ifconfig`.
// If using Android Emulator, you can use 'http://10.0.2.2:8000'
const API_BASE_URL = 'http://192.168.122.107:8000'; // Replace with your IP

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;
