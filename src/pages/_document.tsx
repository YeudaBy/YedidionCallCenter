import {Head, Html, Main, NextScript} from 'next/document'
import {gradientBg} from "@/utils/ui";
import React from "react";

const SITE_DESCRIPTION = "מערכת מידע ונהלים - מוקד ידידים";
const SITE_TITLE = "מוקדון ✦ מערכת מידע ונהלים";

export default function Document() {
    return (
        <Html lang="he" dir={"rtl"}>
            <Head>
                <title>
                    {SITE_TITLE}
                </title>
                <meta name="og:title" content={SITE_TITLE} />
                <meta name={"description"} content={SITE_DESCRIPTION} />
                <meta name={"og:description"} content={SITE_DESCRIPTION} />

                <meta name={"og:image"} content={"/mokdon-poster.png"} />
            </Head>
            <body className={gradientBg}>
            <Main/>
            <NextScript/>
            </body>
        </Html>
    )
}
