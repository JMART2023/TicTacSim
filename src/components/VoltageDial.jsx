// VoltageDial.jsx
import React from "react";
import { Box, Typography, Slider } from "@mui/material";

export default function VoltageDial({ label, value, min, max, step, onChange }) {
  return (
    <Box textAlign="center">
      <Typography variant="body1" sx={{ color: "#fff", mb: 1, fontSize: "1.1rem" }}>
        {label}: {value.toFixed(1)}V
      </Typography>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_, v) => onChange(v)}
        sx={{ color: "#29b6f6" }}
      />
    </Box>
  );
}
