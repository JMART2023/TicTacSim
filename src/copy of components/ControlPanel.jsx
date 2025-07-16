import React, { useState } from "react";
import ParameterSlider from "./ParameterSlider";
import CurveChart from "./CurveChart";
import ExportButton from "./ExportButton";
import PotDial from "./PotDial";

import {
  Box,
  Typography,
  Button,
  Grid,
  Divider,
  ToggleButton,
} from "@mui/material";

const INIT_PROFILE = {
  P1: 6,
  P4: 4,
  P5: 4,
  P7: 8,
  P8: 8,
  P10: 1,
  P11: 2,
  P14: 6,
  P15: 6,
  P16: 2,
  potValue: 15,
};

const FIXED_COLORS = [
  "#000000", "#2196f3", "#000000", "#4caf50", "#fb8c00", "#f44336"
];
const MAX_CURVES = 6;

const PARAM_EXPLANATIONS = {
  P4: "Límite máximo de voltaje que regula el potenciómetro.",
  P5: "Ajusta la respuesta de la aceleración.",
  P7: "Controla la forma de la curva de entrega.",
  P8: "Modifica la entrega al salir de una curva.",
  P10: "Usa el potenciómetro doble como freno o voltaje.",
  P11: "Activa el freno antes de soltar el gatillo.",
  P14: "Controla la velocidad a la que entra el freno.",
  P15: "Define el mínimo de freno siempre aplicado.",
  P16: "Ajusta la sensibilidad del potenciómetro.",
};

export default function ControlPanel() {
  const [profiles, setProfiles] = useState([]);
  const [config1, setConfig1] = useState({ ...INIT_PROFILE });
  const [visibility, setVisibility] = useState([true]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const getProfile = (idx) =>
    idx === 0 ? config1 : profiles[idx - 1];

  const handleChange = (param, value) => {
    if (selectedIndex === 0) {
      setConfig1((prev) => ({ ...prev, [param]: value }));
    } else {
      const updated = [...profiles];
      updated[selectedIndex - 1] = {
        ...updated[selectedIndex - 1],
        [param]: value,
      };
      setProfiles(updated);
    }
  };

  const addProfile = () => {
    if (profiles.length >= MAX_CURVES - 1) return;
    const newProfile = { ...getProfile(selectedIndex) };
    setProfiles((prev) => [...prev, newProfile]);
    setVisibility((prev) => [...prev, true]);
    setSelectedIndex(profiles.length + 1);
  };

  const toggleVisibility = (index) => {
    const updated = [...visibility];
    updated[index] = !updated[index];
    setVisibility(updated);
  };

  const reset = () => {
    setConfig1({ ...INIT_PROFILE });
    setProfiles([]);
    setVisibility([true]);
    setSelectedIndex(0);
  };

  const profilesToShow = [config1, ...profiles].filter((_, i) => visibility[i] !== false);

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", margin: "0 auto" }}>
      {/* Logo */}
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
        <img
          src="/tictac-logo.png"
          alt="Logo TICTAC"
          style={{ height: "60px", objectFit: "contain", marginLeft: 8 }}
        />
      </Box>

      {/* Recuadro de potenciómetros */}
      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: 2,
          p: 2,
          px: 3,
          mb: 3,
          maxWidth: 400,
          backgroundColor: "#f2f2f2", // gris claro para buen contraste
          color: "#000",
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          🎛 Diales del mando
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6}>
            <PotDial
              label="Freno"
              value={getProfile(selectedIndex).P1}
              onChange={(v) => handleChange("P1", v)}
            />
          </Grid>
          <Grid item xs={6}>
            <PotDial
              label="Voltaje"
              value={getProfile(selectedIndex).potValue}
              onChange={(v) => handleChange("potValue", v)}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Sliders por grupos */}
      <Grid container spacing={2}>
        {/* Izquierda: curva */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">⚙️ Parámetros de curva</Typography>
          {["P4", "P7", "P8", "P16"].map((param) => (
            <Box key={param} sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {PARAM_EXPLANATIONS[param]}
              </Typography>
              <ParameterSlider
                label={param}
                value={getProfile(selectedIndex)[param]}
                onChange={(v) => handleChange(param, v)}
              />
            </Box>
          ))}
        </Grid>

        {/* Derecha: resto */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">🔧 Parámetros adicionales</Typography>
          {["P5", "P10", "P11", "P14", "P15"].map((param) => (
            <Box key={param} sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {PARAM_EXPLANATIONS[param]}
              </Typography>
              <ParameterSlider
                label={param}
                value={getProfile(selectedIndex)[param]}
                onChange={(v) => handleChange(param, v)}
              />
            </Box>
          ))}
        </Grid>
      </Grid>

      {/* Botones */}
      <Box sx={{ my: 2 }}>
        <Button
          variant="contained"
          onClick={addProfile}
          disabled={profiles.length >= MAX_CURVES - 1}
          sx={{ mr: 2 }}
        >
          ➕ Nueva curva
        </Button>
        <Button variant="outlined" onClick={reset}>Reset</Button>
      </Box>

      {/* Chart */}
      <CurveChart
        profiles={profilesToShow}
        selectedIndex={selectedIndex}
        onLegendClick={(i) => setSelectedIndex(i)}
      />

      {/* Curvas activas */}
      <Typography variant="subtitle1" sx={{ mt: 3 }}>
        📊 Curvas activas
      </Typography>
      <Grid container spacing={1}>
        {[config1, ...profiles].map((_, i) => (
          <Grid item key={i}>
            <ToggleButton
              selected={visibility[i] !== false}
              onChange={() => toggleVisibility(i)}
              color={selectedIndex === i ? "primary" : "standard"}
            >
              {`Config ${i + 1} ${visibility[i] === false ? "Mostrar" : "Ocultar"}`}
            </ToggleButton>
          </Grid>
        ))}
      </Grid>

      {/* Exportar */}
      <ExportButton profiles={profilesToShow} />
    </Box>
  );
}
