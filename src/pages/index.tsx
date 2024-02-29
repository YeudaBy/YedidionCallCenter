import {useEffect, useRef, useState} from "react";
import {Procedure, ProcedureType} from "@/model/Procedure";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Button, Divider, Flex, MultiSelect, MultiSelectItem, Switch, Text} from "@tremor/react";
import {signOut} from "next-auth/react";
import {useRouter} from "next/router";
import {SearchIcon} from "@heroicons/react/solid";
import {LoadingSpinner} from "@/components/Spinner";
import {ProcedurePreview} from "@/components/ProcedurePreview";
import {District} from "@/model/District";
import {highlightedText} from "@/utils/highlightedText";
import {User, UserRole} from "@/model/User";
import autoAnimate from "@formkit/auto-animate";

const procedureRepo = remult.repo(Procedure);

export default function IndexPage() {
    const [recent, setRecent] = useState<Procedure[]>()
    const [results, setResults] = useState<Procedure[]>()
    const [query, setQuery] = useState<string>()
    // const [loading, setLoading] = useState(false)
    const [current, setCurrent] = useState<Procedure | true | undefined>()
    const [edited, setEdited] = useState<Procedure | true | undefined>()

    const router = useRouter()

    useEffect(() => {
        console.log(procedureRepo.metadata)
    }, []);

    useEffect(() => {
        const q = router.query.q
        if (!q) return
        // setCurrent(true)
        procedureRepo
            .findFirst({id: q})
            .then(procedure => {
                setCurrent(procedure)
            })
    }, [router.query.q]);

    useEffect(() => {
        if (!current) {
            router.push('/')
        }
    }, [current, router]);

    useEffect(() => {
        // setLoading(true)
        procedureRepo.find({
            orderBy: {
                createdAt: 'asc'
            },
            limit: 5,
        })
            .then(procedures => {
                setRecent(procedures)
            })
            .then(() => {
                // setLoading(false)
            })
    }, []);

    useEffect(() => {
        if (!query) return
        // setLoading(true)
        procedureRepo.find({
            where: {
                $or: [
                    {title: query},
                    {
                        keywords: {
                            $contains: query
                        }
                    }
                ]
            }
        }).then(procedures => {
            setResults(procedures)
        }).then(() => {
            // setLoading(false)
        })
    }, [query]);

    return <Tremor.Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>

        <Flex className={"gap-1 mb-4"}>
            {!!User.isAdmin(remult) && <Tremor.Button
                variant={"secondary"}
                onClick={() => setEdited(true)}>הוסף נוהל</Tremor.Button>}

            {
                !!User.isAdmin(remult) && <Tremor.Button
                    className={"grow"}
                    onClick={() => router.push('/admin')}>
                    איזור ניהול
                </Tremor.Button>}

            <Tremor.Button onClick={() => signOut()}>
                התנתק
            </Tremor.Button>

        </Flex>

        <Tremor.TextInput
            color={"amber"}
            className={"w-full"}
            placeholder={"חיפוש..."}
            value={query}
            onChange={e => {
                setQuery(e.target.value)
            }}
            onValueChange={v => {
                if (!v) {
                    setResults(undefined)
                    router.push('/')
                } else {
                    router.push(`/?q=${v}`)
                }
            }}
            icon={SearchIcon}
        />

        <AddProcedure
            open={!!edited}
            procedure={edited === true ? undefined : edited}
            onClose={(val) => setEdited(undefined)}/>
        <ShowProcedure
            procedure={current}
            open={!!current}
            onClose={(val) => setCurrent(undefined)}
            onEdit={(procedure) => setEdited(procedure)}
        />

        {
            // loading ? <Loading/> :
            <Tremor.Grid className={"gap-2 mt-3 w-full"} numItems={1} numItemsSm={2} numItemsLg={3}>
                {!query ? recent?.map(procedure => {
                    return <ProcedurePreview procedure={procedure} key={procedure.id}/>
                }) : results?.map(procedure => {
                    return <ProcedurePreview procedure={procedure} key={procedure.id}/>
                })}
            </Tremor.Grid>}
    </Tremor.Flex>
}

