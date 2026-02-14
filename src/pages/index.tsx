import React, {useCallback, useEffect, useState} from "react";
import {Procedure} from "@/model/Procedure";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Button, Flex, Grid} from "@tremor/react";
import {useRouter} from "next/router";
import {LoadingBackdrop} from "@/components/Spinner";
import {ProcedurePreview} from "@/components/ProcedurePreview";
import {District} from "@/model/District";
import {User} from "@/model/User";
import {RiCarouselView, RiDeleteBinLine, RiSortAlphabetAsc, RiSortAsc, RiStackedView} from "@remixicon/react";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {Log, LogType} from "@/model/Log";
import {Order} from "@/utils/types";
import {ProcedureEditorDialog} from "@/components/dialogs/ProcedureEditorDialog";
import {SearchBox} from "@/components/index-page/SearchBox";
import {IndexHeader} from "@/components/index-page/IndexHeader";
import {DistrictSelector} from "@/components/index-page/DistrictSelector";
import {useAnalytics} from "@/firebase-messages/init";
import {NodeMenu} from "@/components/node/NodeMenu";
import {ProcView} from "@/components/dialogs/ProcView";
import {MainProcedureDialog} from "@/components/dialogs/MainProcedureDialog";

const procedureRepo = remult.repo(Procedure);
const userRepo = remult.repo(User);
const logRepo = remult.repo(Log);


const MD_VIEW = "768px"


