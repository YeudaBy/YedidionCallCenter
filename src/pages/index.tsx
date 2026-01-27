import {ReactNode, useCallback, useEffect, useState} from "react";
import {Procedure, ProcedureType} from "@/model/Procedure";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {useRouter} from "next/router";
import {LoadingBackdrop} from "@/components/Spinner";
import {ProcedurePreview} from "@/components/ProcedurePreview";
import {District} from "@/model/District";
import {User, UserRole} from "@/model/User";
import {RiDeleteBinLine} from "@remixicon/react";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {exportProceduresToXLSX} from "@/utils/xlsx";
import {Log, LogType} from "@/model/Log";
import {Order} from "@/utils/types";
import {MainProcedureDialog} from "@/components/dialogs/MainProcedureDialog";
import {ProcedureEditorDialog} from "@/components/dialogs/ProcedureEditorDialog";
import {LogsDialog} from "@/components/dialogs/LogsDialog";
import {SearchBox} from "@/components/index-page/SearchBox";
import {IndexHeader} from "@/components/index-page/IndexHeader";
import {DistrictSelector} from "@/components/index-page/DistrictSelector";

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
    const [showInactive, setShowInactive] = useState(false)
    const [inactives, setInactives] = useState<Procedure[]>()
    const [order, setOrder] = useState<Order>(Order.Recent)
    const [logsOpen, setLogsOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState<Procedure>()


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
        <IndexHeader
            setShowInactive={setShowInactive}
            showInactive={showInactive}
            exportProceduresToXLSX={() => exportProceduresToXLSX(procedures || [])}
            openCreateModal={() => setEdited(true)}
            setLogsOpen={setLogsOpen}
        />

        {
            loading && <LoadingBackdrop/>
        }

        <SearchBox query={query} setQuery={setQuery} setResults={setResults}/>

        <DistrictSelector
            allowedDistricts={allowedDistricts}
            selectedDistrict={district}
            setDistrict={setDistrict}
            order={order}
            setOrder={setOrder}
            />

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
            !!deleteOpen && <DeleteDialog
                procedure={deleteOpen}
                onClose={() => setDeleteOpen(undefined)}
                onDelete={deleteProcedure}
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




