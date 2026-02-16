import { Category } from "#@/model/Category.js";
import {LogType} from "@/model/Log";
import {RiAddLine, RiChat1Line, RiDeleteBinLine, RiPencilLine} from "@remixicon/react";
import {Color} from "@tremor/react/dist/lib/inputTypes";
import clsx, {ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";
import {Procedure} from "@/model/Procedure";
import {useEffect} from "react";

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

export function extractYouTubeId(url: string): string | null {
    try {
        const parsedUrl = new URL(url)

        // youtu.be/<id>
        if (parsedUrl.hostname === "youtu.be") {
            return parsedUrl.pathname.slice(1)
        }

        // youtube.com/watch?v=<id>
        if (parsedUrl.searchParams.has("v")) {
            return parsedUrl.searchParams.get("v")
        }

        // youtube.com/embed/<id>
        if (parsedUrl.pathname.includes("/embed/")) {
            return parsedUrl.pathname.split("/embed/")[1]
        }

        // youtube.com/shorts/<id>
        if (parsedUrl.pathname.includes("/shorts/")) {
            return parsedUrl.pathname.split("/shorts/")[1]
        }

        return null
    } catch {
        return null
    }
}


export interface CategoryNode extends Category {
    children: CategoryNode[];
    cleanProcedures: Procedure[];
}

export function buildTree(flatCategories: Category[]): CategoryNode[] {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    flatCategories.forEach(cat => {
        const cleanProcedures = cat.procedures?.map(pc => pc.procedure!) || [];

        map.set(cat.id, {
            ...cat,
            children: [],
            cleanProcedures
        });
    });

    flatCategories.forEach(cat => {
        const node = map.get(cat.id)!;
        if (cat.parentCategoryId && map.has(cat.parentCategoryId)) {
            map.get(cat.parentCategoryId)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}


export const useBlockRefresh = () => {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);
}
