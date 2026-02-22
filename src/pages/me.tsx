import {useEffect, useState} from "react";
import {User} from "@/model/User";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Button, Card, Flex, Icon, List, ListItem, Text, TextInput} from "@tremor/react";
import {signOut} from "next-auth/react";
import {ConfirmDeleteUserDialog} from "@/components/dialogs/ConfirmDeleteUserDialog";
import {RiCheckLine, RiCloseLine} from "@remixicon/react";
import {LoadingSpinner} from "@/components/Spinner";
import {Header, Headers} from "@/components/Header";
import {requestNotificationPermission, RequestTokenResult} from "@/firebase-messages/notifications-permission";
import {UserRole, userRoleToText} from "@/model/SuperAdmin";
import {toast} from "sonner";

const userRepo = remult.repo(User);
const phoneRegex = /^[5-9]\d{8}$/;

export default function MePage() {
    const [me, setMe] = useState<User>()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [phone, setPhone] = useState<string>()
    const [validPhone, setValidPhone] = useState(true)
    const [loading, setLoading] = useState(false)

    const loadUserData = async () => {
        setLoading(true)
        try {
            if (!remult.user) return
            const user = await userRepo.findFirst({id: remult.user.id})
            setMe(user || undefined)
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error("שגיאה בטעינת נתוני המשתמש. אנא נסה שוב.");
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadUserData()
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
            toast.success("מספר הטלפון עודכן בהצלחה!");
        } catch (error) {
            console.error("Error updating phone number:", error);
            toast.error("שגיאה בעדכון מספר הטלפון. אנא נסה שוב.");
        } finally {
            void loadUserData()
            setLoading(false)
        }
    }

    const updateToken = async () => {
        setLoading(true)
        try {
            const result = await requestNotificationPermission();
            if (result !== RequestTokenResult.Success) {
                console.error("Failed to update notification token:", result);
                toast.error("שגיאה בעדכון הרשאת התראות. אנא נסה שוב.");
            } else {
                toast.success("הרשאת התראות עודכנה בהצלחה!");
            }
        } catch (error) {
            console.error("Error updating notification token:", error);
            toast.error("שגיאה בעדכון הרשאת התראות. אנא נסה שוב.");
        } finally {
            void loadUserData()
            setLoading(false)
        }
    }

    return <div className={`m-auto`}>
        <Header headerText={Headers.ME} buttons={[]}/>
        <Flex className={"p-4 flex-col"}>
            <Card className={"max-w-xl p-6 mx-auto"}>
                <List>
                    <Flex className={"gap-2 my-4"}>
                        <Tremor.Text className={"font-semibold text-xl grow text-right"}>
                            {me?.name}
                        </Tremor.Text>
                        <Tremor.Badge>
                            {userRoleToText(me?.roles || UserRole.Dispatcher)}
                        </Tremor.Badge>
                        <Tremor.Badge color={"green"}>
                            {me?.district ? me.district : "לא משויך"}
                        </Tremor.Badge>
                    </Flex>
                    <ListItem className={"flex-wrap"}>
                        <Text className={"text-right text-sm text-gray-500"}>
                            דוא"ל:
                        </Text>
                        <Text className={"text-right font-semibold"}>
                            {me?.email}
                        </Text>
                    </ListItem>
                    <ListItem className={"flex-wrap"}>
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
                    </ListItem>

                    <ListItem className={"flex-wrap"}>
                        <Text className={"text-right text-sm text-gray-500 mb-2"}>
                            קבלת עדכונים:
                        </Text>
                        <Text className={"text-right font-semibold"}>
                            {me?.fcmToken ? <Flex>
                                <Icon icon={RiCheckLine} className={"text-green-500"}/>
                                רשום
                            </Flex> : <Flex>
                                <Icon icon={RiCloseLine} className={"text-red-500"}/>
                                לא רשום

                                <Button variant={"light"} size={"xs"} className={"mr-8"}
                                        onClick={updateToken}>
                                    עדכן
                                </Button>
                            </Flex>}
                        </Text>
                    </ListItem>
                </List>

                <Flex className={"gap-6 mt-10 justify-end"}>
                    <Tremor.Button className={""} variant={"light"}
                                   onClick={() => void signOut()}>
                        התנתק
                    </Tremor.Button>

                    <Tremor.Button onClick={() => setDeleteDialogOpen(true)}
                                   className={""} color={"red"} variant={"light"}>
                        מחיקת חשבון
                    </Tremor.Button>
                </Flex>

                {deleteDialogOpen && !!me &&
                    <ConfirmDeleteUserDialog
                        onClose={() => setDeleteDialogOpen(false)}
                        user={me}/>}
            </Card>
        </Flex>
    </div>

}
