import React, { useState } from "react";
import ParameterSlider from "./ParameterSlider";
import CurveChart from "./CurveChart";
import ExportButton from "./ExportButton";
import PotDial from "./PotDial";
import VoltageDial from "./VoltageDial";
import CurveInverter from "./CurveInverter";
import {
  Box,
  Typography,
  Button,
  Grid,
  ToggleButton,
  Tabs,
  Tab,
} from "@mui/material";

// Perfil inicial (Mapa 2)
const INIT_PROFILE = {
  P1: 15, P4: 6, P5: 4, P7: 10, P8: 8,
  P10: 1, P11: 1, P14: 6, P15: 6, P16: 2,
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
  const [maxVoltage, setMaxVoltage] = useState(12);
  const [tab, setTab] = useState(0);

  const getProfile = i => (i === 0 ? config1 : profiles[i - 1]);
  const handleChange = (param, value) => {
    if (selectedIndex === 0) setConfig1(prev => ({ ...prev, [param]: value }));
    else {
      const upd = [...profiles];
      upd[selectedIndex - 1] = { ...upd[selectedIndex - 1], [param]: value };
      setProfiles(upd);
    }
  };
  const addProfile = () => {
    if (profiles.length >= 6) return;
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
    const m = MAPAS_PREDEFINIDOS.map(x => ({ ...x }));
    setProfiles(m);
    setVisibility(Array(m.length + 1).fill(true));
    setSelectedIndex(1);
  };
  const setSoloMapa = i => {
    const m = { ...MAPAS_PREDEFINIDOS[i - 1] };
    setProfiles([m]);
    setVisibility([true]);
    setSelectedIndex(1);
  };
  const toggleVisibility = i => {
    const v = [...visibility];
    v[i] = !v[i];
    setVisibility(v);
  };

  const profilesToChart = [config1, ...profiles]
    .slice(0, 6)
    .filter((_, i) => visibility[i]);

  return (
    <Box sx={{ p: 2, backgroundColor: "#222", minHeight: "100vh" }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ color: "#fff" }}
      >
        ⚡ TICTAC V7 Simulator
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, bgcolor: "#1a1a1a", borderRadius: 1 }}
        textColor="inherit"
        indicatorColor="primary"
      >
        <Tab label="Editor de curvas" sx={{ color: "#fff" }} />
        <Tab label="Inversión de curva" sx={{ color: "#fff" }} />
      </Tabs>

      {tab === 0 && (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={4}>
              <PotDial
                label="Freno"
                value={getProfile(selectedIndex).P1}
                onChange={v => handleChange("P1", v)}
              />
            </Grid>
            <Grid item xs={4}>
              <PotDial
                label="Potencia"
                value={getProfile(selectedIndex).potValue}
                onChange={v => handleChange("potValue", v)}
              />
            </Grid>
            <Grid item xs={4}>
              <VoltageDial
                label="Voltaje Máx"
                value={maxVoltage}
                min={0}
                max={16}
                step={0.1}
                onChange={v => setMaxVoltage(v)}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Typography variant="h6" gutterBottom sx={{ color: "#fff" }}>
                ⚙️ Parámetros Izquierda
              </Typography>
              {["P4", "P7", "P5", "P10"].map(param => (
                <Box key={param} mb={2}>
                  <Typography
                    variant="body2"
                    sx={{ color: "#FFF", fontSize: "1rem" }}
                  >
                    <strong>
                      {param} ({getProfile(selectedIndex)[param]}) – {PARAM_NAMES[param]}
                    </strong>{" "}
                    – {PARAM_EXPLANATIONS[param]}
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
              <Typography variant="h6" gutterBottom sx={{ color: "#fff" }}>
                ⚙️ Parámetros Derecha
              </Typography>
              {["P8", "P16", "P11", "P14", "P15"].map(param => (
                <Box key={param} mb={2}>
                  <Typography
                    variant="body2"
                    sx={{ color: "#FFF", fontSize: "1rem" }}
                  >
                    <strong>
                      {param} ({getProfile(selectedIndex)[param]}) – {PARAM_NAMES[param]}
                    </strong>{" "}
                    – {PARAM_EXPLANATIONS[param]}
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

          <Box sx={{ display: "flex", gap: 1, my: 2 }}>
            {[1, 2, 3, 4].map(i => (
              <Button
                key={i}
                variant="contained"
                onClick={() => setSoloMapa(i)}
                sx={{
                  bgcolor: "#666",
                  color: "#fff",
                  textTransform: "none",
                  flex: 1,
                }}
              >
                Mapa {i}
              </Button>
            ))}
            <Button
              variant="contained"
              onClick={showMapasPredefinidos}
              sx={{
                bgcolor: "#666",
                color: "#fff",
                textTransform: "none",
                flex: 1,
              }}
            >
              Todos
            </Button>
            <Button
              variant="contained"
              onClick={reset}
              sx={{
                bgcolor: "#666",
                color: "#fff",
                textTransform: "none",
                flex: 1,
              }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={addProfile}
              disabled={profiles.length >= 6}
              sx={{
                bgcolor: "#29b6f6",
                color: "#fff",
                textTransform: "none",
                flex: 1,
              }}
            >
              ➕ Nueva curva ({profiles.length}/6)
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {[config1, ...profiles].slice(0, 6).map((p, i) => (
              <ToggleButton
                key={i}
                value={i}
                selected={visibility[i]}
                onChange={() => toggleVisibility(i)}
                color={selectedIndex === i ? "primary" : "standard"}
                onClick={() => setSelectedIndex(i)}
                sx={{ color: "#fff", backgroundColor: visibility[i] ? "#666" : "#444" }}
              >
                {p.nombre || `Config ${i + 1}`}
              </ToggleButton>
            ))}
          </Box>

          <CurveChart
            profiles={profilesToChart}
            selectedIndex={selectedIndex}
            useP8={true}
            showPowerZone={true}
            maxVoltage={maxVoltage}
          />

          <ExportButton profiles={profilesToChart} maxVoltage={maxVoltage} />
        </>
      )}

      {tab === 1 && (
        <CurveInverter />
      )}
    </Box>
  );
}
