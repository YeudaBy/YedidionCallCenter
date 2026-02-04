// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {useEffect} from "react";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDgag88tk_vPocu9j8maOM30P-IdbBrtWI",
    authDomain: "yedidon-call-center.firebaseapp.com",
    projectId: "yedidon-call-center",
    storageBucket: "yedidon-call-center.firebasestorage.app",
    messagingSenderId: "147228867012",
    appId: "1:147228867012:web:81409275dae14c276a4c91",
    measurementId: "G-KZP6CS9PD4"
};

export const firebaseApp = initializeApp(firebaseConfig);

export const useAnalytics = () => {
    useEffect(() => {
        getAnalytics(firebaseApp);
    }, []);
}
