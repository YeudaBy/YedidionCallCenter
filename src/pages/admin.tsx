import {EntityFilter, remult} from "remult";
import {AdminRoles, User, UserRole} from "@/model/User";
import {useEffect, useState} from "react";
import {
    Badge,
    Button,
    Callout,
    Card,
    Dialog,
    DialogPanel,
    Flex,
    Icon,
    List,
    ListItem,
    Select,
    SelectItem,
    Switch,
    Text,
    TextInput
} from "@tremor/react";
import {Loading} from "@/components/Spinner";
import {RiAddLine, RiCheckFill, RiDeleteBin7Line, RiFileUploadLine, RiHomeLine, RiPencilLine} from "@remixicon/react";
import {District} from "@/model/District";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {useRouter} from "next/router";
import {Color} from "@tremor/react/dist/lib/inputTypes";
import {importFromXLSX} from "@/utils/xlsx";
import Image from "next/image";
import {Header, Headers} from "@/components/Header";

const usersRepo = remult.repo(User)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ISRAEL_PHONE_REGEX = /^(?:0)?(5[0-9]{8})$/

const filters: { id: string, label: string, filter: (u: User) => boolean, color: Color }[] = [
    {
        id: "all",
        label: "הכל",
        filter: () => true,
        color: "sky"
    },
    {
        id: "unregistered",
        label: "ממתינים",
        filter: u => u.isNotRegistered,
        color: "red"
    },
    {
        id: "inactive",
        label: "לא פעילים",
        filter: u => !u.active,
        color: "gray"
    },
    {
        id: "admins",
        label: "מנהלים",
        filter: u => u.isAdmin,
        color: "amber"
    },
    {
        id: "dispatchers",
        label: "לא מנהלים",
        filter: u => u.isDispatcher,
        color: "lime"
    },
    ...Object.entries(District).filter(([k, v]) => v !== District.General).map(([k, v]) => ({
        id: k,
        label: v,
        filter: (u: User) => u.district === v,
        color: "indigo" as Color
    }))
]


export default function AdminPage() {
    const router = useRouter()

    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const [query, setQuery] = useState<string>()
    const [filter, setFilter] = useState<"all" | "unregistered" | "inactive" | "admins" | "dispatchers" | District>()

    const [showAddUser, setShowAddUser] = useState(false)

    const [importOpen, setImportOpen] = useState(false)

    useEffect(() => {
        function getWhere(): EntityFilter<User> {
            return {
                active: filter !== "inactive",
                roles: filter === "admins" ? {$in: AdminRoles} :
                    ["dispatchers", "unregistered"].includes(filter || "") ? UserRole.Dispatcher : undefined,
                district: filter === "unregistered" ? {
                    $ne: Object.values(District)
                } : Object.entries(District).find(([k, v]) => k === filter)?.[1] as District,
                name: query ? {
                    $contains: query
                } : undefined,
                email: query ? {
                    $contains: query
                } : undefined,
                phone: query ? {
                    $contains: query.replace(/^0/, "")
                } : undefined
            }
        }

        setLoading(true)
        usersRepo.find({
            limit: 30,
            where: getWhere(),
            orderBy: {
                district: "asc",
                roles: "asc",
                name: "asc"
            }
        }).then(users => {
            setUsers(users)
        }).catch(e => {
            setError(e)
        }).finally(() => {
            setLoading(false)
        })
    }, [filter, query]);

    return (
        <Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>
            <Header headerText={Headers.ADMIN} buttons={[
                <Icon icon={RiAddLine} onClick={() => setShowAddUser(true)} variant={"shadow"}
                      className={"cursor-pointer"} key={"add"}/>,
                <Icon icon={RiFileUploadLine}
                      onClick={() => setImportOpen(true)}
                      variant={"shadow"}
                      className={"cursor-pointer"} key={"import"}/>
            ]} />


            <TextInput
                placeholder={"חיפוש"}
                value={query}
                onChange={e => setQuery(e.target.value)}
                className={"w-full"}
            />

            <Flex
                className={"gap-1.5 my-2 items-center justify-center flex-wrap border-2 p-2 rounded-md shadow-md border-gray-300"}>
                {
                    filters.map(d => (
                        <Badge
                            key={d.id}
                            color={d.color}
                            onClick={() => setFilter(d.id as any)}
                            className={`cursor-pointer`}>
                            {d.label}
                        </Badge>
                    ))
                }
            </Flex>

            {loading && <Loading/>}
            {error && <div>Error: {error.message}</div>}
            {User.isAdmin(remult) ? <List>
                {users?.map(user => (
                    <UserItem
                        user={user}
                        setUsers={setUsers}
                        key={user.id}/>
                ))}
            </List> : <Callout
                color={"red"}
                className={"my-3.5"}
                title={
                    "שגיאת הרשאה"
                }>
                <Text>אין לך הרשאה לערוך משתמשים</Text>
            </Callout>}

            <AddUserDialog
                open={showAddUser}
                onClose={() => setShowAddUser(false)}
            />

            <ImportDialog open={importOpen} onClose={() => setImportOpen(false)}/>
        </Flex>
    )
}

