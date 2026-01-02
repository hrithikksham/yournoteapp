
# 📓 Yournote

**Yournote** is a secure, minimal, offline-first **Android notes and journaling app** built using **React Native (Expo)** with a **FastAPI backend**.  
It focuses on privacy, simplicity, and smooth user experience rather than bloated features.

---

## ✨ Core Features

### 🏠 Home
- Smooth scrollable UI with subtle animations  
- **Journal Book** & **Password Vault** protected by a changeable passcode  
- Dynamic reminders widget with live date updates  
- User-defined labels (e.g., Work, Ideas)  
- Notes displayed with varying transparency  
- Offline access enabled  
- Always returns to Home when navigating back  

---

### 📝 Notes & Journals
- Create notes up to **20,000 words**
- Add custom labels
- Lock notes using vault password
- Distraction-free scrollable editor
- Works offline and syncs later

---

### ⏰ Reminders
- Daily to-do lists
- Auto-sorted by time and priority
- Time-based & location-based reminders
- Integrated with Android system services

---

### 🔐 Security
- Single passcode for Journal & Password Vault
- Secure storage using Expo Secure Store
- JWT-based authentication
- Password hashing with bcrypt

---

### 👤 Authentication
- Custom user accounts
- Login, Signup, Forgot Password
- Email-based password recovery
- Profile image upload (Android 12+)
- Redirects unauthenticated users to Welcome screen

---

### ⚙️ Settings
- Change vault password
- Light / Dark theme toggle
- GitHub source link
- Dynamic app version via API
- About page linked to LinkedIn

---

## 🧠 Tech Stack

### Frontend (Android)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Expo Router](https://img.shields.io/badge/Expo_Router-000020?style=for-the-badge&logo=expo&logoColor=white)
![AsyncStorage](https://img.shields.io/badge/AsyncStorage-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Secure Store](https://img.shields.io/badge/Expo_SecureStore-000020?style=for-the-badge&logo=expo&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-671DDF?style=for-the-badge&logo=axios&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_Auth_&_Storage-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)


### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_(Motor)-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic_v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-2C2C2C?style=for-the-badge&logo=python&logoColor=white)
![Uvloop](https://img.shields.io/badge/Uvloop-FFD43B?style=for-the-badge&logo=python&logoColor=black)


## 📱 Screens
Welcome · Login · Signup · Forgot Password · Home · New Note · Reminder ·  
Journal Book · Password Vault · Settings · Account

---

## 🎯 Why This Project Matters
- Full-stack mobile application
- Offline-first architecture
- Strong focus on security & privacy
- Real Android integrations
- Clean, scalable backend design

---

## 🛠️ Local Setup

**Backend**

```bash
pip install -r requirements.txt
uvicorn main:app --reload
````

**Frontend**

```bash
npm install
expo start
```

---

## 👨‍💻 Author

**Hrithik Sham D H**
B.Tech – CSE (AI & Robotics)
🔗 LinkedIn: [https://linkedin.com/in/hrithik-sham-d2811](https://linkedin.com/in/hrithik-sham-d2811)

---

*Yournote is designed as a personal knowledge vault — fast, private, and distraction-free.*
