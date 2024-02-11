import {useEffect, useState} from "react";
import {Procedure, ProcedureType} from "@/model/Procedure";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Button, Divider, Flex, MultiSelect, MultiSelectItem, Switch, Text} from "@tremor/react";
import {signOut} from "next-auth/react";
import {useRouter} from "next/router";
import {SearchIcon} from "@heroicons/react/solid";
import {Loading} from "@/components/Spinner";
import {ProcedurePreview} from "@/components/ProcedurePreview";
import {District} from "@/model/District";
import {highlightedText} from "@/utils/highlightedText";
import {UserRole} from "@/model/User";

const procedureRepo = remult.repo(Procedure);

export default function IndexPage() {
    const [recent, setRecent] = useState<Procedure[]>()
    const [results, setResults] = useState<Procedure[]>()
    const [query, setQuery] = useState<string>()
    const [loading, setLoading] = useState(false)
    const [current, setCurrent] = useState<Procedure | undefined>()

    const router = useRouter()

    useEffect(() => {
        const q = router.query.q
        if (!q) return
        procedureRepo
            .findFirst({id: q})
            .then(procedure => {
                setCurrent(procedure)
            })
    }, [router.query.q]);

    useEffect(() => {
        setLoading(true)
        return procedureRepo.liveQuery({
            orderBy: {
                createdAt: 'asc'
            },
            limit: 5,
        })
            .subscribe(procedures => {
                setRecent(procedures.applyChanges)
                setLoading(false)
            })
    }, []);

    useEffect(() => {
        if (!query) return
        setLoading(true)
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
            setLoading(false)
        })
    }, [query]);

    return <Tremor.Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>
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

        {
            procedureRepo.metadata.apiInsertAllowed() && <AddProcedure/>
        }

        <Tremor.Button onClick={() => signOut()}>Sign Out</Tremor.Button>

        <ShowProcedure procedure={current} open={!!current} onClose={(val) => setCurrent(undefined)}/>

        {loading ? <Loading/> :
            <Tremor.Grid className={"gap-2 mt-3 w-full"} numItems={1} numItemsSm={2} numItemsLg={3}>
                {!query ? recent?.map(procedure => {
                    return <ProcedurePreview procedure={procedure} key={procedure.id}/>
                }) : results?.map(procedure => {
                    return <ProcedurePreview procedure={procedure} key={procedure.id}/>
                })}
            </Tremor.Grid>}
    </Tremor.Flex>
}

function ShowProcedure({procedure, open, onClose}: {
    procedure?: Procedure,
    open: boolean,
    onClose: (val: boolean) => void
}) {

    const [loading, setLoading] = useState(false)

    const copy = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const share = (text: string) => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
    }

    if (!procedure) return <></>
    return <Tremor.Dialog open={open} onClose={() => onClose(false)}>
        <Tremor.DialogPanel className={"gap-1.5 text-start flex items-center flex-col"}>
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


        </Tremor.DialogPanel>
    </Tremor.Dialog>
}

function AddProcedure() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState<string>()
    const [description, setDescription] = useState<string>()
    const [content, setContent] = useState<string>()
    const [keywords, setKeywords] = useState<string[]>([])
    const [active, setActive] = useState<boolean>(true)
    const [type, setType] = useState(ProcedureType.Procedure)
    const [districts, setDistricts] = useState<District[]>([District.General])


    const addProcedure = async () => {
        setLoading(true)
        await procedureRepo.insert({
            title: title,
            description: description,
            procedure: content,
            active: active,
            districts: districts,
            keywords: keywords.map(k => k.trim()),
            type: type
        })
        setLoading(false)
        setOpen(false)
    }

    return <>
        <Tremor.Button onClick={() => setOpen(true)}>הוסף פרוצדורה</Tremor.Button>
        <Tremor.Dialog open={open} onClose={(val) => setOpen(val)}>
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

                <Flex className={"gap-2"}>
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
                </Flex>

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
                        addProcedure().then(() => {
                            setOpen(false)
                        })
                    }}>
                    {"הוסף"}
                </Tremor.Button>
            </Tremor.DialogPanel>
        </Tremor.Dialog>

    </>
}
