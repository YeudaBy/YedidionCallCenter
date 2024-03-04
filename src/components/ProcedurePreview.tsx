import {Card, Flex, Text} from "@tremor/react";
import Link from "next/link";
import {Procedure} from "@/model/Procedure";
import {highlightedText, plainText} from "@/utils/highlightedText";

export function ProcedurePreview({procedure}: {
    procedure: Procedure
}) {
    return <Link href={`/?id=${procedure.id}`} passHref>
        <Card className={"p-2 cursor-pointer w-full h-full"}>
            <Flex flexDirection={"col"} alignItems={"start"} className={"gap-2"}>
                <Text className={"font-bold text-xl text-start"}>{procedure.title}</Text>
                <Text className={"three-lines text-start text-xs opacity-80"}>
                    {plainText(procedure.procedure)}
                </Text>
            </Flex>
        </Card>
    </Link>
}
