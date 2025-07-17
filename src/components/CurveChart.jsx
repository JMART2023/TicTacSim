import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler);

const FIXED_COLORS = ["#000000", "#2196f3", "#4caf50", "#ff9800", "#f44336", "#9c27b0"];

function calculatePowerZone(P7) {
  const norm = (P7 - 1) / 14;
  const center = 0.2 + norm * 0.6;
  const width = 0.4;
  return {
    start: Math.max(0, center - width / 2),
    end: Math.min(1, center + width / 2),
    center,
  };
}

function generateCurveData(params, useP8, maxV) {
  const { P4 = 6, P5 = 4, P7 = 10, P8 = 8, P16 = 2, potValue = 15 } = params;
  const potNorm = potValue / 15;
  const sensitivity = Math.pow(potNorm, 2.7 - (P16 - 1) * (2.2 / 14));
  const powerFactor = (P4 / 15) * sensitivity;
  const accelFactor = 1 + ((P5 - 1) * 0.1) / 14;
  const multiplier = useP8 ? 0.6 + ((P8 - 1) * (0.8 / 14)) : 1;
  const zone = calculatePowerZone(P7);

  let data = Array.from({ length: 101 }, (_, i) => {
    const x = i / 100;
    let y = Math.pow(x, 1 / accelFactor);
    const dist = Math.abs(x - zone.center);
    const maxDist = zone.end - zone.start;
    const zoneEff = Math.max(0, 1 - (dist / maxDist) * 2);
    y *= 0.5 + zoneEff * 0.5 * potNorm;
    return {
      x: i,
      y: y * powerFactor * multiplier,
    };
  });

  // Escalado para que el máximo de la curva sea exactamente maxV
  const yEnd = data[data.length - 1].y;
  const scale = (yEnd === 0 ? 1 : (maxV / yEnd));
  return data.map(pt => ({ x: pt.x, y: parseFloat((pt.y * scale).toFixed(2)) }));
}

function generatePowerZoneData(P7, maxV) {
  const z = calculatePowerZone(P7);
  const s = Math.round(z.start * 100), e = Math.round(z.end * 100);
  return Array.from({ length: 101 }, (_, i) => ({
    x: i,
    y: (i >= s && i <= e) ? maxV : 0,
  }));
}

export default function CurveChart({
  profiles,
  selectedIndex,
  onLegendClick,
  useP8,
  showPowerZone = false,
  maxVoltage = 12,
}) {
  const datasets = profiles.map((p, idx) => ({
    label:
      (p.nombre || `Config ${idx + 1}${idx === selectedIndex ? " (seleccionada)" : ""}`),
    data: generateCurveData(p, useP8, maxVoltage),
    borderColor: idx === selectedIndex ? "#000000" : FIXED_COLORS[idx % FIXED_COLORS.length],
    borderWidth: idx === selectedIndex ? 4 : 2,
    fill: false,
    tension: 0.2,
    pointRadius: 0,
    pointHoverRadius: 5,
  }));

  if (showPowerZone && profiles.length) {
    const P7 = profiles[selectedIndex]?.P7 ?? profiles[0].P7;
    datasets.push({
      label: `Zona de Potencia P7=${P7}`,
      data: generatePowerZoneData(P7, maxVoltage),
      backgroundColor: "rgba(255,193,7,0.2)",
      borderColor: "rgba(255,193,7,0.5)",
      fill: true,
      borderWidth: 1,
      tension: 0,
      pointRadius: 0,
      pointHoverRadius: 0,
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", onClick: onLegendClick },
      tooltip: { mode: "index", intersect: false },
      beforeDraw: chart => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: { display: true, text: "Posición gatillo (%)" },
        min: 0,
        max: 100,
        grid: { color: "#e0e0e0" },
      },
      y: {
        title: { display: true, text: "Voltaje (V)" },
        min: 0,
        max: 16,
        grid: { color: "#e0e0e0" },
      },
    },
  };

  return (
    <div
      style={{
        height: "350px",
        backgroundColor: "#FFFFFF",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <Line data={{ datasets }} options={options} />
    </div>
  );
}
