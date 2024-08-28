import {useEffect, useRef, useState} from "react";
import {Procedure, ProcedureType} from "@/model/Procedure";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Badge, Button, Divider, Flex, Icon, MultiSelect, MultiSelectItem, Switch, Text} from "@tremor/react";
import {signOut} from "next-auth/react";
import {useRouter} from "next/router";
import {SearchIcon} from "@heroicons/react/solid";
import {LoadingBackdrop, LoadingSpinner} from "@/components/Spinner";
import {ProcedurePreview} from "@/components/ProcedurePreview";
import {District} from "@/model/District";
import {highlightedText} from "@/utils/highlightedText";
import {User, UserRole} from "@/model/User";
import autoAnimate from "@formkit/auto-animate";
import {PutBlobResult} from "@vercel/blob";
import {upload} from "@vercel/blob/client";
import Image from "next/image";
import {RiCloseFill} from "@remixicon/react";

const procedureRepo = remult.repo(Procedure);
const userRepo = remult.repo(User);

export default function IndexPage() {
    const [recent, setRecent] = useState<Procedure[]>()
    const [results, setResults] = useState<Procedure[]>()
    const [query, setQuery] = useState<string>()
    const [loading, setLoading] = useState(false)
    const [current, setCurrent] = useState<Procedure | true | undefined>()
    const [edited, setEdited] = useState<Procedure | true | undefined>()
    const [district, setDistrict] = useState<District | "All">("All")
    const [allowedDistricts, setAllowedDistricts] = useState<District[]>([District.General])
    const [waitingCount, setWaitingCount] = useState(0)

    const router = useRouter()

    useEffect(() => {
        if (User.isAdmin(remult)) {
            setAllowedDistricts(Object.values(District))
        } else {
            userRepo.findFirst({id: remult.user?.id})
                .then(user => {
                    setAllowedDistricts([...(user?.district ? [user.district] : []), District.General])
                })
        }
    }, []);

    useEffect(() => {
        console.log(procedureRepo.metadata)
    }, []);

    useEffect(() => {
        const q = router.query.id
        if (!q) return
        setCurrent(true)
        procedureRepo
            .findFirst({id: q})
            .then(procedure => {
                setCurrent(procedure)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [router.query.id]);

    useEffect(() => {
        setQuery(router.query.search as string || undefined)
    }, [router.query.search]);

    useEffect(() => {
        setDistrict(router.query.d as District || "All")
    }, [router.query.d]);

    useEffect(() => {
        setLoading(true)
        procedureRepo.find({
            where: (["All", District.General].includes(district) ? {}
                : {districts: {$contains: district}}),
            orderBy: {
                createdAt: 'asc'
            },
            limit: 20,
        })
            .then(procedures => {
                setRecent(procedures)
            })
            .then(() => {
                setLoading(false)
            })
    }, [district]);

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
        }).finally(() => {
            // setLoading(false)
        })
    }, [query]);

    useEffect(() => {
        userRepo.count({
            roles: {$contains: UserRole.Dispatcher},
            district: {"$nin": Object.values(District)}
        }).then(count => {
            setWaitingCount(count)
        })
    }, []);

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
                    <Badge color={"red"} className={"mx-3"}>
                        {waitingCount} ממתינים
                    </Badge>
                </Tremor.Button>}

            <Tremor.Button onClick={() => signOut()}>
                התנתק
            </Tremor.Button>
        </Flex>

        {loading && <LoadingBackdrop/>}

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

        <Flex className={"justify-center gap-1.5 my-2"}>
            {
                allowedDistricts.map(d => {
                    return <Tremor.Badge
                        className={"cursor-pointer"}
                        color={d === district ? "green" : "amber"}
                        onClick={() => {
                            setDistrict(d === district ? "All" : d)
                        }}
                        key={d}>{d}</Tremor.Badge>
                })
            }
        </Flex>

        <AddProcedure
            open={!!edited}
            procedure={edited === true ? undefined : edited}
            onClose={(val) => setEdited(undefined)}/>
        <ShowProcedure
            procedure={current}
            open={!!current}
            onClose={(val) => {
                setCurrent(undefined)
                router.push('/')
            }}
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
            </Tremor.Grid>
        }
    </Tremor.Flex>
}

