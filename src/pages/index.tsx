import {useCallback, useEffect, useState} from "react";
import {Procedure, ProcedureType} from "@/model/Procedure";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Flex, Icon, Text} from "@tremor/react";
import {useRouter} from "next/router";
import {SearchIcon} from "@heroicons/react/solid";
import {LoadingBackdrop} from "@/components/Spinner";
import {ProcedurePreview} from "@/components/ProcedurePreview";
import {District} from "@/model/District";
import {User, UserRole} from "@/model/User";
import {
    RiAddLine,
    RiCloseLine,
    RiDeleteBinLine,
    RiEyeLine,
    RiEyeOffLine,
    RiFileDownloadLine,
    RiFileList3Fill,
    RiGroupLine,
    RiSortAlphabetAsc,
    RiSortAsc,
    RiUserLine
} from "@remixicon/react";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {exportToXLSX} from "@/utils/xlsx";
import {Log, LogType} from "@/model/Log";
import {Order} from "@/utils/types";
import {MainProcedureDialog} from "@/components/dialogs/MainProcedureDialog";
import {ProcedureEditorDialog} from "@/components/dialogs/ProcedureEditorDialog";
import {LogsDialog} from "@/components/dialogs/LogsDialog";
import Link from "next/link";

const procedureRepo = remult.repo(Procedure);
const userRepo = remult.repo(User);
const logRepo = remult.repo(Log);


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
    const [deleteMeOpen, setDeleteMeOpen] = useState<boolean>(false)

    const procedureTypeFilter = () => {
        return User.isAdmin(remult) ? {} : {type: ProcedureType.Procedure}
    }

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
                ...procedureTypeFilter()
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
                ...procedureTypeFilter()
            }
        }).then(procedures => {
            setResults(procedures)
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

            <Link href={"/me"}>
                <Tremor.Icon icon={RiUserLine} className={"cursor-pointer"}/>
            </Link>

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
            !!edited && <ProcedureEditorDialog
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
            !!current && <MainProcedureDialog
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




