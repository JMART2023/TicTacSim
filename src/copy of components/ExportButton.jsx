import React from "react";
import { Button } from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ExportButton({ profiles }) {
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    profiles.forEach((profile, index) => {
      const data = [];

      const P4 = profile.P4 ?? 6;
      const potValue = profile.potValue ?? 15;
      const range = (P4 / 15) * (potValue / 15);
      const shape = profile.P7 ?? 8;

      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        let y = x;

        if (shape < 8) y = Math.pow(x, 1 + 0.2 * (8 - shape));
        else if (shape > 8) y = Math.pow(x, 1 / (1 + 0.2 * (shape - 8)));

        y *= range * 12;

        data.push({ Gatillo: `${i}%`, Voltaje: y.toFixed(2) });
      }

      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, `Config ${index + 1}`);
    });

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "tictac_curvas.xlsx");
  };

  return <Button variant="contained" onClick={exportToExcel}>Exportar a Excel</Button>;
}
