import React from "react";
import { Slider, Typography, Box } from "@mui/material";

export default function ParameterSlider({ label, value, onChange, min = 1, max = 15 }) {
  return (
    <Box mb={2}>
      <Typography variant="body2">
        {label}: {value}
      </Typography>
      <Slider
        value={value}
        onChange={(e, newVal) => onChange(newVal)}
        min={min}
        max={max}
        step={1}
        marks
        valueLabelDisplay="auto"
      />
    </Box>
  );
}
