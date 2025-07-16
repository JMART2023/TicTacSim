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
  Filler
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler);

const FIXED_COLORS = ["#000000", "#2196f3", "#000000", "#4caf50", "#fb8c00", "#f44336"];

function generateCurveData(params, useP8 = true) {
  const result = [];
  const P4 = params.P4 ?? 6;
  const potValue = params.potValue ?? 15;
  const P7 = params.P7 ?? 8;
  const P16 = params.P16 ?? 2;
  const P8 = params.P8 ?? 8;

  const potNorm = potValue / 15;
  const sensitivity = Math.pow(potNorm, 2.7 - ((P16 - 1) * (2.2 / 14)));
  const multiplier = useP8 ? 0.8 + ((P8 - 1) * (0.4 / 14)) : 1;
  const powerFactor = (P4 / 15) * sensitivity * multiplier;

  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    let y = x;

    if (P7 < 8) y = Math.pow(x, 1 + 0.2 * (8 - P7));
    else if (P7 > 8) y = Math.pow(x, 1 / (1 + 0.2 * (P7 - 8)));

    result.push({ x: i, y: parseFloat((y * powerFactor * 12).toFixed(2)) });
  }

  return result;
}

export default function CurveChart({ profiles, selectedIndex, onLegendClick, useP8 }) {
  const datasets = profiles.map((profile, idx) => ({
    label: profile.nombre ?? `Config ${idx + 1}${idx === selectedIndex ? " (seleccionada)" : ""}`,
    data: generateCurveData(profile, useP8),
    borderColor: idx === selectedIndex ? "#000000" : FIXED_COLORS[idx % FIXED_COLORS.length],
    borderWidth: idx === selectedIndex ? 4 : 2,
    fill: false,
    tension: 0.2
  }));

  return (
    <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px" }}>
      <Line
        data={{
          labels: Array.from({ length: 101 }, (_, i) => `${i}%`),
          datasets
        }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: "top",
              labels: { color: "#000" },
              onClick: (_, legendItem) => {
                if (onLegendClick) onLegendClick(legendItem.datasetIndex);
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "#000" },
              title: {
                display: true,
                text: "Gatillo (%)",
                color: "#000",
              },
            },
            y: {
              min: 0,
              max: 12,
              ticks: { color: "#000" },
              title: {
                display: true,
                text: "Voltaje (V)",
                color: "#000",
              },
            },
          },
        }}
      />
    </div>
  );
}
