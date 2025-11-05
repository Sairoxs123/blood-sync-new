import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
    apiKey: "AIzaSyDMwdJtGBKbEKcHDWRWIDORoLvCraFQvQk",
    authDomain: "blood-sync-54482.firebaseapp.com",
    projectId: "blood-sync-54482",
    storageBucket: "blood-sync-54482.firebasestorage.app",
    messagingSenderId: "780912585856",
    appId: "1:780912585856:web:cc85061c90c940c2e24a65",
    measurementId: "G-5D08WS72B9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const db = getFirestore(app)

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdTowIsAAAAACfhivqOgqPc00dG1xl_A13Idkz6'),

  // Optional: Set to 'true' to only allow valid tokens.
  // This is recommended for production apps.
  isTokenAutoRefreshEnabled: true
});

export { auth, db };
