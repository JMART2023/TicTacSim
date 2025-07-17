// ExportButton.jsx
import React from "react";
import { Button } from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const calculatePowerZone = P7 => {
  const norm = (P7 - 1) / 14;
  const center = 0.2 + norm * 0.6;
  const width = 0.4;
  return { start: Math.max(0, center - width / 2), end: Math.min(1, center + width / 2) };
};

const generateCurveData = (params, useP8, maxV) => {
  const { P4 = 6, P5 = 4, P7 = 10, P8 = 8, P16 = 2, potValue = 15 } = params;
  const potNorm = potValue / 15;
  const sensitivity = Math.pow(potNorm, 2.7 - (P16 - 1) * (2.2 / 14));
  const powerFactor = (P4 / 15) * sensitivity;
  const accelFactor = 1 + ((P5 - 1) * 0.1) / 14;
  const multiplier = useP8 ? 0.6 + ((P8 - 1) * (0.8 / 14)) : 1;
  const zone = calculatePowerZone(P7);

  return Array.from({ length: 101 }, (_, i) => {
    const x = i / 100;
    let y = Math.pow(x, 1 / accelFactor);
    const dist = Math.abs(x - zone.center);
    const maxDist = zone.end - zone.start;
    const zoneEff = Math.max(0, 1 - (dist / maxDist) * 2);
    y *= 0.5 + zoneEff * 0.5 * potNorm;
    return parseFloat((y * powerFactor * multiplier * maxV).toFixed(2));
  });
};

export default function ExportButton({ profiles, maxVoltage }) {
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    profiles.forEach((profile, idx) => {
      const data = generateCurveData(profile, true, maxVoltage).map((v, i) => ({
        Gatillo: `${i}%`,
        Voltaje: v,
        P7_Zona: profile.P7,
        P4_Potencia: profile.P4,
        P8_Paso_Curva: profile.P8,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, profile.nombre || `Config ${idx + 1}`);
    });
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "tictac_curvas.xlsx");
  };

  return (
    <Button variant="contained" onClick={exportToExcel} sx={{ mt: 2 }}>
      📊 Exportar a Excel
    </Button>
  );
}