function ShowProcedure({procedure, open, onClose, onEdit}: {
    procedure?: Procedure | true,
    open: boolean,
    onClose: (val: boolean) => void,
    onEdit: (procedure: Procedure) => void
}) {

    const [loading, setLoading] = useState(false)

    const dialogRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        dialogRef.current && autoAnimate(dialogRef.current)
    }, []);

    const copy = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const share = (text: string) => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
    }

    if (!procedure) return <></>


    return <Tremor.Dialog open={open} onClose={() => onClose(false)}>
        <Tremor.DialogPanel
            ref={dialogRef}
            className={"gap-1.5 text-start flex items-center flex-col"}>
            {procedure == true ?
                <>
                    <LoadingSpinner className={"ml-4"}/>
                    <Text className={"text-3xl font-bold"}>טוען...</Text></>
                : <>
                    <Tremor.Text className={"text-xl"}>{procedure.title}</Tremor.Text>
                    <Tremor.Text>{procedure.description}</Tremor.Text>
                    <Tremor.Text>
                        {highlightedText(procedure.procedure)}
                    </Tremor.Text>

                    <Flex alignItems={"center"} justifyContent={"center"} className={"gap-1 p-2"}>
                        <Button
                            className={"grow"}
                            onClick={() => copy(procedure.procedure)}>
                            העתק
                        </Button>
                        <Button
                            className={"grow"}
                            onClick={() => share(procedure.procedure)}>
                            שתף
                        </Button>
                    </Flex>


                    {remult.user?.roles?.includes(UserRole.Admin) && <>
                        <Divider className={"my-0.5"}/>
                        <Text>
                            איזור ניהול
                        </Text>
                        <Flex>
                            <Tremor.Button
                                onClick={() => procedureRepo.delete(procedure.id!).then(() => onClose(false))}>
                                מחק
                            </Tremor.Button>
                            <Tremor.Button
                                onClick={() => onEdit(procedure)}>
                                ערוך
                            </Tremor.Button>
                            <Tremor.Button
                                loading={loading}
                                onClick={() => {
                                    setLoading(true)
                                    procedureRepo.update(procedure.id!, {
                                        active: !procedure.active
                                    }).then(() => setLoading(false))
                                }}>
                                {procedure.active ? "השהה" : "הפעל"}
                            </Tremor.Button>
                        </Flex>
                    </>}
                </>
            }
        </Tremor.DialogPanel>
    </Tremor.Dialog>
}

function AddProcedure({procedure, open, onClose,}: {
    open: boolean,
    onClose: (val: boolean) => void,
    procedure?: Procedure,
}) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState<string>()
    const [description, setDescription] = useState<string>()
    const [content, setContent] = useState<string>()
    const [keywords, setKeywords] = useState<string[]>([])
    const [active, setActive] = useState<boolean>(true)
    const [type, setType] = useState(ProcedureType.Procedure)
    const [districts, setDistricts] = useState<District[]>([District.General])


    useEffect(() => {
        if (!!procedure) {
            setTitle(procedure.title)
            setDescription(procedure.description)
            setContent(procedure.procedure)
            setKeywords(procedure.keywords)
            setActive(procedure.active)
            setType(procedure.type)
            setDistricts(procedure.districts)
        }
    }, [procedure]);

    const addProcedure = async () => {
        setLoading(true)
        if (!procedure) {
            await procedureRepo.insert({
                title: title,
                description: description,
                procedure: content,
                active: active,
                districts: districts,
                keywords: keywords.map(k => k.trim()),
                type: type
            })
        } else {
            await procedureRepo.update(procedure.id!, {
                title: title,
                description: description,
                procedure: content,
                active: active,
                districts: districts,
                keywords: keywords.map(k => k.trim()),
                type: type
            })
        }
        setLoading(false)
        onClose?.(false)
    }

    return <>
        <Tremor.Dialog open={open} onClose={(val) => onClose(val)}>
            <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
                <Tremor.TextInput
                    placeholder={"כותרת *"}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <Tremor.TextInput
                    placeholder={"תיאור"}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />

                {/*<Flex className={"gap-2"}>*/}
                <MultiSelect
                    placeholder={"בחר/י מוקדים:"}
                    value={districts}
                    // @ts-ignore
                    onChange={e => setDistricts(e)}
                >
                    {Object.values(District).map(value => {
                        return <MultiSelectItem
                            key={value}
                            value={value}
                        >
                            {value}
                        </MultiSelectItem>
                    })}
                </MultiSelect>

                <Tremor.Select
                    value={type}
                    // @ts-ignore
                    onChange={e => setType(e)}
                >
                    <Tremor.SelectItem value={ProcedureType.Procedure}>נוהל</Tremor.SelectItem>
                    <Tremor.SelectItem value={ProcedureType.Guideline}>הנחייה</Tremor.SelectItem>
                </Tremor.Select>
                {/*</Flex>*/}


                <Tremor.Textarea
                    placeholder={"נוסח הנוהל*: (מינימום 10 תווים)"}
                    value={content}
                    rows={10}
                    onChange={e => setContent(e.target.value)}
                />

                <Tremor.TextInput
                    placeholder={"מילות מפתח: (מופרדות בפסיק)"}
                    value={keywords.join(',')}
                    onChange={e => setKeywords(e.target.value.split(','))}
                />

                <Flex alignItems={"center"} justifyContent={"start"} className={"gap-1"}>
                    <Switch
                        id={"active"}
                        checked={active}
                        onChange={e => setActive(e)}
                    />
                    <label htmlFor={"active"} className={"text-sm"}>{
                        active ? "פעיל" : "לא פעיל"
                    }</label>
                </Flex>

                <Tremor.Button
                    className="mt-8 w-full"
                    loading={loading}
                    disabled={!title || !content || content.length < 10}
                    onClick={() => {
                        addProcedure()
                    }}>
                    {procedure ? "עדכן" : "הוסף"}
                </Tremor.Button>
            </Tremor.DialogPanel>
        </Tremor.Dialog>

    </>
}