function AddUserDialog({open, onClose}: {
    open: boolean,
    onClose: () => void
}) {
    const [name, setName] = useState<string>()
    const [email, setEmail] = useState<string>()
    const [phone, setPhone] = useState<string>()
    const [loading, setLoading] = useState(false)
    const [district, setDistrict] = useState<District>()

    useEffect(() => {
        usersRepo.findFirst({id: remult.user!.id}).then(u => {
            if (u?.roles === UserRole.Admin) {
                setDistrict(u.district)
            }
        })
    }, []);

    const validPhone = () => {
        if (!phone) return
        // remove 0 from start
        const p = parseInt(phone.replace(/^0/, ""))
        if (isNaN(p)) return
        return p.toString().length === 9 ? p : undefined
    }

    const save = async () => {
        setLoading(true)
        try {
            await usersRepo.insert({
                name,
                email,
                roles: UserRole.Dispatcher,
                district,
                phone: validPhone()
            })
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} unmount={true} onClose={onClose}>
            <DialogPanel className={"flex flex-col gap-1.5"}>
                <CloseDialogButton close={onClose}/>
                <Text className={"text-center text-xl"}>הוספת משתמש</Text>
                <Text className={"text-center text-sm mb-5"}>
                    לאחר הגדרתו, המשתמש יוכל להתחבר למערכת באמצעות המייל שהזנתם.
                </Text>
                <Select
                    value={district}
                    // @ts-ignore
                    onChange={setDistrict}
                    placeholder={"*שייך למוקד"}
                    disabled={User.isRegularAdmin(remult)}
                >
                    {Object
                        .values(District)
                        .filter(d => d !== District.General)
                        .map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                </Select>
                <Text className={"text-xs text-start mb-2"}>
                    ללא שיוך למוקד - המשתמש לא יוכל להתחבר למערכת
                </Text>

                <TextInput
                    placeholder={"*שם:"}
                    type={"text"}
                    value={name}
                    autoFocus
                    onChange={e => setName(e.target.value)}
                />
                <Text className={"text-xs text-start mb-2"}>
                    נא להזין שם מלא + מספר מוקדן (ללא שם המוקד)
                </Text>

                <TextInput
                    placeholder={"*אימייל:"}
                    type={"email"}

                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <Text className={"text-xs text-start mb-2"}>
                    כתובת אימייל שתשתמש להתחברות למערכת (ע״י חשבון גוגל)
                </Text>
                <TextInput
                    placeholder={"טלפון:"}
                    type={"text"}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                />
                <Text className={"text-xs text-start"}>
                    מספר הטלפון ישמש לגישה לבוט הוואצאפ, ואינו חובה. יש להזין בפורמט: 0534506559
                </Text>

                <Flex className={"mt-24 gap-2"}>
                    <Button
                        onClick={save}
                        variant={"primary"}
                        disabled={loading || !name || !email || !district}
                        loading={loading}
                        icon={RiCheckFill}
                        className={"grow gap-2"}>
                        שמור
                    </Button>
                    <Button
                        onClick={onClose}
                        variant={"secondary"}
                        disabled={loading}
                        loading={loading}
                        className={"grow"}>
                        ביטול
                    </Button>
                </Flex>
            </DialogPanel>
        </Dialog>
    )
}


function UserItem({user, setUsers}: {
    user: User,
    setUsers: (users: (prev: User[]) => User[]) => void
}) {
    const allowed = User.isSuperAdmin(remult) || !user.isAdmin

    const onDelete = async () => {
        setUsers((prev: User[]) => prev.filter(u => u.id !== user.id))
    }

    return (
        <ListItem className={`justify-between mx-auto items-center ${
            !user.active ? "border-r-4 border-gray-500 pr-2" : ""}`}>
            <Flex
                flexDirection={"col"}
                alignItems={"start"}
                className={"grow"}
            >
                <Flex className={"gap-1.5 relative"} justifyContent={"start"}>
                    <Text>
                        {user.name}
                        {user.id === remult.user?.id && <span className={"text-xs text-red-500"}> (אתה)</span>}
                    </Text>
                    {user.isNotRegistered &&
                        <div className={"bg-red-500 h-2 w-2 rounded-full relative -top-1 left-0"}></div>}
                </Flex>
                <Flex className={"gap-1.5"} justifyContent={"start"}>
                    <Text
                        className={"font-light opacity-75"}>{user.email}{!!user.phone && `∙ ${user.phoneFormatted}`}</Text>
                </Flex>
            </Flex>
            {allowed &&
                <Flex className={"w-fit gap-1"}>
                    <EditUser
                        user={user}
                        onDelete={onDelete}
                        onSave={(nu: User) => {
                            setUsers((prev: User[]) => prev.map(u => u.id === nu.id ? nu : u))
                        }}/>
                    <DeleteUser user={user} onDelete={onDelete}/>
                </Flex>}
        </ListItem>
    )
}

function EditUser({user: _user, onSave, onDelete}: {
    user: User,
    onSave: (user: User) => void,
    onDelete: () => void
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState<string>()
    const [active, setActive] = useState<boolean>()
    const [phone, setPhone] = useState<string>()
    const [district, setDistrict] = useState<District>()
    const [userRoles, setUserRoles] = useState<UserRole>(UserRole.Dispatcher)

    useEffect(() => {
        setName(_user.name)
        setActive(_user.active)
        setDistrict(_user.district)
        setUserRoles(_user.roles)
        setPhone(_user.phoneFormatted)
    }, [_user]);

    const save = async () => {
        setLoading(true)
        const nu = {
            name,
            active,
            district,
            roles: userRoles,
            phone: phone ? parseInt(phone.replace(/^0/, "")) : undefined
        }
        const newUser = await usersRepo.update(_user.id, nu)
        onSave(newUser)
        setLoading(false)
        setOpen(false)
    }

    return (
        <>
            <Icon
                icon={RiPencilLine}
                variant={"light"}
                className={"cursor-pointer"}
                tooltip={"עריכה"}
                onClick={() => setOpen(true)}
            />
            <Dialog open={open} unmount={true} onClose={() => setOpen(false)}>
                <DialogPanel className={"flex flex-col gap-1.5"}>
                    <CloseDialogButton close={() => setOpen(false)}/>
                    <Text className={"text-center text-xl"}>
                        עריכת משתמש
                        {_user.id === remult.user?.id && <span className={"text-xs text-red-500"}> (אתה)</span>}
                    </Text>
                    <TextInput
                        placeholder={"שם"}
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    <Text className={"text-xs text-start mb-2"}>
                        נא להזין שם מלא + מספר מוקדן (ללא שם המוקד)
                    </Text>
                    <TextInput
                        placeholder={"טלפון"}
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                    />
                    <Text className={"text-xs text-start mb-2"}>
                        מס׳ טלפון שישמש להתחברות לבוט (בפורמט 0531234567)
                    </Text>

                    <Select
                        value={district}
                        placeholder={"מוקד"}
                        // @ts-ignore
                        onChange={setDistrict}
                        disabled={userRoles?.includes(UserRole.SuperAdmin) || User.isRegularAdmin(remult)}
                    >
                        {Object
                            .values(District)
                            .filter(d => d !== District.General)
                            .map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                    </Select>
                    <Text className={"text-xs text-start mb-2"}>
                        שיוך למוקד (ללא שיוך למוקד - המשתמש לא יוכל להתחבר למערכת). לא רלוונטי למנהלי מערכת, רק למוקדנים
                        ומנהלים רגילים.
                    </Text>

                    {User.isSuperAdmin(remult) &&
                        <Card className={"shadow-xl bg-gradient-to-tl from-amber-50 to-gray-50"}>
                            <Text className={"text-center font-extrabold"}>הרשאות</Text>
                            <Flex className={"gap-2 mb-2"} justifyContent={"start"}>
                                <Switch
                                    id={"admin"}
                                    checked={[UserRole.Admin, UserRole.SuperAdmin].includes(userRoles)}
                                    onChange={e => e ? setUserRoles(UserRole.Admin) : setUserRoles(UserRole.Dispatcher)}
                                />
                                <label
                                    htmlFor={"admin"} className={"cursor-pointer text-start text-sm"}>
                                    מנהל
                                </label>
                            </Flex>
                            <Flex className={"gap-2"} justifyContent={"start"}>
                                <Switch
                                    id={"super-admin"}
                                    checked={userRoles === UserRole.SuperAdmin}
                                    onChange={e => e ? setUserRoles(UserRole.SuperAdmin) : setUserRoles(UserRole.Admin)}
                                />
                                <label
                                    htmlFor={"super-admin"} className={"cursor-pointer text-start text-sm"}>
                                    מנהל מערכת
                                </label>
                            </Flex>
                            <Text className={"text-start text-sm mt-2 opacity-75"}>
                                ✅ מנהל יכול לאשר, להוסיף לערוך ולמחוק משתמשים שמשויכים למוקד שלו, לקרוא נהלים לא פעילים
                                ולהציג נהלים מכל המוקדים. <br/><br/>
                                ✅ מנהל מערכת יכול להוסיף ולמחוק מנהלים, לנהל מוקדנים מכל המוקדים, להוסיף, לערוך ולמחוק
                                נהלים, וכל שאר ההרשאות כמו מנהל. <br/><br/>
                                ✅ מוקדן רגיל יכול לצפות בנהלים אך ורק במידה והוא משוייך למוקד כלשהוא, ורק אם הם מסומנים
                                כפעילים (במידה ולא, הם יופיעו בחיפוש ללא יכולת צפיה בתוכן). <br/>
                            </Text>
                        </Card>
                    }

                    <Flex className={"gap-2 mt-4"} justifyContent={"start"}>
                        <Switch
                            id={"active"}
                            checked={active}
                            onChange={e => setActive(e)}
                        />
                        <label
                            htmlFor={"active"} className={"cursor-pointer text-start text-sm"}>
                            פעיל (כיבוי אפשרות זו תגרום להשהיית המשתמש מהמערכת)
                        </label>
                    </Flex>

                    <Flex className={"gap-1"}>
                        <Button
                            onClick={save}
                            variant={"secondary"}
                            disabled={loading || !name}
                            icon={RiCheckFill}
                            loading={loading}
                            className={"grow gap-1"}>
                            שמור
                        </Button>
                        <DeleteUser user={_user} onDelete={() => {
                            setOpen(false)
                            onDelete()
                        }}/>
                    </Flex>
                </DialogPanel>
            </Dialog>
        </>
    )
}


function DeleteUser({user, onDelete}: {
    user: User,
    onDelete: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [show, setShow] = useState(false)

    const deleteUser = async () => {
        setLoading(true)
        await usersRepo.delete(user)
        onDelete()
        setLoading(false)
        setShow(false)
    }

    return (
        <>
            <Icon
                icon={RiDeleteBin7Line}
                variant={"light"}
                color={"rose"}
                tooltip={"מחיקה"}
                onClick={() => setShow(true)}
                className={"cursor-pointer"}/>

            <Dialog open={show} unmount={true} onClose={() => setShow(false)}>
                <DialogPanel className={"flex flex-col gap-1.5"}>
                    <CloseDialogButton close={() => setShow(false)}/>
                    <Text className={"text-center text-xl"}>מחיקת משתמש</Text>
                    <Text className={"text-center text-sm"}>
                        האם אתה בטוח שברצונך למחוק את המשתמש לצמיתות?
                    </Text>
                    <Flex className={"mt-4 gap-2"}>
                        <Button
                            onClick={() => setShow(false)}
                            variant={"secondary"}
                            disabled={loading}
                            loading={loading}
                            className={"grow gap-2"}>
                            ביטול
                        </Button>
                        <Button onClick={deleteUser}
                                variant={"primary"}
                                color={"rose"}
                                disabled={loading}
                                loading={loading}
                                className={"grow gap-2"}>
                            מחק לצמיתות
                        </Button>
                    </Flex>
                </DialogPanel>
            </Dialog>
        </>
    )
}


function ImportDialog({open, onClose}: {
    open: boolean,
    onClose: () => void
}) {
    const [file, setFile] = useState<File>()
    const [loading, setLoading] = useState(false)
    const [district, setDistrict] = useState<District>()

    useEffect(() => {
        usersRepo.findFirst({id: remult.user!.id}).then(u => {
            if (u?.isRegularAdmin) {
                setDistrict(u.district)
            } else {
                setDistrict(District.General)
            }
        })
    }, []);

    const validateData = (data: any[]): {
        name: string,
        email: string,
        phone: number | undefined
    }[] => {
        return data.map(d => ({
            name: d["שם מלא"],
            email: d["מייל"],
            phone: d["טלפון"]
        })).filter((d) => {
            if (!EMAIL_REGEX.test(d.email)) {
                console.warn(`Invalid email: ${d.email}`)
                return false
            }

            if (!!d.phone && !ISRAEL_PHONE_REGEX.test(d.phone)) {
                console.warn(`Invalid phone: ${d.phone}, skipping phone number`)
                d.phone = undefined
            }

            return d.name && d.email
        }).map(d => ({
            ...d,
            phone: d.phone ? Number(d.phone.replace(/^0/, "")) : undefined
        }))
    }

    const importFile = async () => {
        setLoading(true)
        try {
            const users = await importFromXLSX<User>(file!)
            console.log(users)
            const validUsers = validateData(users)
            await usersRepo.insert(validUsers.map(u => ({
                ...u,
                roles: UserRole.Dispatcher,
                active: true,
                district: district
            })))
            onClose()
            window.location.reload()
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
            setFile(undefined)
        }
    }

    return (
        <Dialog open={open} unmount={false} onClose={onClose}>
            <DialogPanel className={"flex flex-col gap-1.5"}>
                <CloseDialogButton close={onClose}/>
                <Text className={"text-center text-xl"}>ייבוא משתמשים</Text>
                <Text className={"text-start text-sm"}>
                    ניתן לייבא משתמשים מקובץ אקסל בפורמט .xlsx
                    <br/>
                    הנתונים צריכים להיות מסודרים בצורה הבאה: שם מלא, אימייל, מספר טלפון.
                    <br/>
                    דוגמה למבנה הקובץ: 👇
                </Text>
                <Image src={"/xlsx-export-exapme.png"} alt={"export exaple"}
                       width={500} height={200} className={"mx-auto rounded-xl border-2 border-blue-400 my-3"}/>
                {User.isSuperAdmin(remult) &&
                    // @ts-ignore
                    <Select value={district} onChange={setDistrict} placeholder={"מוקד"}>
                        {Object.values(District).filter(d => d !== District.General).map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                    </Select>}
                <label
                    className={"rounded-xl mt-3 flex flex-col justify-center items-center gap-2 bg-blue-100 p-2 py-6 border-2 border-dashed border-blue-600 cursor-pointer text-center"}>
                    <Icon icon={RiFileUploadLine} variant={"light"}/>
                    {file?.name || "בחר קובץ"}
                    <input
                        type={"file"}
                        accept={".xlsx"}
                        onChange={e => setFile(e.target.files?.[0])}
                        className={"hidden"}
                    />
                </label>
                <Flex className={"mt-2 gap-2"}>
                    <Button
                        onClick={importFile}
                        variant={"primary"}
                        disabled={loading || !file}
                        loading={loading}
                        className={"grow gap-2"}>
                        ייבא
                    </Button>
                    <Button
                        onClick={onClose}
                        variant={"secondary"}
                        disabled={loading}
                        loading={loading}
                        className={"grow"}>
                        ביטול
                    </Button>
                </Flex>
            </DialogPanel>
        </Dialog>
    )
}
