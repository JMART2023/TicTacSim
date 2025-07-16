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

function generateCurveData(params) {
  const result = [];
  const P4 = params.P4 ?? 6;
  const potValue = params.potValue ?? 15;
  const shape = params.P7 ?? 8;
  const range = (P4 / 15) * (potValue / 15);

  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    let y = x;
    if (shape < 8) y = Math.pow(x, 1 + 0.2 * (8 - shape));
    else if (shape > 8) y = Math.pow(x, 1 / (1 + 0.2 * (shape - 8)));
    y *= range * 12;
    result.push({ x: i, y: parseFloat(y.toFixed(2)) });
  }

  return result;
}

export default function CurveChart({ profiles, selectedIndex, onLegendClick }) {
  const datasets = profiles.map((profile, idx) => ({
    label: `Config ${idx + 1}${idx === selectedIndex ? " (seleccionada)" : ""}`,
    data: generateCurveData(profile),
    borderColor: idx === selectedIndex ? "#000000" : FIXED_COLORS[idx % FIXED_COLORS.length],
    borderWidth: idx === selectedIndex ? 4 : 2,
    fill: false,
    tension: 0.2,
  }));

  return (
    <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "8px" }}>
      <Line
        data={{
          labels: Array.from({ length: 101 }, (_, i) => `${i}%`),
          datasets,
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
          layout: {
            padding: 20,
          },
          scales: {
            x: {
              ticks: { color: "#000" },
              title: { display: true, text: "Gatillo (%)", color: "#000" },
            },
            y: {
              min: 0,
              max: 12,
              ticks: { color: "#000" },
              title: { display: true, text: "Voltaje (V)", color: "#000" },
            },
          },
        }}
      />
    </div>
  );
}
