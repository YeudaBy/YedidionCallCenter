import {remult} from "remult";
import {Procedure} from "@/model/Procedure";
import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {Badge, Card, Flex, Icon, Metric, Text} from "@tremor/react";
import {highlightedText} from "@/utils/highlightedText";
import {ClipboardCopyIcon} from "@heroicons/react/outline";
import {ShareIcon} from "@heroicons/react/solid";
import Link from "next/link";
import {Loading} from "@/components/Spinner";

const procedureRepo = remult.repo(Procedure);

export default function ProcedurePage() {
    const router = useRouter()
    const [procedure, setProcedure] = useState<Procedure>()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!router.query.id) return
        setLoading(true)

        procedureRepo.findFirst({
            id: router.query.id
        })
            .then(setProcedure)
            .finally(() => setLoading(false))

    }, [router.query.id]);

    useEffect(() => {
        if (!procedure) return
        Procedure.increaseViews(procedure.id)
    }, [procedure]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const shareToWhatsapp = () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(procedure?.procedure!)}`
        window.open(url, '_blank')
    }

    if (loading) return <Loading/>

    return <Flex flexDirection={"col"} alignItems={"start"} className={"p-4 gap-2 max-w-3xl m-auto"}>
        <Text className={"font-bold text-2xl md:text-5xl text-center w-full"}>{procedure?.title}</Text>
        <Text className={"text-center w-full md:text-xl text-lg mb-6"}>{procedure?.description}</Text>

        <Text
            onClick={() => copyToClipboard(procedure?.procedure || "")}
            className={"text-start md:text-xl text-lg w-full bg-gray-50 cursor-pointer rounded-xl" +
                " shadow-md shadow-amber-50 p-5"}>
            {highlightedText(procedure?.procedure || "")}
        </Text>

        <Flex alignItems={"center"} justifyContent={"center"} className={"gap-2 mt-4"}>
            <Icon
                icon={ClipboardCopyIcon}
                variant={"shadow"}
                color={"amber"}
                size={"lg"}
                className={"cursor-pointer"}
                onClick={() => copyToClipboard(procedure?.procedure || "")}
                tooltip={"העתק ללוח"}
            />
            <Icon
                icon={ShareIcon}
                variant={"shadow"}
                color={"amber"}
                size={"lg"}
                className={"cursor-pointer"}
                onClick={shareToWhatsapp}
                tooltip={"שתף בוואטסאפ"}
            />
        </Flex>

        <Flex justifyContent={"start"} alignItems={"center"} className={"gap-2 mt-10"}>
            <Text className={"font-semibold text-start text-lg"}>מילות מפתח:</Text>
            {
                procedure?.keywords.map((keyword, index) =>
                    <Link href={`/?q=${keyword}`} key={index}>
                        <Badge
                            color={"amber"}
                            size={"lg"}
                            className={"cursor-pointer"}
                            tooltip={"חפש על פי מילת מפתח"}
                        >
                            {keyword}
                        </Badge>
                    </Link>
                )
            }
        </Flex>
        <Text className={"text-start text-lg"}>
            👆 לחצו על מילת מפתח כדי למצוא נהלים קשורים.
        </Text>

        {/*<Text*/}
        {/*    className={"text-start text-lg mt-10 cursor-pointer text-blue-700 underline"}*/}
        {/*    onClick={() => copyToClipboard(window.location.href)}*/}
        {/*>*/}
        {/*    לחצו כאן על מנת להעתיק קישור ישיר לנוהל*/}
        {/*</Text>*/}

        <Flex className={"gap-2 mt-20"}>
            {(procedure?.views && procedure.views > 1) ? <Card className={"text-start"}>
                <Metric color={"amber"} className={"text-2xl"}>
                    {procedure.views}
                </Metric>
                <Text>
                    צפיות
                </Text>
            </Card> : null}

            <Card className={"text-start"}>
                <Metric color={"amber"} className={"text-2xl"}>
                    {formatDate(procedure?.createdAt)}
                </Metric>
                <Text>
                    נוצר ב
                </Text>
            </Card>
        </Flex>

    </Flex>
}

function formatDate(date: Date | undefined) {
    return date?.toLocaleString("en-US", {
        day: 'numeric',
        month: 'numeric',
        year: '2-digit',
    })
}
