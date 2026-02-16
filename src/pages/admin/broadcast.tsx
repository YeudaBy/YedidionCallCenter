import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {remult, repo} from "remult";
import {User} from "@/model/User";
import {District} from "@/model/District";
import {RoleGuard} from "@/components/auth/RoleGuard";
import {Header, Headers} from "@/components/Header";
import * as Tremor from "@tremor/react";
import {Button, Flex, List, ListItem, Text, Textarea, TextInput} from "@tremor/react";
import {cx} from "@/utils/ui";
import {RiSendInsLine} from "@remixicon/react";
import {Loading} from "@/components/Spinner";
import {UserRole} from "@/model/SuperAdmin";
import {toast} from "sonner";

const userRepo = repo(User)
// pattern for internal or external URLs (starting with http://, https://, or /)
const urlPattern = /^(https?:\/\/|\/).+/

export default function BroadcastPage() {
    const router = useRouter()
    const uid = router.query.uid as string

    const [users, setUsers] = useState<User[]>([])
    const [districts, setDistricts] = useState<District[]>(Object.values(District))
    const [selectedUsers, setSelectedUsers] = useState<User[]>([])

    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [href, setHref] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!User.isSomeAdmin(remult)) {
            return
        }

        try {
            if (uid) {
                userRepo.findOne({where: {id: uid}}).then(user => {
                    if (user) {
                        setUsers([user])
                        setSelectedUsers([user])
                    }
                })
            } else {
                userRepo.find({
                    where: {
                        active: true,
                        district: {
                            $in: districts
                        },
                        fcmToken: {
                            $ne: undefined
                        }
                    }
                }).then(setUsers)
            }
        } catch (e) {
            console.error(e)
            toast.error("אירעה שגיאה בטעינת המשתמשים")
        }
    }, [districts]);

    useEffect(() => {
        if (!remult.user) {
            return
        }

        if (User.isSuperAdmin(remult)) {
            return;
        }

        try {
            userRepo.findId(remult.user.id).then(user => {
                if (user) {
                    setDistricts([user.district!])
                }
            })
        } catch (e) {
            console.error(e)
            toast.error("אירעה שגיאה בטעינת פרטי המשתמש")
        }
    }, []);

    const selectUser = (user: User) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
        } else {
            setSelectedUsers([...selectedUsers, user])
        }
    }

    const selectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(users)
        }
    }

    const sendBroadcast = async () => {
        setLoading(true)
        try {
            await fetch("/api/notification", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title,
                    body,
                    url: href,
                    recipients: selectedUsers.map(u => u.fcmToken).filter(Boolean)
                })
            })
            toast.success("ההודעה נשלחה בהצלחה!")
            setTitle("")
            setBody("")
            setHref("")
            setSelectedUsers([])
        } catch (e) {
            console.error(e)
            toast.error("אירעה שגיאה בשליחת ההודעה")
        } finally {
            setLoading(false)
        }
    }

    return (
        <RoleGuard allowedRoles={[UserRole.SuperAdmin, UserRole.Admin]}>
            <Header headerText={Headers.BROADCAST} buttons={[]}/>
            <div className={"h-screen p-6"}>
                {
                    loading && <Loading/>
                }

                <div className={"mb-4"}>
                    <label className={"block mb-1"}>כותרת:</label>
                    <TextInput placeholder={"הקלד..."}
                               value={title} onValueChange={setTitle} className={"w-full"}/>
                </div>

                <div className={"mb-4"}>
                    <label className={"block mb-1"}>תוכן ההודעה:</label>
                    <Textarea placeholder={"הקלד..."}
                              value={body} onValueChange={setBody} className={"w-full"}/>
                </div>

                <div className={"mb-4"}>
                    <label className={"block mb-1"}>קישור (אופציונלי): <span className={"text-sm text-gray-500"}>(לדף הבית ניתן להזין ״/״ או להשאיר ריק)</span></label>
                    <TextInput placeholder={"/"} type={"url"} pattern={urlPattern.source}
                               value={href} onValueChange={setHref} className={"w-full"}/>
                </div>

                {
                    User.isSuperAdmin(remult) && (
                        <div className={"my-4"}>
                            <Text className={"mb-1 block"}>בחירת מוקדים:</Text>
                            <Tremor.MultiSelect className={"w-full"} value={districts}
                                                onValueChange={(values) => setDistricts(values as District[])}>
                                {Object.values(District).map(district => (
                                    <Tremor.MultiSelectItem key={district} value={district}>
                                        {district}
                                    </Tremor.MultiSelectItem>
                                ))}
                            </Tremor.MultiSelect>

                        </div>
                    )
                }

                <div className={"mb-4"}>
                    <Flex className={"items-center justify-between"}>
                        <Text>
                            {selectedUsers.length} מתוך {users.length} משתמשים נבחרו
                        </Text>

                        <Button onClick={selectAll} variant={"light"} className={""}>
                            {selectedUsers.length === users.length ? "בטל בחירה" : "בחר הכל"}
                        </Button>
                    </Flex>

                    <List className={"max-h-64 overflow-auto border p-2 rounded-xl"}>
                        {users.map(user => {
                            const isSelected = !!selectedUsers.find(u => u.id === user.id)
                            return (
                                <ListItem key={user.id}
                                          className={cx("gap-2 mb-1 items-center rounded-xl px-2 justify-start cursor-pointer",
                                              isSelected && "bg-tremor-brand-muted")}>
                                    <input type="checkbox" className={"hidden"}
                                           checked={!!selectedUsers.find(u => u.id === user.id)}
                                           onChange={() => selectUser(user)} id={`uid-${user.id}`}/>
                                    <label htmlFor={`uid-${user.id}`}>
                                        <Text className={"font-semibold inline"}>{user.name}</Text>
                                        {
                                            !!user.phoneFormatted &&
                                            <span className={"text-sm text-gray-500"}> ({user.phoneFormatted})</span>
                                        }
                                        {" - " + user.district}
                                    </label>
                                </ListItem>
                            )
                        })}
                    </List>
                </div>

                <Button onClick={sendBroadcast} icon={RiSendInsLine}
                        disabled={loading || selectedUsers.length === 0 || !title || !body}
                        className={`px-4 py-2 w-full gap-2 rounded ${loading || selectedUsers.length === 0 ? "cursor-not-allowed" : ""}`}>
                    {loading ? "שולח..." : "שלח הודעה"}
                </Button>
            </div>
        </RoleGuard>
    )
}