export default function IndexPage() {
    const [procedures, setProcedures] = useState<Procedure[]>()
    const [searchResult, setSearchResult] = useState<Procedure[]>()
    const [query, setQuery] = useState<string>()
    const [loading, setLoading] = useState(false)
    const [current, setCurrent] = useState<Procedure | undefined>()
    const [edited, setEdited] = useState<Procedure | true | undefined>()
    const [district, setDistrict] = useState<District | "All">("All")
    const [allowedDistricts, setAllowedDistricts] = useState<District[]>([District.General])
    const [showInactive, setShowInactive] = useState(false)
    const [order, setOrder] = useState<Order>(Order.Recent)
    const [deleteOpen, setDeleteOpen] = useState<Procedure>()
    const [dense, setDense] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < parseInt(MD_VIEW))
        }
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, []);

    useAnalytics()

    const procedureTypeFilter = () => {
        return (User.isAdmin(remult) && showInactive) ? {} : {active: true}
    }

    useEffect(() => {
        if (!order) setOrder(Order.Recent)
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
        setLoading(true)
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
    }, [district, showInactive]);

    useEffect(() => {
        if (!query) return
        setCurrent(undefined)
        procedureRepo.find({
            where: {
                $or: [
                    {
                        title: {
                            $contains: query
                        }
                    },
                    {
                        keywords: {
                            $contains: query
                        }
                    }
                ],
                ...procedureTypeFilter()
            }
        }).then(procedures => {
            setSearchResult(procedures)
        })
    }, [query]);

    const addNew = useCallback((newProcedure: Procedure) => {
        setProcedures([...procedures || [], newProcedure])
    }, [procedures]);

    const editProcedure = useCallback((editedProcedure: Procedure) => {
        setProcedures(procedures?.map(p => p.id === editedProcedure.id ? editedProcedure : p))
    }, [procedures]);

    const deleteProcedure = useCallback((deletedProcedureId: string) => {
        setProcedures(procedures?.filter(p => p.id !== deletedProcedureId))
    }, [procedures]);

    const handleProcedureSelect = (procedureId: string) => {
        console.log("Selected procedure ID:", procedureId);
        router.push(`/?id=${procedureId}`)
    }

    return <div className={`m-auto`}>
        <IndexHeader
            setShowInactive={setShowInactive}
            showInactive={showInactive}
            openCreateModal={() => setEdited(true)}
        />

        {
            loading && <LoadingBackdrop/>
        }

        <Flex className={"p-4 flex-col"}>
            <Flex className={"justify-between items-center gap-2"}>
                <SearchBox query={query} setQuery={setQuery} setResults={setSearchResult}/>
                <Flex className={"gap-2 justify-start items-center my-2"}>
                    <Button icon={dense ? RiStackedView : RiCarouselView}
                            variant={"light"} className={"gap-2"}
                            onClick={() => setDense(d => !d)}>
                        {!dense ? "דחוס" : "רגיל"}
                    </Button>
                    <Button
                        icon={order === Order.Recent ? RiSortAlphabetAsc : RiSortAsc}
                        className={"cursor-pointer gap-2"} variant={"light"}
                        onClick={() => {
                            setOrder(order === Order.Recent ? Order.Alphabetical : Order.Recent)
                        }}
                    >
                        {order === Order.Recent ? "א״ב" : "חדשים"}
                    </Button>
                </Flex>
                {!isMobile && <DistrictSelector
                    allowedDistricts={allowedDistricts}
                    selectedDistrict={district}
                    setDistrict={setDistrict}
                />}
            </Flex>


            {isMobile && <DistrictSelector
                allowedDistricts={allowedDistricts}
                selectedDistrict={district}
                setDistrict={setDistrict}
            />}

            {
                isMobile ?

                    <Flex className={"gap-4 flex-col justify-start items-start"}>

                        <div className={"w-full"}>
                            <NodeMenu onProcedureSelect={handleProcedureSelect}/>
                        </div>

                        <div className={"grow"}>
                            <Tremor.Grid className={"gap-2 w-full"} numItems={dense ? 2 : 1} numItemsSm={dense ? 3 : 2}
                                         numItemsLg={dense ? 5 : 3}>
                                {!query ? procedures?.map(procedure => {
                                    return <ProcedurePreview dense={dense} procedure={procedure} key={procedure.id}/>
                                }) : searchResult?.map(procedure => {
                                    return <ProcedurePreview dense={dense} procedure={procedure} key={procedure.id}/>
                                })}
                            </Tremor.Grid>

                            {
                                !!current && <MainProcedureDialog
                                    procedure={current}
                                    open={true}
                                    onClose={() => {
                                        setCurrent(undefined)
                                        router.push('/')
                                    }}
                                    onEdit={(procedure) => setEdited(procedure)}
                                />
                            }
                        </div>

                    </Flex>
                    :
                    <Flex className={"grow items-start justify-start gap-4 p-2"}>
                        <div className={"w-1/5"}>
                            <NodeMenu onProcedureSelect={handleProcedureSelect}/>
                        </div>
                        <div className={"grow w-4/5"}>
                            {
                                current ? <ProcView
                                        procedure={current}
                                        onClose={() => {
                                            setCurrent(undefined)
                                            router.push('/')
                                        }}
                                        onEdit={(procedure) => setEdited(procedure)}
                                    /> :
                                    <Grid className={"gap-2"}
                                          numItems={dense ? 2 : 1}
                                          numItemsSm={dense ? 3 : 2}
                                          numItemsLg={dense ? 5 : 3}>
                                        {!query ? procedures?.map(procedure => {
                                            return <ProcedurePreview dense={dense} procedure={procedure}
                                                                     key={procedure.id}/>
                                        }) : searchResult?.map(procedure => {
                                            return <ProcedurePreview dense={dense} procedure={procedure}
                                                                     key={procedure.id}/>
                                        })}
                                    </Grid>
                            }
                        </div>
                    </Flex>
            }
        </Flex>

        {
            !!edited && <ProcedureEditorDialog
                open={true}
                procedure={edited === true ? undefined : edited}
                onAdd={addNew}
                onEdit={editProcedure}
                setOpenDelete={setDeleteOpen}
                onClose={() => {
                    setEdited(undefined)
                    setEdited(undefined)
                    router.push('/')
                }}/>
        }
        {
            !!deleteOpen && <DeleteDialog
                procedure={deleteOpen}
                onClose={() => setDeleteOpen(undefined)}
                onDelete={deleteProcedure}
            />
        }
    </div>
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




