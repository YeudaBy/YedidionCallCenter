import {Procedure} from "@/model/Procedure";
import {useRouter} from "next/router";
import React, {useEffect, useState} from "react";
import {District} from "@/model/District";
import * as Tremor from "@tremor/react";
import {Flex, Icon} from "@tremor/react";
import {highlightedText} from "@/utils/highlightedText";
import {cx, extractYouTubeId} from "@/utils/ui";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import Image from "next/image";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {RiBookMarkedLine, RiCloseLine, RiFileCopyLine, RiLink, RiPencilLine, RiWhatsappLine} from "@remixicon/react";
import {User} from "@/model/User";
import {remult, repo} from "remult";
import {toast} from "sonner";


export type ProcViewProps = {
    procedure: Procedure;
    onEdit: (proc: Procedure) => void;
    onClose?: (val: boolean) => void;
}

export function ProcView({procedure, onEdit, onClose}: ProcViewProps) {
    const router = useRouter()

    const [selectedImage, setSelectedImage] = useState<string>()

    const copy = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("הטקסט הועתק ללוח")
    }

    const share = (text: string) => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
        toast.success("נפתח בוואטסאפ")
    }

    const search = (text: string) => {
        onClose?.(false)
        router.push(`/?search=${text}`)
    }

    const district = (district: District) => {
        onClose?.(false)
        router.push(`/?d=${district}`)
    }

    if (!procedure) return <></>

    const sharedText = () => {
        if (typeof procedure !== "object") return ""
        return `*מוקד ארצי - ${procedure.title}*:\n\n${procedure.procedure}\n\n${window.location.href}`
    }
    return (
        <Flex className={"flex-col gap-2 relative"}>
            <Icon icon={RiCloseLine}
                  size={"sm"}
                  className={"cursor-pointer absolute top-0 right-0"}
                  variant={"light"}
                  onClick={() => onClose?.(false)}/>
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
        </Flex>
    )

}
