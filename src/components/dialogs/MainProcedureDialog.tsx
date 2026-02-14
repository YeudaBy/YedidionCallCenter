import {Procedure} from "@/model/Procedure";
import React, {useEffect, useRef} from "react";
import autoAnimate from "@formkit/auto-animate";
import * as Tremor from "@tremor/react";
import {Text} from "@tremor/react";
import {LoadingSpinner} from "@/components/Spinner";
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import {ProcView} from "@/components/dialogs/ProcView";

export function MainProcedureDialog({procedure, open, onClose, onEdit}: {
    procedure: Procedure | true,
    open: boolean,
    onClose: (val: boolean) => void,
    onEdit: (procedure: Procedure) => void
}) {
    const dialogRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (dialogRef.current) autoAnimate(dialogRef.current)
    }, []);


    return <Tremor.Dialog
        open={open} className={"relative md:hidden"} onClose={() => onClose(false)}>
        <Tremor.DialogPanel
            ref={dialogRef}
            className={"gap-1.5 text-start flex items-center flex-col p-2 sm:p-3"}>
            {/*<CloseDialogButton close={() => onClose(false)}/>*/}
            {procedure == true ?
                <>
                    <LoadingSpinner className={"ml-4"}/>
                    <Text className={"text-3xl font-bold"}>טוען...</Text></>
                : <ProcView procedure={procedure} onEdit={onEdit} onClose={onClose}/>
            }
        </Tremor.DialogPanel>
    </Tremor.Dialog>
}
