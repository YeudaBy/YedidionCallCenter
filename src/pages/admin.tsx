import {remult} from "remult";
import {User, UserRole} from "@/model/User";
import {useEffect, useState} from "react";
import {
    Badge,
    Button,
    Callout,
    Card,
    Dialog,
    DialogPanel,
    Divider,
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
import {RiAddLine, RiCheckFill, RiCheckLine, RiDeleteBin7Line, RiHomeLine, RiPencilLine} from "@remixicon/react";
import {District} from "@/model/District";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {useRouter} from "next/router";
import {Color} from "@tremor/react/dist/lib/inputTypes";

const usersRepo = remult.repo(User)

const filters: { label: string, filter: (u: User) => boolean, color: Color }[] = [
    {
        label: "הכל",
        filter: () => true,
        color: "sky"
    },
    {
        label: "לא פעילים",
        filter: u => !u.active,
        color: "gray"
    },
    {
        label: "מנהלים",
        filter: u => !u.roles.includes(UserRole.Dispatcher),
        color: "amber"
    },
    {
        label: "לא מנהלים",
        filter: u => u.roles.includes(UserRole.Dispatcher),
        color: "lime"
    },
    ...Object.values(District).filter(a => a !== District.General).map(d => ({
        label: d,
        filter: (u: User) => u.district === d,
        color: "indigo" as Color
    }))
]


export default function AdminPage() {
    const router = useRouter()

    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const [query, setQuery] = useState<string>()
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])

    const [showAddUser, setShowAddUser] = useState(false)

    useEffect(() => {
        setLoading(true)
        usersRepo.find({
            limit: 30,
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
    }, []);

    useEffect(() => {
        if (!query) return setFilteredUsers([])
        setFilteredUsers(users.filter(u => u.name.includes(query) || u.email.includes(query) || u.phoneFormatted?.includes(query)))
    }, [query, users]);

    return (
        <Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>
            <Flex className={"gap-1 mb-4 items-center justify-end"}>
                <Text className={"text-lg sm:text-2xl font-bold grow"}>משתמשים</Text>

                <Icon icon={RiHomeLine} onClick={() => router.back()} className={"cursor-pointer"}/>
                <Icon icon={RiAddLine} onClick={() => setShowAddUser(true)} className={"cursor-pointer"}/>
            </Flex>

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
                            key={d.label}
                            color={d.color}
                            onClick={() => setFilteredUsers(users.filter(d.filter))}
                            className={`cursor-pointer`}>
                            {d.label}
                        </Badge>
                    ))
                }
            </Flex>

            {loading && <Loading/>}
            {error && <div>Error: {error.message}</div>}
            {usersRepo.metadata.apiUpdateAllowed() ? <List>
                {(!!filteredUsers.length ? filteredUsers : users).map(user => (
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
                    placeholder={"שייך למוקד"}
                    disabled={remult.user?.roles?.includes(UserRole.Admin)}
                >
                    {Object
                        .values(District)
                        .filter(d => d !== District.General)
                        .map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                </Select>
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
                        className={"grow"}>
                        שמור
                    </Button>
                    <Button
                        onClick={onClose}
                        variant={"secondary"}
                        disabled={loading}
                        // icon={RiCheckFill}
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
    const isAdmin = user.roles === UserRole.Admin
    const isSuperAdmin = user.roles === UserRole.SuperAdmin
    const currentUserRoles = remult.user?.roles
    const district = user.district

    const allowed = currentUserRoles?.includes(UserRole.SuperAdmin) || (currentUserRoles?.includes(UserRole.Admin) && !isSuperAdmin && !isAdmin)

    const CBadge = () => {
        if (!user.active) return <Badge color={"gray"}>לא פעיל</Badge>
        if (isSuperAdmin) return <Badge color={"amber"}>מנהל מערכת</Badge>
        if (isAdmin) return <>
            <Badge color={"blue"}>מנהל</Badge>
            {district && <Badge color={"green"}>{district}</Badge>}
        </>
        if (district) return <Badge color={"green"}>{district}</Badge>
        return <Badge color={"red"}>לא רשום</Badge>
    }

    const getColor = () => {
        if (!user.active) return "gray"
        if (isSuperAdmin) return "amber"
        if (isAdmin) return "blue"
        if (district) return "green"
        return "red"
    }

    const onDelete = async () => {
        setUsers((prev: User[]) => prev.filter(u => u.id !== user.id))
    }

    return (
        <ListItem className={"justify-between mx-auto items-center"}>
            <Flex
                flexDirection={"col"}
                alignItems={"start"}
                className={"grow"}
            >
                <Flex className={"gap-1.5"} justifyContent={"start"}>
                    <Text>{user.name}</Text>
                    {/*<CBadge/>*/}
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
        // console.log("allowed", usersRepo.metadata.apiUpdateAllowed({..._user, ...nu}))
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
                    <Text className={"text-center text-xl"}>עריכת משתמש</Text>
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
                        disabled={userRoles?.includes(UserRole.SuperAdmin)}
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

                    <Card className={"shadow-xl bg-gradient-to-tl from-amber-50 to-gray-50"}>
                        <Text className={"text-center font-extrabold"}>הרשאות</Text>
                        {
                            remult.user?.roles?.includes(UserRole.SuperAdmin) &&
                            <>
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
                            </>
                        }
                        <Divider/>
                        <Text className={"text-start text-sm"}>
                            ✅ מנהל יכול לאשר, להוסיף לערוך ולמחוק משתמשים, וכן להוסיף, לערוך ולמחוק נהלים. <br/>
                            ✅ מנהל מערכת יכול להוסיף ולמחוק מנהלים, וכל שאר ההרשאות כמו מנהל רגיל. <br/>
                            ✅ מוקדן רגיל יכול לצפות בנהלים אך ורק במידה והוא משוייך למוקד כלשהוא, ורק אם הם מסומנים
                            כפעילים (במידה ולא, הם יופיעו בחיפוש ללא יכולת צפיה בתוכן). <br/>
                        </Text>

                    </Card>

                    {userRoles.includes(UserRole.Dispatcher) || remult.user?.roles?.includes(UserRole.SuperAdmin) && // todo
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
                        </Flex>}

                    <Flex className={"mt-24 gap-2"}>
                        <Button
                            onClick={save}
                            variant={"secondary"}
                            disabled={loading || !name || (!(userRoles?.includes(UserRole.Admin) || userRoles?.includes(UserRole.SuperAdmin)) && !district)}
                            icon={RiCheckFill}
                            loading={loading}
                            className={"grow"}>
                            שמור
                        </Button>
                        {remult.user?.roles?.includes(UserRole.SuperAdmin) || userRoles.includes(UserRole.Dispatcher) // todo
                            && <DeleteUser user={_user} onDelete={() => {
                                setOpen(false)
                                onDelete()
                            }}/>}
                    </Flex>

                </DialogPanel>
            </Dialog>
        </>
    )
}


function DeleteUser({
                        user, onDelete
                    }: {
    user: User,
    onDelete
        :
        () => void
}) {
    const [loading, setLoading] = useState(false)
    const [show, setShow] = useState(false)

    const active = user.active

    const deactivateUser = () => {
        setLoading(true)
        if (active)
            usersRepo.update(user.id, {active: false})
        else
            usersRepo.update(user.id, {active: true})
        setLoading(false)
    }

    const deleteUser = async () => {
        setLoading(true)
        await usersRepo.delete(user.id)
        onDelete()
        setLoading(false)
        setShow(false)
    }


    return (
        <>
            <Icon
                icon={active ? RiDeleteBin7Line : RiCheckLine}
                variant={"light"}
                color={active ? "red" : "green"}
                tooltip={active ? "מחיקה" : "הפעלה"}
                onClick={() => setShow(true)}
                className={"cursor-pointer"}/>

            <Dialog open={show} unmount={true} onClose={() => setShow(false)}>
                <DialogPanel className={"flex flex-col gap-1.5"}>
                    <CloseDialogButton close={() => setShow(false)}/>
                    <Text className={"text-center text-xl"}>מחיקת משתמש</Text>
                    <Text className={"text-center text-sm"}>
                        האם אתה בטוח שברצונך ל{active ? "השהות" : "הפעיל"} את המשתמש {user.name}?
                    </Text>
                    <Flex className={"mt-4 gap-2"}>
                        <Button
                            onClick={deactivateUser}
                            color={"red"}
                            disabled={loading}
                            loading={loading}
                            className={"grow"}>
                            כן
                        </Button>
                        <Button
                            onClick={() => setShow(false)}
                            variant={"secondary"}
                            disabled={loading}
                            loading={loading}
                            className={"grow"}>
                            ביטול
                        </Button>
                    </Flex>
                    {remult.user?.roles?.includes(UserRole.SuperAdmin) &&
                        <Button onClick={deleteUser}
                                variant={"light"}
                                color={"red"}
                                disabled={loading}
                                loading={loading}
                                className={"grow"}>
                            מחק לצמיתות
                        </Button>}
                </DialogPanel>
            </Dialog>
        </>
    )
}
