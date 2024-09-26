import {useCallback, useEffect, useRef, useState} from "react";
import {Procedure, ProcedureType} from "@/model/Procedure";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Button, Divider, Flex, Icon, ListItem, MultiSelect, MultiSelectItem, Switch, Text} from "@tremor/react";
import {useRouter} from "next/router";
import {SearchIcon} from "@heroicons/react/solid";
import {LoadingBackdrop, LoadingSpinner} from "@/components/Spinner";
import {ProcedurePreview} from "@/components/ProcedurePreview";
import {District} from "@/model/District";
import {highlightedText} from "@/utils/highlightedText";
import {User, UserRole} from "@/model/User";
import autoAnimate from "@formkit/auto-animate";
import Image from "next/image";
import {
    RiAddLine,
    RiChat1Line,
    RiCloseFill,
    RiCloseLine,
    RiCursorLine,
    RiDeleteBinLine,
    RiEyeLine,
    RiEyeOffLine,
    RiFileDownloadLine,
    RiFileList3Fill,
    RiGroupLine,
    RiListCheck,
    RiPencilLine,
    RiSortAlphabetAsc,
    RiSortAsc,
    RiUserLine
} from "@remixicon/react";
import {UploadButton} from "@/components/uploadthing";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {Popover, PopoverContent} from "@/components/Popover";
import {PopoverTrigger} from "@radix-ui/react-popover";
import {signOut} from "next-auth/react";
import {exportToXLSX} from "@/utils/xlsx";
import {diff} from "@/utils/diff";
import {Log, LogType} from "@/model/Log";
import {Color} from "@tremor/react/dist/lib/inputTypes";
import Link from "next/link";

const procedureRepo = remult.repo(Procedure);
const userRepo = remult.repo(User);
const logRepo = remult.repo(Log);

enum Order {
    Recent = 'חדשים',
    Alphabetical = 'א-ב',
}

