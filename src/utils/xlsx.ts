import {read, utils, WorkBook, write} from 'xlsx';
import JSZip from "jszip";
import {Procedure} from "@/model/Procedure";

export const exportToXLSX = <T>(data: T[], filename: string) => {
    console.log(data);
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    const wbOut = write(wb, {bookType: 'xlsx', type: 'base64'});
    const zip = new JSZip();
    zip.file(filename + '.xlsx', wbOut, {base64: true});
    zip.generateAsync({type: 'nodebuffer'}).then((content) => {
        const a = document.createElement('a');
        document.body.appendChild(a);
        const blob = new Blob([content as unknown as ArrayBuffer], {type: 'application/octet-stream'});
        a.href = window.URL.createObjectURL(blob);
        a.download = filename + '.zip';
        a.click();
        document.body.removeChild(a);
    });
};

export const importFromXLSX = async <T>(file: File): Promise<T[]> => {
    const wb = await new Promise<WorkBook>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const wb = read(data, {type: 'array'});
            resolve(wb);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return utils.sheet_to_json(ws);
}


export function exportProceduresToXLSX(procedures: Array<Procedure>) {
    exportToXLSX(procedures?.map(p => ({
        "id": p.id,
        "כותרת": p.title,
        "תוכן": p.procedure,
        "פעיל": p.active ? "כן" : "לא",
        "סוג": p.type,
        "מוקדים": p.districts.join(", "),
        "תגיות": p.keywords.join(", "),
        "תמונות": p.images.join(", "),
        "נוצר": p.createdAt.toISOString(),
        "עודכן": p.updatedAt.toISOString(),
        "קישור לנוהל": `${window.location.origin}/?id=${p.id}`
    })) || [], "נהלים - מוקד")
}

export function importProceduresFromXLSX(file: File): Promise<Procedure[]> {
    return importFromXLSX<Procedure>(file).then(data => data.map(d => ({
        title: d["כותרת"],
        procedure: d["תוכן"],
        active: d["פעיל"] === "כן",
        type: d["סוג"],
        districts: d["מוקדים"] ? (d["מוקדים"] as string).split(",").map(s => s.trim()) : [],
        keywords: d["תגיות"] ? (d["תגיות"] as string).split(",").map(s => s.trim()) : [],
        images: d["תמונות"] ? (d["תמונות"] as string).split(",").map(s => s.trim()) : [],
        createdAt: d["נוצר"] ? new Date(d["נוצר"]) : new Date(),
        updatedAt: d["עודכן"] ? new Date(d["עודכן"]) : new Date(),
        id: d["id"] || undefined
    })));
}
