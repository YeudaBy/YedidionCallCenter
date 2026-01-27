import '@/styles/globals.css'
import "@/styles/utils.scss"
import "@radix-ui/themes/styles.css";
import type {AppProps} from 'next/app'
import {SessionProvider} from "next-auth/react";
import {Auth} from "@/components/auth/Auth";
import NotificationPermission from "@/components/NotificationPermission";


export default function App({Component, pageProps}: AppProps) {
    return <SessionProvider>
        {/*<Theme>*/}
        <Auth>
            <Component {...pageProps} />
            <NotificationPermission/>
        </Auth>
        {/*</Theme>*/}
    </SessionProvider>
}
