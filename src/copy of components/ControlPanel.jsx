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

// Valores iniciales (mapa por defecto = Mapa 2)
const INIT_PROFILE = {
  P1: 15,
  P4: 6,
  P5: 4,
  P7: 10,
  P8: 8,
  P10: 1,
  P11: 1,
  P14: 6,
  P15: 6,
  P16: 2,
  potValue: 15,
};

const MAPAS_PREDEFINIDOS = [
  { nombre: "Mapa 1", P1:15,P4:4,P5:4,P7:1,P8:8,P10:1,P11:2,P14:6,P15:6,P16:2,potValue:15 },
  { nombre: "Mapa 2", P1:15,P4:6,P5:4,P7:10,P8:8,P10:1,P11:1,P14:6,P15:6,P16:2,potValue:15 },
  { nombre: "Mapa 3", P1:15,P4:8,P5:4,P7:1,P8:10,P10:1,P11:2,P14:6,P15:6,P16:2,potValue:15 },
  { nombre: "Mapa 4", P1:15,P4:8,P5:4,P7:1,P8:10,P10:2,P11:1,P14:6,P15:6,P16:2,potValue:15 },
];

const PARAM_NAMES = {
  P4: "Potencia", P5: "Aceleración", P7: "Zona de Potencia",
  P8: "Paso por Curva", P10: "Pot. Multifunción", P11: "Anticipar Frenada",
  P14: "Velocidad Entrada Freno", P15: "Freno Mínimo", P16: "Sensibilidad Potencia",
};

const PARAM_EXPLANATIONS = {
  P4: "Límite máximo de voltaje de salida",
  P5: "Respuesta de aceleración del motor",
  P7: "Zona del gatillo donde actúa el potenciómetro",
  P8: "Entrega tras curva",
  P10: "Potenciómetro doble: freno o voltaje",
  P11: "Anticipación del frenado al soltar gatillo",
  P14: "Velocidad de entrada del freno",
  P15: "Nivel de freno mínimo constante",
  P16: "Sensibilidad del potenciómetro de potencia",
};

export default function ControlPanel() {
  const [profiles, setProfiles] = useState([]);
  const [config1, setConfig1] = useState({ ...INIT_PROFILE });
  const [visibility, setVisibility] = useState([true]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [useP8, setUseP8] = useState(true);

  const getProfile = i => i === 0 ? config1 : profiles[i - 1];
  const handleChange = (param, value) => {
    if (selectedIndex === 0) {
      setConfig1(prev => ({ ...prev, [param]: value }));
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
  const showMapasPredefinidos = () => {
    setProfiles(MAPAS_PREDEFINIDOS.map(m => ({ ...m })));
    setVisibility(Array(MAPAS_PREDEFINIDOS.length + 1).fill(true));
    setSelectedIndex(1);
  };
  const toggleVisibility = i => {
    const v = [...visibility]; v[i] = !v[i]; setVisibility(v);
  };

  const profilesToChart = [config1, ...profiles].filter((_, i) => visibility[i]);
  
  return (
    <Box sx={{ padding:2 }}>
      {/* Logo restaurado */}
      <Typography variant="h4" align="center" gutterBottom>
        ⚡ TICTAC V7 Simulator
      </Typography>

      <Typography variant="h5" gutterBottom>🎛 Diales del mando</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6}>
          <PotDial
            label="Freno"
            value={getProfile(selectedIndex).P1}
            onChange={v => handleChange("P1", v)}
          />
        </Grid>
        <Grid item xs={6}>
          <PotDial
            label="Potencia"
            value={getProfile(selectedIndex).potValue}
            onChange={v => handleChange("potValue", v)}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom>⚙️ Parámetros de curva</Typography>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          {["P4", "P7"].map(param => (
            <Box key={param} mb={2}>
              <Typography
                variant="body2"
                sx={{ color:"#FFFFFF", fontSize:"1rem" }}
              >
                <strong>
                  {param} ({getProfile(selectedIndex)[param]}) – {PARAM_NAMES[param]}
                </strong>
                {" – " + PARAM_EXPLANATIONS[param]}
              </Typography>
              <ParameterSlider
                label={param}
                value={getProfile(selectedIndex)[param]}
                onChange={v => handleChange(param, v)}
              />
            </Box>
          ))}
        </Grid>
        <Grid item xs={6}>
          {["P8", "P16"].map(param => (
            <Box key={param} mb={2}>
              <Typography
                variant="body2"
                sx={{ color:"#FFFFFF", fontSize:"1rem" }}
              >
                <strong>
                  {param} ({getProfile(selectedIndex)[param]}) – {PARAM_NAMES[param]}
                </strong>
                {" – " + PARAM_EXPLANATIONS[param]}
              </Typography>
              <ParameterSlider
                label={param}
                value={getProfile(selectedIndex)[param]}
                onChange={v => handleChange(param, v)}
              />
            </Box>
          ))}
        </Grid>
      </Grid>

      <FormControlLabel
        control={<Switch checked={useP8} onChange={() => setUseP8(!useP8)} />}
        label="Usar P8 (Paso por Curva)"
      />

      <Typography variant="h6" gutterBottom mt={2}>🔧 Parámetros adicionales</Typography>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          {["P5", "P10", "P14"].map(param => (
            <Box key={param} mb={2}>
              <Typography
                variant="body2"
                sx={{ color:"#FFFFFF", fontSize:"1rem" }}
              >
                <strong>
                  {param} ({getProfile(selectedIndex)[param]}) – {PARAM_NAMES[param]}
                </strong>
                {" – " + PARAM_EXPLANATIONS[param]}
              </Typography>
              <ParameterSlider
                label={param}
                value={getProfile(selectedIndex)[param]}
                onChange={v => handleChange(param, v)}
              />
            </Box>
          ))}
        </Grid>
        <Grid item xs={6}>
          {["P11", "P15"].map(param => (
            <Box key={param} mb={2}>
              <Typography
                variant="body2"
                sx={{ color:"#FFFFFF", fontSize:"1rem" }}
              >
                <strong>
                  {param} ({getProfile(selectedIndex)[param]}) – {PARAM_NAMES[param]}
                </strong>
                {" – " + PARAM_EXPLANATIONS[param]}
              </Typography>
              <ParameterSlider
                label={param}
                value={getProfile(selectedIndex)[param]}
                onChange={v => handleChange(param, v)}
              />
            </Box>
          ))}
        </Grid>
      </Grid>

      <Box sx={{ display:"flex", gap:2, my:2 }}>
        <Button variant="contained" onClick={addProfile}>➕ Nueva curva</Button>
        <Button variant="outlined" onClick={reset}>🔄 Reset</Button>
        <Button variant="outlined" onClick={showMapasPredefinidos}>📋 Mostrar mapas predefinidos</Button>
      </Box>

      <Typography variant="h6" gutterBottom>📊 Curvas activas</Typography>
      <Box sx={{ display:"flex", flexWrap:"wrap", gap:1, mb:2 }}>
        {[config1, ...profiles].map((p,i) => (
          <ToggleButton
            key={i}
            value={i}
            selected={visibility[i]}
            onChange={() => toggleVisibility(i)}
            color={selectedIndex===i?"primary":"standard"}
            onClick={() => setSelectedIndex(i)}
          >
            {p.nombre||`Config ${i+1}`}
          </ToggleButton>
        ))}
      </Box>

      <CurveChart
        profiles={profilesToChart}
        selectedIndex={selectedIndex}
        useP8={useP8}
        showPowerZone={true}
      />

      <ExportButton profiles={profilesToChart} />
    </Box>
  );
}
