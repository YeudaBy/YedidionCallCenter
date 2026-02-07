import {useEffect, useState} from "react";
import {User, UserRole} from "@/model/User";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Button, Card, Flex, Icon, Text, TextInput} from "@tremor/react";
import {signOut} from "next-auth/react";
import {ConfirmDeleteUserDialog} from "@/components/dialogs/ConfirmDeleteUserDialog";
import {RiCheckLine} from "@remixicon/react";
import {LoadingSpinner} from "@/components/Spinner";
import {Header, Headers} from "@/components/Header";

const userRepo = remult.repo(User);
const phoneRegex = /^[5-9]\d{8}$/;

export default function MePage() {
    const [me, setMe] = useState<User>()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [phone, setPhone] = useState<string>()
    const [validPhone, setValidPhone] = useState(true)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        if (!remult.user) return
        userRepo.findFirst({id: remult.user.id}).then(user => {
            setMe(user || undefined)
        }).catch(error => {
            console.error("Error fetching user data:", error);
        }).finally(() => {
            setLoading(false)
        })
    }, []);

    useEffect(() => {
        setPhone(me?.phoneFormatted || "")
    }, [me]);

    useEffect(() => {
        if (!phone) {
            setValidPhone(true)
            return
        }
        setValidPhone(phoneRegex.test(phone))
    }, [phone]);

    const updatePhone = async () => {
        if (!validPhone || !phone || !me) return
        setLoading(true)
        try {
            await userRepo.update(me.id, {phone: Number(phone)});
        } catch (error) {
            console.error("Error updating phone number:", error);
        } finally {
            setLoading(false)
        }
    }

    return <Tremor.Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>
        <Header headerText={Headers.ME} buttons={[]}/>
        <Card className={""}>
            <>
                <Flex className={"gap-2"}>
                    <Tremor.Text className={"font-semibold text-xl grow text-right"}>
                        {me?.name}
                    </Tremor.Text>
                    <Tremor.Badge>
                        {me?.roles.includes(UserRole.Dispatcher) ? me?.district || "--" : "מנהל"}
                    </Tremor.Badge>
                    <Tremor.Badge color={"green"}>
                        {me?.district ? me.district : "לא משויך למחוז"}
                    </Tremor.Badge>
                </Flex>
                <Flex className={"gap-2 mt-4 flex-col items-start"}>
                    <Text className={"text-right text-sm text-gray-500"}>
                        דוא"ל:
                    </Text>
                    <Text className={"text-right font-semibold"}>
                        {me?.email}
                    </Text>
                </Flex>
                <Flex className={"my-8 mt-4 gap-2 flex-col items-start"}>
                    <Text className={"text-right text-sm text-gray-500 mb-2"}>
                        מספר טלפון:
                    </Text>
                    {
                        me?.phoneFormatted ?
                            <Text className={"font-semibold"}>{me.phoneFormatted}</Text>
                            : <form className={"w-full"}>
                                <Flex className={""}>
                                    <TextInput
                                        pattern={phoneRegex.source}
                                        inputMode={"tel"}
                                        enterKeyHint={"enter"}
                                        value={phone}
                                        onValueChange={setPhone}
                                        placeholder={"הזינו את מספר הטלפון שלכם"}
                                        className={"grow"}
                                    />
                                    <Button variant={"light"} disabled={!validPhone || loading || !phone}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updatePhone()
                                            }}>
                                        {
                                            loading ? <LoadingSpinner className={"scale-50"}/> :
                                                <Icon icon={RiCheckLine}/>
                                        }
                                    </Button>
                                </Flex>
                                {
                                    !validPhone && <Text className={"text-red-600 text-xs text-right"}>
                                        מספר טלפון לא תקין
                                    </Text>
                                }
                                <Text className={"text-right text-xs"}> ללא 0 בהתחלה (לדוגמה 531234567)</Text>
                            </form>
                    }
                </Flex>
            </>

            <Flex className={"gap-2 mt-10"}>
                <Tremor.Button className={"grow"}
                               onClick={() => void signOut()}>
                    התנתק
                </Tremor.Button>

                <Tremor.Button onClick={() => setDeleteDialogOpen(true)}
                               className={"grow"} color={"red"} variant={"secondary"}>
                    מחיקת חשבון
                </Tremor.Button>
            </Flex>

            {deleteDialogOpen && !!me &&
                <ConfirmDeleteUserDialog
                    onClose={() => setDeleteDialogOpen(false)}
                    user={me}/>}
        </Card>
    </Tremor.Flex>

}
