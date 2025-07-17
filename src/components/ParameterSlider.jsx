// ParameterSlider.jsx
import React from "react";
import { Box, Slider } from "@mui/material";

export default function ParameterSlider({ label, value, onChange }) {
  return (
    <Box>
      <Slider
        value={value}
        min={1}
        max={15}
        step={1}
        onChange={(_, v) => onChange(v)}
        sx={{ color: "#29b6f6" }}
      />
    </Box>
  );
}
