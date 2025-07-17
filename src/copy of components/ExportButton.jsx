import React from "react";
import { Button } from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Función para calcular la zona de potencia según P7
const calculatePowerZone = (P7_value) => {
  const normalized_P7 = (P7_value - 1) / 14;
  const zone_center = 0.2 + (normalized_P7 * 0.6);
  const zone_width = 0.4;
  const zone_start = Math.max(0, zone_center - zone_width/2);
  const zone_end = Math.min(1, zone_center + zone_width/2);
  return { start: zone_start, end: zone_end, center: zone_center };
};

// CORREGIDO: Función que genera la curva con la implementación correcta de P7
const generateCurveData = (params, useP8 = true) => {
  const data = [];
  const P4 = params.P4 ?? 6;
  const P5 = params.P5 ?? 4;
  const P7 = params.P7 ?? 10;
  const P8 = params.P8 ?? 8;
  const P16 = params.P16 ?? 2;
  const potValue = params.potValue ?? 15;

  const potNorm = potValue / 15;
  const sensitivity = Math.pow(potNorm, 2.7 - ((P16 - 1) * (2.2 / 14)));
  const powerFactor = (P4 / 15) * sensitivity;
  const accelFactor = 1 + ((P5 - 1) * 0.1 / 14);
  const multiplier = useP8 ? 0.6 + ((P8 - 1) * (0.8 / 14)) : 1;

  const powerZone = calculatePowerZone(P7);

  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    let y = x;

    y = Math.pow(y, 1 / accelFactor);

    const distanceFromCenter = Math.abs(x - powerZone.center);
    const maxDistance = powerZone.end - powerZone.start;
    const zoneEffect = Math.max(0, 1 - (distanceFromCenter / maxDistance) * 2);
    
    const potEffect = 0.5 + (zoneEffect * 0.5 * potNorm);
    y *= potEffect;

    const finalValue = y * powerFactor * multiplier * 12;
    data.push(finalValue);
  }

  return data;
};

export default function ExportButton({ profiles }) {
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    profiles.forEach((profile, index) => {
      const curveData = generateCurveData(profile, true);
      const data = curveData.map((voltage, i) => ({
        Gatillo: `${i}%`,
        Voltaje: voltage.toFixed(2),
        P7_Zona: profile.P7 ?? 10,
        P4_Potencia: profile.P4 ?? 6,
        P8_Paso_Curva: profile.P8 ?? 8,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const sheetName = profile.nombre ?? `Config ${index + 1}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "tictac_curvas_corregido.xlsx");
  };

  return (
    <Button variant="contained" onClick={exportToExcel} sx={{ marginTop: 2 }}>
      📊 Exportar a Excel
    </Button>
  );
}
