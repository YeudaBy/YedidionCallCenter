importScripts(
    "https://www.gstatic.com/firebasejs/10.11.1/firebase-app-compat.js"
);
importScripts(
    "https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging-compat.js"
);

const firebaseConfig = {
    apiKey: "AIzaSyDgag88tk_vPocu9j8maOM30P-IdbBrtWI",
    authDomain: "yedidon-call-center.firebaseapp.com",
    projectId: "yedidon-call-center",
    storageBucket: "yedidon-call-center.firebasestorage.app",
    messagingSenderId: "147228867012",
    appId: "1:147228867012:web:81409275dae14c276a4c91",
    measurementId: "G-KZP6CS9PD4"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();


messaging.onBackgroundMessage((payload) => {
    console.log("Received background message: ", payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || "הודעה חדשה";
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || "",
        icon: payload.notification?.icon || payload.data?.icon || "/transperent-192x192.png",
        data: {
            url: payload.data?.url || "/"
        },
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === urlToOpen && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