function ShowProcedure({procedure, open, onClose, onEdit}: {
    procedure?: Procedure | true,
    open: boolean,
    onClose: (val: boolean) => void,
    onEdit: (procedure: Procedure) => void
}) {
    const router = useRouter()
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

    const search = (text: string) => {
        onClose(false)
        router.push(`/?search=${text}`)
    }

    const district = (district: District) => {
        onClose(false)
        router.push(`/?d=${district}`)
    }

    if (!procedure) return <></>

    console.log(remult.user)

    const sharedText = () => {
        if (typeof procedure !== "object") return ""
        return `*מוקד ארצי - ${procedure.title}*:\n\n${procedure.procedure}\n\n${window.location.href}`
    }

    return <Tremor.Dialog open={open} className={"relative"} onClose={() => onClose(false)}>
        <Icon
            variant={"light"}
            icon={RiCloseFill}
            onClick={() => onClose(false)}
            className={"fixed z-10 top-2 start-2 rounded-full cursor-pointer"}
        />

        <Tremor.DialogPanel
            ref={dialogRef}
            className={"gap-1.5 text-start flex items-center flex-col"}>

            {procedure == true ?
                <>
                    <LoadingSpinner className={"ml-4"}/>
                    <Text className={"text-3xl font-bold"}>טוען...</Text></>
                : <>
                    <Tremor.Text className={"text-xl"}>{procedure.title}</Tremor.Text>
                    <Tremor.Text
                        className={"scrollable border-gray-100 border-2 p-1 py-3 rounded-r-xl w-full drop-shadow-sm"}>
                        {highlightedText(procedure.procedure)}
                    </Tremor.Text>

                    <Flex alignItems={"center"} justifyContent={"center"} className={"gap-1 p-2"}>
                        <Button
                            className={"grow"}
                            onClick={() => copy(sharedText())}>
                            העתק
                        </Button>
                        <Button
                            className={"grow"}
                            onClick={() => share(sharedText())}>
                            שתף
                        </Button>
                    </Flex>

                    <Flex
                        className={"mx-4 mt-8 gap-1.5 flex-wrap"}
                        justifyContent={"center"}>
                        {procedure.keywords?.map(keyword => {
                            return <Tremor.Badge
                                className={"cursor-pointer"}
                                onClick={() => search(keyword)}
                                key={keyword}>{keyword}</Tremor.Badge>
                        })}
                        {procedure.districts?.map(d => {
                            return <Tremor.Badge
                                className={"cursor-pointer"}
                                color={"amber"}
                                onClick={() => district(d)}
                                key={d}>מוקד {d}</Tremor.Badge>
                        })}
                    </Flex>


                    {User.isAdmin(remult) && <>
                        <Divider className={"my-0.5"}/>

                        <Flex justifyContent={"center"} className={"gap-1.5"}>
                            <Tremor.Button
                                variant={"secondary"}
                                className={"grow"}
                                onClick={() => onEdit(procedure)}>
                                ערוך
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
    const [content, setContent] = useState<string>()
    const [keywords, setKeywords] = useState<string[]>([])
    const [active, setActive] = useState<boolean>(true)
    const [type, setType] = useState(ProcedureType.Procedure)
    const [districts, setDistricts] = useState<District[]>([District.General])
    const [showAddImage, setShowAddImage] = useState(false)
    const [images, setImages] = useState<string[]>()

    console.log("yest")

    useEffect(() => {
        if (!!procedure) {
            setTitle(procedure.title)
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
                procedure: content,
                active: active,
                districts: districts,
                keywords: keywords.map(k => k.trim()),
                type: type
            })
        } else {
            await procedureRepo.update(procedure.id!, {
                title: title,
                procedure: content,
                active: active,
                districts: districts,
                keywords: keywords.map(k => k.trim()),
                type: type
            })
        }
        setLoading(false)
        onClose?.(false)
        setActive(true)
        setTitle('')
        setContent('')
        setKeywords([])
        setType(ProcedureType.Procedure)
        setDistricts([District.General])
    }

    return <>
        <Tremor.Dialog open={open} onClose={(val) => onClose(val)}>
            <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
                <Tremor.TextInput
                    placeholder={"כותרת *"}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
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
                    placeholder={"בחר/י סוג:"}
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

                <Text className={"text-sm text-start"}>
                    תמונות
                </Text>
                <Flex className={"mb-4"}>
                    <Button
                        onClick={() => setShowAddImage(true)}>
                        הוסף תמונה
                    </Button>
                    {images?.map((image, i) => {
                        return <Image
                            key={i}
                            src={image}
                            alt={image}
                            height={30}
                            width={30}
                            className={"rounded-md"}
                        />
                    })}
                </Flex>

                <AddImageDialog
                    open={showAddImage}
                    onClose={(image) => {
                        setShowAddImage(false)
                        if (image) {
                            setImages([...(images || []), image])
                        }
                    }}
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

                {
                    remult.user?.roles?.includes(UserRole.SuperAdmin) && !!procedure &&
                    <Button
                        onClick={async () => {
                            await procedureRepo.delete(procedure.id!)
                            onClose(false)
                        }}
                        color={"red"}>
                        מחק לצמיתות
                    </Button>
                }


                <Flex className={"mt-4 gap-1.5"}>
                    <Tremor.Button
                        className="grow"
                        loading={loading}
                        disabled={!title || !content || content.length < 10}
                        onClick={() => {
                            addProcedure()
                        }}>
                        {procedure ? "עדכן" : "הוסף"}
                    </Tremor.Button>
                    <Button
                        variant={"secondary"}
                        onClick={() => onClose(false)}>
                        ביטול
                    </Button>
                </Flex>
            </Tremor.DialogPanel>
        </Tremor.Dialog>
    </>
}

function AddImageDialog({open, onClose}: {
    open: boolean,
    procedure?: Procedure,
    onClose: (image?: string) => void
}) {
    const inputFileRef = useRef<HTMLInputElement>(null);
    const [blob, setBlob] = useState<PutBlobResult | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const addImage = async () => {
        if (!file) {
            throw new Error('No file selected');
        }
        setLoading(true);
        const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/image/upload'
        });
        setBlob(newBlob);
        setLoading(false);
        onClose(newBlob.url);
    }

    return <Tremor.Dialog unmount={!open} open={open} onClose={() => onClose()}>
        <Tremor.DialogPanel>
            <input
                ref={inputFileRef}
                type="file"
                id={"file"}
                required
                hidden
                onChange={(event) => {
                    if (!inputFileRef.current?.files) {
                        throw new Error('No file selected');
                    }
                    setFile(inputFileRef.current.files[0]);
                }}
            />
            <label htmlFor={"file"}>בחר תמונה</label>
            <Button
                onClick={() => {
                    inputFileRef.current?.click();
                }}
            >
                בחר
            </Button>
            <div>
                {file?.name}
            </div>
            <Button
                onClick={() => {
                    addImage();
                }}
                disabled={!file}
                loading={loading}
            >
                הוסף
            </Button>
        </Tremor.DialogPanel>
    </Tremor.Dialog>
}
