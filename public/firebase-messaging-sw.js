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

console.log("Firebase messaging service worker loaded.");

messaging.onBackgroundMessage((payload) => {
    console.log("Received background message ", payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        title: payload.notification.title,
        // icon: payload.notification.icon,
        data: {

        },
    };


    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    // const targetUrl = event.notification.data?.url || "/";
    const targetUrl = "/";
    console.log("Notification click received: ", event.notification.data);

    event.waitUntil(
        clients
            .matchAll({
                type: "window",
                includeUncontrolled: true,
            })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(targetUrl) && "focus" in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(targetUrl);
            })
    );
});

self.addEventListener("push", (event) => {
    console.log("Push event received: ", event);
})
