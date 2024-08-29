import {Card, Flex, Text} from "@tremor/react";
import Link from "next/link";
import {Procedure} from "@/model/Procedure";
import {highlightedText, plainText} from "@/utils/highlightedText";
import {User} from "@/model/User";
import {remult} from "remult";

export function ProcedurePreview({procedure}: {
    procedure: Procedure
}) {
        return <Link href={(procedure.active || User.isAdmin(remult)) ? `/?id=${procedure.id}` : ""} passHref>
        <Card className={`p-2 cursor-pointer w-full h-full ${
            procedure.active ? "" : "bg-primary-100 cursor-not-allowed border-dashed border-2"
        }`}>
            <Flex flexDirection={"col"} alignItems={"start"} className={"gap-2"}>
                <Text className={"font-bold text-xl text-start"}>
                    {procedure.title}
                    {!procedure.active && <span className={"text-xs text-primary-500"}>
                        {" (לא פעיל)"}
                    </span>}
                </Text>
                {procedure.active && <Text className={"three-lines text-start text-xs opacity-80"}>
                    {plainText(procedure.procedure)}
                </Text>}
            </Flex>
        </Card>
    </Link>
}
