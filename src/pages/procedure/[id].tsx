import {remult} from "remult";
import {Procedure} from "@/model/Procedure";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {Button, Flex, Icon, Text} from "@tremor/react";
import {highlightedText} from "@/utils/highlightedText";
import {ClipboardCopyIcon} from "@heroicons/react/outline";

const procedureRepo = remult.repo(Procedure);

export default function ProcedurePage() {
    const router = useRouter()
    const [procedure, setProcedure] = useState<Procedure>()

    useEffect(() => {
        if (!router.query.id) return

        procedureRepo.findFirst({
            id: router.query.id
        }).then(setProcedure)

    }, [router.query.id]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(procedure?.procedure || "")
    }

    const shareToWhatsapp = () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(procedure?.procedure!)}`
        window.open(url, '_blank')
    }

    return <Flex flexDirection={"col"} alignItems={"start"} className={"p-4 gap-2"}>
        <Text className={"font-bold text-2xl text-center w-full"}>{procedure?.title}</Text>
        <Text className={"text-center w-full mb-6"}>{procedure?.description}</Text>

        <Text className={"text-start w-full bg-white rounded-3xl shadow-md p-5"}>
            {highlightedText(procedure?.procedure || "")}
        </Text>

        <Icon
            icon={ClipboardCopyIcon}
            variant={"light"}
        />

        <Text className={"font-semibold text-start text-lg"}>מילות מפתח</Text>
        <Text className={"text-start"}>{procedure?.keywords.join(", ")}</Text>
    </Flex>
}
