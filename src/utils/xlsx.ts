import {read, utils, WorkBook, write} from 'xlsx';
import JSZip from "jszip";

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
        const blob = new Blob([content], {type: 'application/octet-stream'});
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
