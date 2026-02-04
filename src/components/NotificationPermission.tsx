"use client";

import { useEffect } from "react";
import {requestNotificationPermission} from "@/firebase-messages/notifications-permission";

const NotificationPermission = () => {

    useEffect(() => {
        const subscribeUser = async () => {
            await requestNotificationPermission();
        };

        subscribeUser();
    }, []);

    return null;
};

export default NotificationPermission;
