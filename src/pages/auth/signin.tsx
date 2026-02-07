import type {GetServerSidePropsContext, InferGetServerSidePropsType,} from "next"
import {getProviders, signIn} from "next-auth/react"
import {getServerSession} from "next-auth/next"
import {authOptions} from "../api/auth/[...nextauth]"
import {Button, Card, Flex, Switch, Text} from "@tremor/react";
import Image from "next/image";
import {RiGoogleFill} from "@remixicon/react";
import {useState} from "react";

export default function SignIn({
                                   providers,
                               }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [allowingMessages, setAllowingMessages] = useState(false)
    return (
        <Flex className={"flex-col h-screen justify-between items-center"}>
            <Card className={"max-w-md mx-auto mt-10 p-6 flex flex-col items-center justify-center"}>
                <Image src={"/transperent-192x192.png"} alt={"Yedidim Logo"} width={180} height={180}/>
                <Text className={"mt-4 text-xl text-center font-semibold"}>
                    ברוכים הבאים למוקדון
                </Text>
                <Text className={"mb-12 text-lg text-center"}>
                    נהלים והנחיות למוקדני ידידים
                </Text>

                {Object.values(providers).map((provider) => (
                    <div key={provider.name}>
                        <Button color={"green"} disabled={!allowingMessages}
                                icon={RiGoogleFill} className={"gap-2"} variant={"secondary"}
                                onClick={() => signIn(provider.id)}>
                            התחברות עם {provider.name}
                        </Button>
                    </div>
                ))}

                <Flex className={"gap-2 mt-12 justify-start items-baseline"}>
                    <Switch
                        className={""}
                        onChange={(e) => setAllowingMessages(e)}
                        checked={allowingMessages}
                        id={"allow-messages-switch"}
                        color={"green"}
                    />
                    <Text className={"mt-2 text-sm text-center"}>
                        אני מאשר/ת ל<b>מוקדון</b> לשלוח לי הודעות ועדכונים.
                    </Text>
                </Flex>
            </Card>


            <footer className={"text-sm m-12 text-center text-gray-500"}>
                    <Text>
                        &copy; {new Date().getFullYear()} מוקדון. כל הזכויות שמורות.
                    </Text>
                <Text>
                    נוצר ע"י <a href={"https://yeudaby.com"} className={"text-green-800 hover:underline"}>Yeudaby</a>, מוקדן 1883
                </Text>
                <Text>
                    עבור <a href={"https://yedidim.org.il"} className={"text-green-800 hover:underline"}>ידידים - סיוע בדרכים</a>
                </Text>
            </footer>
        </Flex>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getServerSession(context.req, context.res, authOptions)

    // If the user is already logged in, redirect.
    // Note: Make sure not to redirect to the same page
    // To avoid an infinite loop!
    if (session) {
        return {redirect: {destination: "/"}}
    }

    const providers = await getProviders()

    return {
        props: {providers: providers ?? []},
    }
}
