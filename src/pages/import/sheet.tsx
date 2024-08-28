import {useEffect, useState} from "react";
// @ts-ignore
import * as XLSX from 'xlsx/xlsx.mjs';


export default function ImportSheet() {
  const [res, setRes] = useState<string>();

  useEffect(() => {
    fetch(url)
        .then((response) => response.text())
        .then((data) => {
            console.log(parseXLSX(data));
            setRes(data);
        });
  }, []);

  function parseXLSX(data: string) {
    const workbook = XLSX.read(data, {type: "binary"});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, {header: 1});
  }

  function parseCSV(data: string) {
    const rows = data.split("\n");
    const headers = rows[0].split(",");
    // take only A, B, D columns
    const columns = [0, 1, 3];
    const result = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(",");
      const obj = {};
      for (let j = 0; j < columns.length; j++) {
        // @ts-ignore
          obj[headers[columns[j]]] = row[columns[j]];
      }
      result.push(obj);
    }
    return result;
  }



  return (
    <div dangerouslySetInnerHTML={{__html: res || "loading"}}>
    </div>
  );
}


const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3gic39o7u8ovAJjfYC1KUMmDSmLCWmJUPt26Qmh-TIHKGU5WcNDImbn_Tvjx_KcjPAPK9LfRiFKij/pub?output=xlsx"
