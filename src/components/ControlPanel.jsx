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
  ToggleButton,
  FormControlLabel,
  Switch,
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

const MAPAS_PREDEFINIDOS = [
  {
    nombre: "Mapa 1",
    P1: 6, P4: 7, P5: 4, P7: 8, P8: 7, P10: 1,
    P11: 1, P14: 6, P15: 6, P16: 8, potValue: 15,
  },
  {
    nombre: "Mapa 2",
    P1: 6, P4: 9, P5: 5, P7: 9, P8: 9, P10: 1,
    P11: 2, P14: 7, P15: 6, P16: 10, potValue: 15,
  },
  {
    nombre: "Mapa 3",
    P1: 6, P4: 12, P5: 7, P7: 12, P8: 12, P10: 1,
    P11: 3, P14: 8, P15: 8, P16: 12, potValue: 15,
  },
  {
    nombre: "Mapa 4",
    P1: 6, P4: 15, P5: 9, P7: 15, P8: 15, P10: 1,
    P11: 4, P14: 9, P15: 9, P16: 15, potValue: 15,
  }
];

const PARAM_EXPLANATIONS = {
  P4: "Límite máximo de voltaje.",
  P5: "Respuesta de aceleración.",
  P7: "Forma de la curva.",
  P8: "Entrega tras curva.",
  P10: "Pot. doble freno o voltaje.",
  P11: "Anticipa el freno.",
  P14: "Velocidad de entrada del freno.",
  P15: "Freno mínimo constante.",
  P16: "Sensibilidad del potenciómetro.",
};

export default function ControlPanel() {
  const [profiles, setProfiles] = useState([]);
  const [config1, setConfig1] = useState({ ...INIT_PROFILE });
  const [visibility, setVisibility] = useState([true]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [useP8, setUseP8] = useState(true);

  const getProfile = (i) => (i === 0 ? config1 : profiles[i - 1]);

  const handleChange = (param, value) => {
    if (selectedIndex === 0) {
      setConfig1((prev) => ({ ...prev, [param]: value }));
    } else {
      const updated = [...profiles];
      updated[selectedIndex - 1] = { ...updated[selectedIndex - 1], [param]: value };
      setProfiles(updated);
    }
  };

  const addProfile = () => {
    if (profiles.length >= 5) return;
    const newProfile = { ...getProfile(selectedIndex) };
    setProfiles([...profiles, newProfile]);
    setVisibility([...visibility, true]);
    setSelectedIndex(profiles.length + 1);
  };

  const reset = () => {
    setConfig1({ ...INIT_PROFILE });
    setProfiles([]);
    setVisibility([true]);
    setSelectedIndex(0);
  };

  const toggleVisibility = (index) => {
    const updated = [...visibility];
    updated[index] = !updated[index];
    setVisibility(updated);
  };

  const showMapasPredefinidos = () => {
    const mapaPerfiles = MAPAS_PREDEFINIDOS.map((mapa) => ({ ...mapa }));
    setProfiles(mapaPerfiles);
    setVisibility(Array(mapaPerfiles.length + 1).fill(true));
    setSelectedIndex(1);
  };

  const profilesToChart = [config1, ...profiles].filter((_, i) => visibility[i] !== false);
  const names = ["Config 1", ...profiles.map(p => p.nombre ?? `Config ${profiles.indexOf(p) + 2}`)];

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
        <img src="/tictac-logo.png" alt="Logo TICTAC" style={{ height: "60px", marginLeft: 8 }} />
      </Box>

      <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2, px: 3, mb: 3, maxWidth: 400, backgroundColor: "#f2f2f2" }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>🎛 Diales del mando</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <PotDial label="Freno" value={getProfile(selectedIndex).P1} onChange={(v) => handleChange("P1", v)} />
          </Grid>
          <Grid item xs={6}>
            <PotDial label="Voltaje" value={getProfile(selectedIndex).potValue} onChange={(v) => handleChange("potValue", v)} />
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">⚙️ Parámetros de curva</Typography>
          {["P4", "P7", "P8", "P16"].map((param) => (
            <Box key={param} sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>{PARAM_EXPLANATIONS[param]}</Typography>
              <ParameterSlider label={param} value={getProfile(selectedIndex)[param]} onChange={(v) => handleChange(param, v)} />
            </Box>
          ))}
          <FormControlLabel control={<Switch checked={useP8} onChange={() => setUseP8(!useP8)} />} label="Usar P8" />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">🔧 Parámetros adicionales</Typography>
          {["P5", "P10", "P11", "P14", "P15"].map((param) => (
            <Box key={param} sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>{PARAM_EXPLANATIONS[param]}</Typography>
              <ParameterSlider label={param} value={getProfile(selectedIndex)[param]} onChange={(v) => handleChange(param, v)} />
            </Box>
          ))}
        </Grid>
      </Grid>

      <Box sx={{ my: 2 }}>
        <Button variant="contained" sx={{ mr: 2 }} onClick={addProfile}>➕ Nueva curva</Button>
        <Button variant="outlined" sx={{ mr: 2 }} onClick={reset}>Reset</Button>
        <Button variant="outlined" onClick={showMapasPredefinidos}>Mostrar mapas predefinidos</Button>
      </Box>

      <CurveChart
        profiles={profilesToChart}
        selectedIndex={selectedIndex}
        onLegendClick={setSelectedIndex}
        useP8={useP8}
      />

      <Typography variant="subtitle1" sx={{ mt: 3 }}>📊 Curvas activas</Typography>
      <Grid container spacing={1}>
        {[config1, ...profiles].map((profile, i) => (
          <Grid item key={i}>
            <ToggleButton
              selected={visibility[i]}
              onChange={() => toggleVisibility(i)}
              color={selectedIndex === i ? "primary" : "standard"}
            >
              {profile.nombre ?? `Config ${i + 1}`}
            </ToggleButton>
          </Grid>
        ))}
      </Grid>

      <ExportButton profiles={profilesToChart} />
    </Box>
  );
}
