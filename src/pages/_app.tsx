import '@/styles/globals.css'
import "@/styles/utils.scss"
import "@radix-ui/themes/styles.css";
import type {AppProps} from 'next/app'
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from "@vercel/speed-insights/next"
import {SessionProvider} from "next-auth/react";
import {Auth} from "@/components/auth/Auth";


export default function App({Component, pageProps}: AppProps) {
    return <SessionProvider>
        {/*<Theme>*/}
        <Auth>
            <Component {...pageProps} />
            <Analytics/>
            <SpeedInsights/>
        </Auth>
        {/*</Theme>*/}
    </SessionProvider>
}
