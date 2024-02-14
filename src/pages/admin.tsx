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
import {Loading, LoadingSpinner} from "@/components/Spinner";
import {RiCheckFill, RiDeleteBin7Fill, RiPencilLine} from "@remixicon/react";
import {District} from "@/model/District";
import Link from "next/link";
import {useSession} from "next-auth/react";

const usersRepo = remult.repo(User)

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const [query, setQuery] = useState<string>()
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])

    useEffect(() => {
        setLoading(true)
        usersRepo.find({
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
        setFilteredUsers(users.filter(u => u.name.includes(query) || u.email.includes(query)))
    }, [query, users]);

    useEffect(() => {
        console.log(usersRepo.metadata.apiUpdateAllowed(), "usersRepo.metadata.apiUpdateAllowed()")
        console.log(usersRepo.metadata.apiDeleteAllowed(), "usersRepo.metadata.apiDeleteAllowed()")
        console.log(usersRepo.metadata.apiInsertAllowed(), "usersRepo.metadata.apiInsertAllowed()")
        console.log(usersRepo.metadata.apiReadAllowed, "usersRepo.metadata.apiReadAllowed()")
    }, []);

    return (
        <div className={"p-2"}>
            <Link href={"/"}>
                <Text className={"font-semibold text-center text-xl"}>פאנל ניהול משתמשים</Text>
            </Link>

            <TextInput
                placeholder={"חיפוש"}
                value={query}
                onChange={e => setQuery(e.target.value)}
                className={"w-full"}
            />

            {loading && <Loading/>}
            {error && <div>Error: {error.message}</div>}
            {usersRepo.metadata.apiUpdateAllowed() ? <List className={"p-1"}>
                {(!!filteredUsers.length ? filteredUsers : users).map(user => (
                    <UserItem
                        user={user}
                        setUsers={setUsers}
                        key={user.id}/>
                ))}
            </List> : <Callout
                color={"red"}
                className={"w-fit mx-auto my-3.5"}
                title={
                    "שגיאת הרשאה"
                }>
                <Text>אין לך הרשאה לערוך משתמשים</Text>
            </Callout>}
        </div>
    )
}


function UserItem({user, setUsers}: {
    user: User,
    setUsers: (users: (prev: User[]) => User[]) => void
}) {
    const isAdmin = user.roles === UserRole.Admin
    const isSuperAdmin = user.roles === UserRole.SuperAdmin
    const district = user.district

    const CBadge = () => {
        if (!user.active) return <Badge color={"red"}>לא פעיל</Badge>
        if (isSuperAdmin) return <Badge color={"amber"}>מנהל מערכת</Badge>
        if (isAdmin) return <>
            <Badge color={"blue"}>מנהל</Badge>
            {district && <Badge color={"green"}>{district}</Badge>}
        </>
        if (district) return <Badge color={"green"}>{district}</Badge>
        return <Badge color={"red"}>לא רשום</Badge>
    }

    const onDelete = async () => {
        await usersRepo.delete(user.id)
        setUsers((prev: User[]) => prev.filter(u => u.id !== user.id))
    }

    return (
        <ListItem className={"justify-between py-2 max-w-xl mx-auto items-center"}>
            <Flex
                flexDirection={"col"}
                alignItems={"start"}
                className={"grow"}
            >
                <Flex className={"gap-1.5"} justifyContent={"start"}>
                    <Text>{user.name}</Text>
                    <CBadge/>
                </Flex>
                <Text className={"font-light"}>{user.email}</Text>
            </Flex>
            <Flex className={"w-fit gap-1"}>
                <EditUser
                    user={user}
                    onDelete={onDelete}
                    onSave={(nu: User) => {
                        setUsers((prev: User[]) => prev.map(u => u.id === nu.id ? nu : u))
                    }}/>
                <DeleteUser user={user} onDelete={onDelete}/>
            </Flex>
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
    const [district, setDistrict] = useState<District>()
    const [userRoles, setUserRoles] = useState<UserRole>(UserRole.Dispatcher)

    useEffect(() => {
        setName(_user.name)
        setActive(_user.active)
        setDistrict(_user.district)
        setUserRoles(_user.roles)
    }, [_user]);

    const save = async () => {
        setLoading(true)
        const nu = {
            name,
            active,
            district,
            roles: userRoles
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
                    <Text className={"text-center text-xl"}>עריכת משתמש</Text>
                    <TextInput
                        placeholder={"שם"}
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />

                    <Select
                        value={district}
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

                    {remult.user?.roles?.includes(UserRole.SuperAdmin) && (
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
                            <Divider/>
                            <Text className={"text-start text-sm"}>
                                ✅ מנהל יכול לערוך ולמחוק משתמשים, וכן להוסיף, לערוך ולמחוק נהלים. <br/>
                                ✅ מנהל מערכת יכול להוסיף ולמחוק מנהלים, וכל הרשאה נוספת שיש למנהל רגיל. <br/>
                                ✅ מוקדן רגיל יכול לצפות בנהלים אך ורק במידה והוא משוייך למוקד כלשהוא. <br/>
                            </Text>

                        </Card>
                    )}

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
    const deleteUser = () => {
        setLoading(true)
        onDelete()
        setLoading(false)
    }
    return (
        <>
            <Icon
                icon={RiDeleteBin7Fill}
                variant={"light"}
                color={"red"}
                tooltip={"מחיקה"}
                onClick={deleteUser}
                className={"cursor-pointer"}/>
            {loading && <LoadingSpinner/>}
        </>
    )
}
