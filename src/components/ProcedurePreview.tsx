import {Procedure} from "@/model/Procedure";
import {Card, Flex, Text} from "@tremor/react";
import {useState} from "react";
import Link from "next/link";

export function ProcedurePreview({procedure}: {
    procedure: Procedure
}) {
    return <Link href={`/procedure/${procedure.id}`}>
        <Card className={"p-2 cursor-pointer"}>
            <Flex flexDirection={"col"} alignItems={"start"} className={"gap-2"}>
                <Text className={"font-bold text-xl text-start"}>{procedure.title}</Text>
                <Text>{procedure.description}</Text>
            </Flex>
        </Card>
    </Link>
}
