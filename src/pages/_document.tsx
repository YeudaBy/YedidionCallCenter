import {Head, Html, Main, NextScript} from 'next/document'
import {gradientBg} from "@/utils/ui";

export default function Document() {
    return (
        <Html lang="he" dir={"rtl"}>
            <Head/>
            <body className={gradientBg}>
            <Main/>
            <NextScript/>
            </body>
        </Html>
    )
}
