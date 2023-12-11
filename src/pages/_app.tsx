import '@/styles/globals.css'
import {SessionProvider} from 'next-auth/react'
import type {AppProps} from 'next/app'
import {Analytics} from '@vercel/analytics/react';


export default function App({Component, pageProps}: AppProps) {
    return <SessionProvider>
        <Component {...pageProps} />
        <Analytics/>
    </SessionProvider>
}
