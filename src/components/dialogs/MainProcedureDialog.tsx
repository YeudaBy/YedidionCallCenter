import {Procedure} from "@/model/Procedure";
import {useRouter} from "next/router";
import React, {useEffect, useRef, useState} from "react";
import autoAnimate from "@formkit/auto-animate";
import {District} from "@/model/District";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Flex, Icon, Text} from "@tremor/react";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {LoadingSpinner} from "@/components/Spinner";
import {highlightedText} from "@/utils/highlightedText";
import Image from "next/image";
import {User} from "@/model/User";
import {RiFileCopyLine, RiLink, RiPencilLine, RiWhatsappLine} from "@remixicon/react";
import {cx, extractYouTubeId} from "@/utils/ui";
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

export function MainProcedureDialog({procedure, open, onClose, onEdit}: {
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
                    <Tremor.Text className={"text-xl font-bold mb-2"}>{procedure.title}</Tremor.Text>
                    <Tremor.Text
                        className={"scrollable p-2 py-3 rounded-r-xl w-full bg-blue-50"}>
                        {highlightedText(procedure.procedure)}
                    </Tremor.Text>

                    {!!extractYouTubeId(procedure.youtubeUrl || "") && <div className={cx(
                        "w-full"
                    )}>
                        <LiteYouTubeEmbed
                            lazyLoad
                            title={procedure.title}
                            id={extractYouTubeId(procedure.youtubeUrl!)!}/>
                    </div>}

                    <Flex className={"gap-1.5 justify-start"}>
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

                    <Flex alignItems={"center"} justifyContent={"start"} className={"gap-2"}>
                        <Icon
                            icon={RiWhatsappLine}
                            size={"lg"}
                            className={"cursor-pointer border-2 border-tremor-brand"}
                            variant={"light"}
                            onClick={() => share(sharedText())}/>
                        <Icon
                            icon={RiFileCopyLine}
                            size={"lg"}
                            className={"cursor-pointer"}
                            variant={"outlined"}
                            onClick={() => copy(sharedText())}/>
                        <Icon
                            icon={RiLink}
                            size={"lg"}
                            className={"cursor-pointer"}
                            variant={"outlined"}
                            onClick={() => copy(location.href)}/>
                        {User.isSuperAdmin(remult) &&
                            <Icon
                                icon={RiPencilLine}
                                variant={"shadow"}
                                size={"lg"}
                                className={"cursor-pointer"}
                                onClick={() => onEdit(procedure)}/>
                        }
                    </Flex>

                    <Flex
                        className={"my-2 gap-1.5 flex-wrap"}
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
                </>
            }
        </Tremor.DialogPanel>
    </Tremor.Dialog>
}
