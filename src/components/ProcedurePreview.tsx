import {Procedure} from "@/model/Procedure";
import {Card, Flex, Text} from "@tremor/react";
import {useState} from "react";
import Link from "next/link";

export function ProcedurePreview({procedure}: {
    procedure: Procedure
}) {
    const [open, setOpen] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(procedure.procedure)
    }

    const shareToWhatsapp = () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(procedure.procedure)}`
        window.open(url, '_blank')
    }

    return <Link href={`/procedure/${procedure.id}`}>
        <Card className={"p-2 cursor-pointer"} onClick={() => setOpen(!open)}>
            <Flex flexDirection={"col"} alignItems={"start"} className={"gap-2"}>
                <Text className={"font-bold text-xl text-start"}>{procedure.title}</Text>
                <Text>{procedure.description}</Text>
            </Flex>
        </Card>
    </Link>
}
