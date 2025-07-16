import React from "react";
import { Box, Typography, Slider } from "@mui/material";

const getDialAngle = (value) => {
  const minAngle = 30;
  const maxAngle = 330;
  const steps = 14;
  return minAngle + ((value - 1) / steps) * (maxAngle - minAngle);
};

export default function PotDial({ label, value, onChange }) {
  const angle = getDialAngle(value);
  const x = 40 + 25 * Math.cos((angle * Math.PI) / 180);
  const y = 40 + 25 * Math.sin((angle * Math.PI) / 180);

  return (
    <Box textAlign="center" sx={{ minWidth: 100 }}>
      <Typography fontWeight="bold">{`${label} – P${label === "Freno" ? 1 : 4}: ${value}`}</Typography>
      <svg width="80" height="80">
        <circle cx="40" cy="40" r="30" stroke="#ccc" strokeWidth="5" fill="white" />
        <line x1="40" y1="40" x2={x} y2={y} stroke="black" strokeWidth="4" />
      </svg>
      <Slider
        value={value}
        min={1}
        max={15}
        step={1}
        style={{ width: 80, marginTop: 16 }}
        onChange={(e, newVal) => onChange(newVal)}
      />
    </Box>
  );
}
