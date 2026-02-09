import {LogType} from "@/model/Log";
import {RiAddLine, RiChat1Line, RiDeleteBinLine, RiPencilLine} from "@remixicon/react";
import {Color} from "@tremor/react/dist/lib/inputTypes";
import clsx, {ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

export function getLogTypeIcon(logType: LogType) {
    switch (logType) {
        case LogType.Created:
            return RiAddLine
        case LogType.Updated:
            return RiPencilLine
        case LogType.Deleted:
            return RiDeleteBinLine
        default:
            return RiChat1Line
    }
}

export function getLogTypeColor(logType: LogType): Color {
    switch (logType) {
        case LogType.Created:
            return "green"
        case LogType.Updated:
            return "amber"
        case LogType.Deleted:
            return "red"
        default:
            return "blue"
    }
}

export function cx(...args: ClassValue[]) {
    return twMerge(clsx(...args))
}


export const gradientBg = "bg-gradient-to-br from-white via-blue-50/50 to-green-50/50 --fixed-bg"
