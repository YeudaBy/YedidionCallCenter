import {Flex, Text} from "@tremor/react";
import Link from "next/link";
import * as Tremor from "@tremor/react";
import {RiUserLine} from "@remixicon/react";
import React, {ReactNode, useEffect, useState} from "react";
import Image from "next/image";
import {remult} from "remult";
import {User} from "@/model/User";

export enum Headers {
    INDEX = "מידע מוקד",
    ME = "הפרופיל שלי",
    ADMIN = "ניהול מערכת",
    USERS = "ניהול משתמשים",
    LOGS = "יומני מערכת",
    BROADCAST = "שידור הודעה",
    CATEGORIES = "קטגוריות",
}

export function Header({headerText, buttons}: {
    headerText: Headers,
    buttons: Array<ReactNode>
}) {
    const is_me = headerText === Headers.ME;
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 0);
        }
        window.addEventListener('scroll', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
        }
    }, []);

    return <Flex className={`gap-1 p-2 items-center ${scrolled ? "shadow-lg" : "border-b-2"} 
        justify-end sticky transition-shadow ease-in-out
        top-0 z-20 bg-tremor-background w-full bg-tremor-background/40 backdrop-blur-sm`}>
        <HeaderText text={headerText} />
        <>
            {buttons.map((button, index) => (
                <span key={index}>{button}</span>
            ))}
            {
                !is_me && <MeButton />
            }
        </>
    </Flex>
}

function MeButton() {
    const [hasFcmToken, setHasFcmToken] = useState(false);

    useEffect(() => {
        User.hasFcmToken(remult).then(setHasFcmToken);
    }, []);

    return <Link href={"/me"} className={"relative"}>
        <Tremor.Icon icon={RiUserLine} className={"cursor-pointer"}/>
        {!hasFcmToken && <span className={"absolute -top-0 -right-0 w-2 h-2 rounded-full bg-red-500"}></span>}
    </Link>
}

function HeaderText({text}: {text: Headers}) {
    const is_index = text === Headers.INDEX;
    const Content = () => <Text className={"xs:text-lg sm:text-2xl font-bold grow flex items-center"}>
        <Image src={"/transperent-192x192.png"} alt={"Yedidim Logo"} width={40} height={40} />
        {text}
    </Text>

    if (is_index) {
        return <Content />
    }
    return <Link href={"/"} className={"grow"}><Content /></Link>
}