export default function IndexPage() {
    const [procedures, setProcedures] = useState<Procedure[]>()
    const [results, setResults] = useState<Procedure[]>()
    const [query, setQuery] = useState<string>()
    const [loading, setLoading] = useState(false)
    const [current, setCurrent] = useState<Procedure | true | undefined>()
    const [edited, setEdited] = useState<Procedure | true | undefined>()
    const [district, setDistrict] = useState<District | "All">("All")
    const [allowedDistricts, setAllowedDistricts] = useState<District[]>([District.General])
    const [waitingCount, setWaitingCount] = useState(0)
    const [showInactive, setShowInactive] = useState(false)
    const [inactives, setInactives] = useState<Procedure[]>()
    const [me, setMe] = useState<User>()
    const [addNumOpen, setAddNumOpen] = useState(false)
    const [order, setOrder] = useState<Order>(Order.Recent)
    const [logsOpen, setLogsOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState<Procedure>()

    useEffect(() => {
        if (!order) return
        setProcedures(() => {
            return procedures?.sort((a, b) => {
                return order === Order.Recent ? b.updatedAt.getTime() - a.updatedAt.getTime()
                    : a.title.localeCompare(b.title)
            })
        })
    }, [order, procedures]);

    useEffect(() => {
        if (!remult.user) return
        userRepo.liveQuery({where: {id: remult.user.id}})
            .subscribe(user => {
                setMe(user.items[0])
            })
    }, []);

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
            where: {
                ...(["All", District.General].includes(district) ? {}
                    : {districts: {$contains: district}}),
                active: true,
                type: ProcedureType.Procedure,
            },
            orderBy: {
                updatedAt: "desc"
            }
        })
            .then(procedures => {
                setProcedures(procedures)
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
                ],
                type: ProcedureType.Procedure,
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

    useEffect(() => {
        if (!showInactive) return
        setLoading(true)
        procedureRepo.find({
            where: {
                active: false
            }
        }).then(procedures => {
            setInactives(procedures)
        }).finally(() => {
            setLoading(false)
        })
    }, [showInactive]);

    const addNew = useCallback((newProcedure: Procedure) => {
        setProcedures([...procedures || [], newProcedure])
    }, [procedures]);

    const editProcedure = useCallback((editedProcedure: Procedure) => {
        setProcedures(procedures?.map(p => p.id === editedProcedure.id ? editedProcedure : p))
    }, [procedures]);

    const deleteProcedure = useCallback((deletedProcedureId: string) => {
        setProcedures(procedures?.filter(p => p.id !== deletedProcedureId))
    }, [procedures]);

    return <Tremor.Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>

        <Flex className={"gap-1 mb-4 items-center justify-end"}>

            <Text className={"text-lg sm:text-2xl font-bold grow"}>
                מוקד ידידים - נהלים והנחיות
            </Text>

            {!!User.isAdmin(remult) && <> <Tremor.Icon
                variant={"outlined"}
                className={"cursor-pointer"}
                icon={RiAddLine} onClick={() => setEdited(true)}/>

                <Tremor.Icon
                    variant={"shadow"}
                    onClick={() => router.push('/admin')}
                    icon={RiGroupLine}
                    data-badge={waitingCount == 0 ? undefined : waitingCount}
                    className={"cursor-pointer"}
                />

                <Tremor.Icon
                    variant={"shadow"}
                    className={"cursor-pointer"}
                    icon={showInactive ? RiEyeLine : RiEyeOffLine}
                    onClick={() => setShowInactive(!showInactive)}/>

                <Icon icon={RiFileDownloadLine}
                      onClick={() => exportToXLSX(procedures?.map(p => ({
                          "כותרת": p.title,
                          "תוכן": p.procedure,
                          "פעיל": p.active ? "כן" : "לא",
                          "סוג": p.type,
                          "מוקדים": p.districts.join(", "),
                          "תגיות": p.keywords.join(", "),
                          "תמונות": p.images.join(", "),
                          "נוצר": p.createdAt.toISOString(),
                          "עודכן": p.updatedAt.toISOString(),
                          "קישור לנוהל": `${window.location.origin}/?id=${p.id}`
                      })) || [], "נהלים - מוקד")}
                      variant={'shadow'}
                      className={"cursor-pointer"}/>
            </>
            }

            {
                User.isSuperAdmin(remult) && <Tremor.Icon
                    variant={"shadow"}
                    className={"cursor-pointer"}
                    icon={RiFileList3Fill}
                    onClick={() => setLogsOpen(true)}/>
            }

            <Popover>
                <PopoverTrigger asChild>
                    <Tremor.Icon icon={RiUserLine} className={"cursor-pointer"}/>
                </PopoverTrigger>
                <PopoverContent className="p-4">
                    <Tremor.List className={""}>
                        <Tremor.ListItem>
                            <Tremor.Text>
                                {me?.name}
                                {" • "}
                                {me?.roles.includes(UserRole.Dispatcher) ? me?.district || "--" : "מנהל"}
                            </Tremor.Text>
                        </Tremor.ListItem>
                        <Tremor.ListItem>
                            <Tremor.Text>
                                {me?.phoneFormatted || "הזן מספר טלפון:"}
                            </Tremor.Text>
                            {!me?.phone && <Icon onClick={() => setAddNumOpen(true)}
                                                 icon={RiAddLine} className={"cursor-pointer"}/>}
                        </Tremor.ListItem>
                        <Tremor.ListItem>
                            <Tremor.Button className={"w-full"}
                                           onClick={() => void signOut()}>
                                התנתק
                            </Tremor.Button>
                        </Tremor.ListItem>
                    </Tremor.List>
                </PopoverContent>
            </Popover>

            {
                !!me && <AddPhoneNumberDialog open={addNumOpen} onClose={setAddNumOpen} me={me}/>
            }
        </Flex>

        {
            loading && <LoadingBackdrop/>
        }

        <Flex className={""}>
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
            <Icon icon={RiCloseLine} variant={"light"} onClick={() => {
                router.push('/').then(() => setQuery(undefined))
            }}/>
        </Flex>

        <Flex className={"justify-start gap-1.5 my-4"}>
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
            <Icon
                icon={order === Order.Recent ? RiSortAlphabetAsc : RiSortAsc}
                className={"cursor-pointer"} variant={"light"}
                onClick={() => {
                    setOrder(order === Order.Recent ? Order.Alphabetical : Order.Recent)
                }}
            />
        </Flex>

        {
            !!edited && <AddProcedure
                open={true}
                procedure={edited === true ? undefined : edited}
                onAdd={addNew}
                onEdit={editProcedure}
                setOpenDelete={setDeleteOpen}
                onClose={(val) => {
                    setEdited(undefined)
                    setEdited(undefined)
                    router.push('/')
                }}/>
        }
        {
            !!current && <ShowProcedure
                procedure={current}
                open={true}
                onClose={(val) => {
                    setCurrent(undefined)
                    router.push('/')
                }}
                onEdit={(procedure) => setEdited(procedure)}
            />
        }

        {
            logsOpen && <LogsDialog procedure={undefined} open={true} onClose={setLogsOpen}/>
        }

        {
            // loading ? <Loading/> :
            <Tremor.Grid className={"gap-2 w-full"} numItems={1} numItemsSm={2} numItemsLg={3}>
                {showInactive && inactives?.map(procedure => {
                    return <ProcedurePreview procedure={procedure} key={procedure.id}/>
                })}
                {!query ? procedures?.map(procedure => {
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

    const [selectedImage, setSelectedImage] = useState<string>()

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

        <Tremor.DialogPanel
            ref={dialogRef}
            className={"gap-1.5 text-start flex items-center flex-col p-2 sm:p-3"}>
            <CloseDialogButton close={() => onClose(false)}/>
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

                    <Flex className={"gap-1.5 my-2"}>
                        {procedure.images?.map((image, i) => {
                            return <Image
                                key={i}
                                src={image}
                                alt={image}
                                height={75}
                                width={75}
                                onClick={() => setSelectedImage(image)}
                                className={"rounded-md border-2 border-blue-200 cursor-pointer"}
                            />
                        })}

                        {!!selectedImage &&
                            <Tremor.Dialog open={!!selectedImage} onClose={() => setSelectedImage(undefined)}>
                                <Tremor.DialogPanel>
                                    <CloseDialogButton close={() => setSelectedImage(undefined)}/>
                                    <Image
                                        src={selectedImage}
                                        alt={selectedImage}
                                        layout={"responsive"}
                                        width={500}
                                        height={500}
                                    />
                                </Tremor.DialogPanel>
                            </Tremor.Dialog>}
                    </Flex>

                    <Flex alignItems={"center"} justifyContent={"center"} className={"gap-1"}>
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

function AddProcedure({procedure, open, onClose, onAdd, onEdit, setOpenDelete}: {
    open: boolean,
    onClose: (val: boolean) => void,
    procedure?: Procedure,
    onAdd?: (procedure: Procedure) => void,
    onEdit?: (procedure: Procedure) => void,
    setOpenDelete?: (val: Procedure | undefined) => void
}) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState<string>()
    const [content, setContent] = useState<string>()
    const [keywords, setKeywords] = useState<string[]>([])
    const [active, setActive] = useState<boolean>(true)
    const [type, setType] = useState(ProcedureType.Procedure)
    const [districts, setDistricts] = useState<District[]>([District.General])
    const [images, setImages] = useState<string[]>()

    const [showLogs, setShowLogs] = useState(false)

    useEffect(() => {
        if (!!procedure) {
            setTitle(procedure.title)
            setContent(procedure.procedure)
            setKeywords(procedure.keywords)
            setActive(procedure.active)
            setType(procedure.type)
            setDistricts(procedure.districts)
            setImages(procedure.images)
        }
    }, [procedure]);

    const addProcedure = async () => {
        setLoading(true)
        if (!procedure) {
            const newObj = await procedureRepo.insert({
                title: title,
                procedure: content,
                active: active,
                districts: districts,
                keywords: keywords.map(k => k.trim()),
                type: type,
                images: images,
            })
            await logRepo.insert({
                byUserId: remult.user?.id!,
                procedureId: newObj.id!,
                log: newObj.title,
                type: LogType.Created
            })
            onAdd?.(newObj)
        } else {
            const updatedObj = await procedureRepo.update(procedure.id!, {
                title: title,
                procedure: content,
                active: active,
                districts: districts,
                keywords: keywords.map(k => k.trim()),
                type: type,
                images: images,
            })
            for (const e1 of [
                diff(procedure.procedure, content || ""),
                diff(procedure.title, title || ""),
                diff(procedure.keywords.join(", "), keywords.join(", ") || ""),
                diff(procedure.type, type || ""),
                diff(procedure.districts.join(", "), districts.join(", ") || ""),
                diff(procedure.active.toString(), active.toString() || ""),
                diff(procedure.images.join(", "), images?.join(", ") || "")
            ].filter(Boolean).map(e => e as string)) {
                await logRepo.insert({
                    byUserId: remult.user?.id!,
                    procedureId: procedure.id!,
                    log: e1,
                    type: LogType.Updated
                })
            }
            onEdit?.(updatedObj)
        }
        setLoading(false)
        onClose?.(false)
    }

    return <>
        <Tremor.Dialog open={open} onClose={(val) => onClose(val)}>
            <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
                <Flex className={"gap-1.5"}>
                    <CloseDialogButton close={() => onClose(false)}/>
                    <Icon icon={RiListCheck}
                          onClick={() => setShowLogs(!showLogs)}
                          className={"cursor-pointer"}/>
                </Flex>
                <Tremor.TextInput
                    placeholder={"כותרת *"}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <Tremor.Text className={"text-xs text-start self-start mb-1"}>
                    את הכותרת יש להוסיף ללא המילה ״נוהל״.
                </Tremor.Text>

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
                <Tremor.Text className={"text-xs text-start self-start mb-1"}>
                    יש לבחור את המוקדים הרלוונטיים (במידה והנוהל ארצי - אין צורך לבחור את כולם, מספיק לסמן ״ארצי״)
                </Tremor.Text>

                <Tremor.Select
                    value={type}
                    placeholder={"בחר/י סוג:"}
                    // @ts-ignore
                    onChange={e => setType(e)}
                >
                    <Tremor.SelectItem value={ProcedureType.Procedure}>נוהל</Tremor.SelectItem>
                    <Tremor.SelectItem value={ProcedureType.Guideline}>הנחייה</Tremor.SelectItem>
                </Tremor.Select>
                <Tremor.Text className={"text-xs text-start self-start mb-1"}>
                    יש לבחור האם הנוהל המבוקש הינו ״הנחיה״. במידה ואינך בטוח - השאר על ״נוהל״.
                </Tremor.Text>


                <Tremor.Textarea
                    placeholder={"נוסח הנוהל*: (מינימום 10 תווים)"}
                    value={content}
                    rows={10}
                    onChange={e => setContent(e.target.value)}
                />
                <Tremor.Text className={"text-xs text-start self-start mb-1"}>
                    בהזנת הטקסט נא להקפיד על פורמט זהה לוואצאפ (הדגשות עם כוכביות וכו׳)
                </Tremor.Text>


                <Tremor.TextInput
                    placeholder={"מילות מפתח:"}
                    value={keywords.join(',')}
                    onChange={e => setKeywords(e.target.value.split(/,\s*/))}
                />
                <Tremor.Text className={"text-xs text-start self-start mb-1"}>
                    יש להפריד בין מילות מפתח בפסיק (לדוגמה: נזק, תקלה, תקן)
                </Tremor.Text>

                <Flex className={"p-1 items-center justify-end gap-2 border-2 border-dashed"}>
                    {images?.map((image, i) => {
                        return <div key={i} className={"relative"}>
                            <Image
                                src={image}
                                alt={image}
                                height={70}
                                width={70}
                                className={"rounded-md border-2 border-blue-300"}
                            />

                            <Icon
                                color={"red"}
                                onClick={() => setImages(images.filter((_, j) => i !== j))}
                                icon={RiCloseFill}
                                className={"absolute top-0 start-0 w-full h-full flex justify-center items-center cursor-pointer rounded-xl bg-white/50 drop-shadow-xl"}
                            />
                        </div>
                    })}
                    <UploadButton
                        endpoint={"imageUploader"}
                        className={"button:h-full"}
                        onClientUploadComplete={url => setImages([...(images || []), ...url.map(e => e.url)])}
                        content={{
                            button({ready, isUploading, uploadProgress, fileTypes}) {
                                return <p>
                                    {ready ? 'בחר קובץ' : isUploading ? `מעלה ${uploadProgress}%` : 'המשך'}
                                </p>
                            },
                            allowedContent({fileTypes}) {
                                return <></>
                            }
                        }}
                    />
                </Flex>


                <Flex alignItems={"center"} justifyContent={"start"} className={"gap-1"}>
                    <Switch
                        id={"active"}
                        checked={active}
                        onChange={e => setActive(e)}
                    />
                    <Tremor.Text className={"text-xs text-start"}>
                        {active ? "פעיל" : "לא פעיל"} [במידה ואינכם מעוניינים לפרסם עדיין את הנוהל לכולם - כבו אפשרות
                        זו]
                    </Tremor.Text>
                </Flex>

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
                    {
                        remult.user?.roles?.includes(UserRole.SuperAdmin) && !!procedure &&
                        <Button
                            onClick={() => setOpenDelete?.(procedure)}
                            color={"red"}>
                            מחק
                        </Button>
                    }
                    <Button
                        variant={"secondary"}
                        onClick={() => onClose(false)}>
                        ביטול
                    </Button>
                </Flex>
            </Tremor.DialogPanel>
        </Tremor.Dialog>

        {showLogs && <LogsDialog procedure={procedure} open={true} onClose={setShowLogs}/>}
    </>
}

function DeleteDialog({procedure, onClose, onDelete}: {
    procedure: Procedure,
    onClose: (val: boolean) => void,
    onDelete: (procedureId: string) => void
}) {
    const [loading, setLoading] = useState(false)

    const deleteProcedure = async () => {
        setLoading(true)
        await procedureRepo.delete(procedure.id!)
        await logRepo.insert({
            byUserId: remult.user?.id!,
            procedureId: procedure.id!,
            log: [procedure.title, procedure.procedure].join(", "),
            type: LogType.Deleted
        })
        onDelete(procedure.id!)
        onClose(false)
    }

    return <Tremor.Dialog open={true} onClose={() => onClose(false)}>
        <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
            <CloseDialogButton close={() => onClose(false)}/>
            <Tremor.Text className={"text-lg font-bold"}>מחיקת נוהל</Tremor.Text>
            <Tremor.Text className={"text-xs text-start self-start mb-1"}>
                האם את/ה בטוח/ה שברצונך למחוק את הנוהל <span
                className={"font-semibold"}> {procedure.title} </span> לצמיתות?
            </Tremor.Text>
            <Tremor.Button
                variant={"primary"}
                color={"red"}
                icon={RiDeleteBinLine}
                onClick={() => {
                    deleteProcedure()
                }}>
                מחק
            </Tremor.Button>
        </Tremor.DialogPanel>
    </Tremor.Dialog>
}

type LogView = {
    createdAt: Date,
    user: User | string,
    log: string,
    type: LogType,
    procedure: string | Procedure,
}

function LogsDialog({procedure, open, onClose}: {
    procedure?: Procedure,
    open: boolean,
    onClose: (val: boolean) => void
}) {
    const [logs, setLogs] = useState<LogView[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function buildLog(log: Log): Promise<LogView> {
            const user = await userRepo.findFirst({id: log.byUserId})
            const procedure = await procedureRepo.findFirst({id: log.procedureId})
            return {
                createdAt: log.createdAt,
                user: user?.name || log.byUserId,
                procedure: procedure || log.procedureId,
                log: log.log,
                type: log.type
            }
        }

        async function getLogs() {
            setLoading(true)
            if (!procedure) {
                const logs = await logRepo.find({orderBy: {createdAt: "desc"}, limit: 50})
                setLogs(await Promise.all(logs.map(buildLog)))
            } else {
                const logs = await logRepo.find({
                    where: {procedureId: procedure.id},
                    orderBy: {createdAt: "desc"},
                    limit: 50
                })
                setLogs(await Promise.all(logs.map(buildLog)))
            }
            setLoading(false)
        }

        getLogs()
    }, [procedure]);

    console.log(logs)

    return <Tremor.Dialog open={open} onClose={() => onClose(false)}>
        <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
            <CloseDialogButton close={() => onClose(false)}/>
            <Tremor.Text className={"text-lg font-bold"}>היסטורית שינויים</Tremor.Text>
            <Tremor.List>
                {loading && <Tremor.ListItem>
                    <Tremor.Text>טוען...</Tremor.Text>
                </Tremor.ListItem>}
                {logs.length === 0 && !loading && <Tremor.ListItem>
                    <Tremor.Text>לא נמצאו שינויים</Tremor.Text>
                </Tremor.ListItem>}
                {logs.map((log, i) => {
                    return <ListItem key={i} className={"text-start text-xs flex-row flex justify-start items-start"}>
                        <Icon
                            icon={getLogTypeIcon(log.type)}
                            color={getLogTypeColor(log.type)}
                        />
                        <Flex className={""} flexDirection={"col"} justifyContent={"start"} alignItems={"start"}>
                            <Text className={"text-xs opacity-75"}>
                                {log.createdAt.toLocaleString("he-IL")}
                                <span
                                    className={"font-semibold"}> | ע״י {typeof log.user === "string" ? log.user : log.user.name}</span>
                            </Text>
                            <span className={"font-mono"} dangerouslySetInnerHTML={{__html: log.log}}/>
                        </Flex>
                        {
                            typeof log.procedure === "object" && <Link href={`/?id=${log.procedure.id}`}>
                                <Tremor.Icon
                                    color={'indigo'}
                                    icon={RiCursorLine}
                                    className={"cursor-pointer"}
                                />
                            </Link>
                        }
                    </ListItem>

                })}
            </Tremor.List>
        </Tremor.DialogPanel>
    </Tremor.Dialog>
}


function AddPhoneNumberDialog({open, onClose, me}: { open: boolean, onClose: (val: boolean) => void, me: User }) {
    const [phone, setPhone] = useState<string>()

    const save = async () => {
        if (!phone || !me) return
        const p = parseInt(phone.replace(/^0/, ""))
        if (!p) return

        await userRepo.update(me.id!, {phone: p})
        onClose(false)
    }

    return <Tremor.Dialog open={open} onClose={() => onClose(false)}>
        <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
            <CloseDialogButton close={() => onClose(false)}/>
            <Tremor.TextInput
                placeholder={"מספר טלפון"}
                value={phone}
                onChange={e => {
                    setPhone(e.target.value)
                }}
            />
            <Tremor.Text className={"text-xs text-start self-start mb-1"}>
                יש להזין מספר טלפון על מנת להמשיך
            </Tremor.Text>
            <Tremor.Button
                onClick={() => {
                    save()
                }}>
                שמור
            </Tremor.Button>
        </Tremor.DialogPanel>
    </Tremor.Dialog>
}

function getLogTypeIcon(logType: LogType) {
    switch (logType) {
        case LogType.Created:
            return RiAddLine
        case LogType.Updated:
            return RiPencilLine
        case LogType.Deleted:
            return RiDeleteBinLine
        default:
            return RiChat1Line
    }
}

function getLogTypeColor(logType: LogType): Color {
    switch (logType) {
        case LogType.Created:
            return "green"
        case LogType.Updated:
            return "amber"
        case LogType.Deleted:
            return "red"
        default:
            return "blue"
    }
}
