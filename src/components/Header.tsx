import {Flex, Text} from "@tremor/react";
import Link from "next/link";
import * as Tremor from "@tremor/react";
import {RiUserLine} from "@remixicon/react";
import {ReactNode} from "react";
import Image from "next/image";

export enum Headers {
    INDEX = "מוקדון - נהלי מוקד",
    ME = "הפרופיל שלי",
    ADMIN = "ניהול מערכת",
}

export function Header({headerText, buttons}: {
    headerText: Headers,
    buttons: Array<ReactNode>
}) {
    const is_me = headerText === Headers.ME;

    return <Flex className={"gap-1 py-4 items-center justify-end sticky " +
        "top-0 z-20 bg-tremor-background w-full"}>
        <Image src={"/transperent-192x192.png"} alt={"Yedidim Logo"} width={40} height={40} />
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
    return <Link href={"/me"}>
        <Tremor.Icon icon={RiUserLine} className={"cursor-pointer"}/>
    </Link>
}

function HeaderText({text}: {text: Headers}) {
    const is_index = text === Headers.INDEX;
    const Content = () => <Text className={"xs:text-lg sm:text-2xl font-bold grow"}>
        {text}
    </Text>

    if (is_index) {
        return <Content />
    }
    return <Link href={"/"} className={"grow"}><Content /></Link>
}
