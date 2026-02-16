import {Procedure, ProcedureType} from "@/model/Procedure";
import {useEffect, useState} from "react";
import {remult} from "remult";
import {District} from "@/model/District";
import {Log, LogType} from "@/model/Log";
import {diff} from "@/utils/diff";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {RiCloseFill, RiListCheck} from "@remixicon/react";
import * as Tremor from "@tremor/react";
import {Button, Flex, Icon, MultiSelect, Switch, TextInput} from "@tremor/react";
import {UserRole} from "@/model/User";
import Image from "next/image";
import {useRouter} from "next/router";
import {RoleGuard} from "@/components/auth/RoleGuard";
import {useBlockRefresh} from "@/utils/ui";

const procedureRepo = remult.repo(Procedure);
const logRepo = remult.repo(Log);

export function ProcedureEditorDialog({procedure, open, onClose, onAdd, onEdit, setOpenDelete}: {
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
    const [youtubeUrl, setYoutubeUrl] = useState<string | undefined>()

    const router = useRouter()
    useBlockRefresh()

    const goToLogs = () => {
        router.push(`/admin/logs?pid=${procedure?.id}`)
    }

    useEffect(() => {
        if (procedure) {
            setTitle(procedure.title)
            setContent(procedure.procedure)
            setKeywords(procedure.keywords)
            setActive(procedure.active)
            setType(procedure.type)
            setDistricts(procedure.districts)
            setImages(procedure.images)
            setYoutubeUrl(procedure.youtubeUrl)
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
                youtubeUrl: youtubeUrl
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
                youtubeUrl: youtubeUrl
            })
            for (const e1 of [
                diff(procedure.procedure, content || ""),
                diff(procedure.title, title || ""),
                diff(procedure.keywords.join(", "), keywords.join(", ") || ""),
                diff(procedure.type, type || ""),
                diff(procedure.districts.join(", "), districts.join(", ") || ""),
                diff(procedure.active.toString(), active.toString() || ""),
                diff(procedure.images.join(", "), images?.join(", ") || ""),
                diff(procedure.youtubeUrl || "", youtubeUrl || "")
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

    return <RoleGuard allowedRoles={[UserRole.SuperAdmin]}>
        <Tremor.Dialog open={open} onClose={(val) => onClose(val)}>
            <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
                <Flex className={"gap-1.5"}>
                    <CloseDialogButton close={() => onClose(false)}/>
                    <Icon icon={RiListCheck}
                          onClick={goToLogs}
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
                    // @ts-expect-error: Tremor typings are wrong for MultiSelect onChange
                    onChange={e => setDistricts(e)}
                >
                    {Object.values(District).map(value => {
                        return <Tremor.MultiSelectItem
                            key={value}
                            value={value}
                        >
                            {value}
                        </Tremor.MultiSelectItem>
                    })}
                </MultiSelect>
                <Tremor.Text className={"text-xs text-start self-start mb-1"}>
                    יש לבחור את המוקדים הרלוונטיים (במידה והנוהל ארצי - אין צורך לבחור את כולם, מספיק לסמן ״ארצי״)
                </Tremor.Text>

                <Tremor.Select
                    value={type}
                    placeholder={"בחר/י סוג:"}
                    // @ts-expect-error Tremor typings are wrong for Select onChange
                    onChange={e => setType(e)}
                >
                    <Tremor.SelectItem value={ProcedureType.Procedure}>נוהל</Tremor.SelectItem>
                    <Tremor.SelectItem value={ProcedureType.Guideline}>הנחיה</Tremor.SelectItem>
                </Tremor.Select>
                <Tremor.Text className={"text-xs text-start self-start mb-1"}>
                    הנחיה תוצג למוקדנים רגילים אך ורק דרך הבוט בוואצאפ. במידה ואינכם בטוחים - השאירו על נוהל.
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
                    {/*<UploadButton*/}
                    {/*    endpoint={"imageUploader"}*/}
                    {/*    className={"button:h-full"}*/}
                    {/*    onClientUploadComplete={url => setImages([...(images || []), ...url.map(e => e.url)])}*/}
                    {/*    content={{*/}
                    {/*        button({ready, isUploading, uploadProgress, fileTypes}) {*/}
                    {/*            return <p>*/}
                    {/*                {ready ? 'בחר קובץ' : isUploading ? `מעלה ${uploadProgress}%` : 'המשך'}*/}
                    {/*            </p>*/}
                    {/*        },*/}
                    {/*        allowedContent({fileTypes}) {*/}
                    {/*            return <></>*/}
                    {/*        }*/}
                    {/*    }}*/}
                    {/*/>*/}
                </Flex>

                <TextInput
                    value={youtubeUrl || ""}
                    placeholder={"הוסף קישור ליוטיוב (אופציונלי)"}
                    onValueChange={setYoutubeUrl}
                    type={"url"}
                />

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
    </RoleGuard>
}

