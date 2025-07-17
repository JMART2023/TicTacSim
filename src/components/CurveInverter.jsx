// CurveInverter.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Checkbox
} from "@mui/material";

const WIDTH = 480, HEIGHT = 220, PADDING = 32;
const POINTS = 15;

const PARAMS = [
  { key: "P4", desc: "Potencia (V máx. salida)" },
  { key: "P5", desc: "Aceleración" },
  { key: "P7", desc: "Zona Potencia" },
  { key: "P8", desc: "Paso por Curva" },
  { key: "P16", desc: "Sensibilidad Potenciómetro" }
];

// --- Motor fiel TICTAC ---
function calculatePowerZone(P7) {
  const normalized = (P7 - 1) / 14;
  const center = 0.2 + normalized * 0.6;
  const width = 0.4;
  return { start: Math.max(0, center - width / 2), end: Math.min(1, center + width / 2), center };
}
function simulateCurve({ P4, P5, P7, P8, P16, potValue, maxV }) {
  const potNorm = potValue / 15;
  const sensitivity = Math.pow(potNorm, 2.7 - ((P16 - 1) * (2.2 / 14)));
  const powerFactor = (P4 / 15) * sensitivity;
  const accelFactor = 1 + ((P5 - 1) * 0.1 / 14);
  const multiplier = 0.6 + ((P8 - 1) * (0.8 / 14));
  const zone = calculatePowerZone(P7);
  let arr = [];
  for (let i = 0; i <= 100; i++) {
    const x = i / 100, dist = Math.abs(x - zone.center), maxDist = zone.end - zone.start;
    let y = Math.pow(x, 1 / accelFactor); // progresividad fiel
    const zoneEff = Math.max(0, 1 - (dist / maxDist) * 2);
    y *= (0.5 + zoneEff * 0.5 * potNorm); // peak zona potencia
    y *= powerFactor * multiplier;
    arr.push(y);
  }
  // Ajuste total para que SIEMPRE el punto 100% sea máx. (fiel, aunque varía el perfil)
  const scale = arr[100] ? (maxV / arr[100]) : 1;
  return arr.map(v => v * scale);
}
function interpolateCurve(values) {
  const step = 100 / (values.length - 1), curve = [];
  for (let i = 0; i <= 100; ++i) {
    const idx = Math.floor(i / step), frac = (i % step) / step;
    if (idx >= values.length - 1) curve.push(values[values.length - 1]);
    else curve.push(values[idx] + frac * (values[idx + 1] - values[idx]));
  }
  return curve;
}
function findClosestConfigs(target, minV, maxV) {
  // 486 combinaciones: seguro, variado, rápido.
  const P4s = [6, 10, 15], P5s = [4, 10, 15], P7s = [1, 8, 15], P8s = [4, 10, 15], P16s = [2, 8, 15], potVs = [13, 15];
  let result = [], id = 0;
  for (let P4 of P4s)
    for (let P5 of P5s)
      for (let P7 of P7s)
        for (let P8 of P8s)
          for (let P16 of P16s)
            for (let potValue of potVs)
              for (let maxv = Number(minV); maxv <= Number(maxV); maxv += 1) {
                const params = { P4, P5, P7, P8, P16, potValue, maxV: maxv };
                const curve = simulateCurve(params);
                const overflow = curve.some(v => v > maxv + 0.02);
                const error = curve.reduce((acc, v, idx) => acc + Math.abs(v - target[idx]), 0);
                result.push({ ...params, error, overflow, simCurve: curve, _id: ++id });
              }
  return result.sort((a, b) => a.error - b.error).slice(0, 5);
}

export default function CurveInverter() {
  const [values, setValues] = useState(Array.from({ length: POINTS }, (_, i) => (12 * i) / (POINTS - 1)));
  const [minV, setMinV] = useState(10);
  const [maxV, setMaxV] = useState(14);
  const [results, setResults] = useState([]);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [selectedCurves, setSelectedCurves] = useState([]);

  const svgRef = useRef(null);
  const stepWidth = (WIDTH - 2 * PADDING) / (POINTS - 1);
  const valueToY = v => HEIGHT - PADDING - (v / 16) * (HEIGHT - 2 * PADDING);
  const yToValue = y => Math.min(16, Math.max(0, ((HEIGHT - PADDING - y) / (HEIGHT - 2 * PADDING)) * 16));
  
  useEffect(() => {
    function onMouseMove(e) {
      if (draggingIdx !== null && draggingIdx < POINTS - 1) {
        const svgRect = svgRef.current.getBoundingClientRect();
        let y = e.clientY - svgRect.top;
        y = Math.min(Math.max(y, PADDING), HEIGHT - PADDING);
        const newVals = [...values];
        newVals[draggingIdx] = yToValue(y);
        setValues(newVals);
      }
    }
    function onMouseUp() { setDraggingIdx(null); }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [draggingIdx, values]);

  const handleEstimate = () => {
    const targetCurve = interpolateCurve(values);
    setResults(findClosestConfigs(targetCurve, minV, maxV));
    setSelectedCurves([]);
  };

  function renderSimCurveSVG() {
    if (!selectedCurves.length) return null;
    return selectedCurves.map((curveObj, i) => (
      <polyline
        key={curveObj._id}
        fill="none"
        stroke="#ffb300"
        strokeWidth={2.2}
        strokeDasharray="8 2"
        opacity={0.7 - i*0.2}
        points={curveObj.simCurve.map((v, idx) => {
          const x = PADDING + idx * ((WIDTH - 2 * PADDING) / 100);
          const y = valueToY(Math.max(0, Math.min(16, v)));
          return `${x},${y}`;
        }).join(' ')}
      />
    ));
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#181818', borderRadius: 2, maxWidth: 1100, margin: 'auto' }}>
      <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
        Inversión de curva (TICTAC V7, fiel)
      </Typography>
      <Typography variant="body1" sx={{ color: '#ddd', mb: 2 }}>
        Arrastra los <b>15 puntos azules</b>. El último punto (100%) es fijo.<br />
        Marca una o varias filas tras calcular para superponer curvas óptimas (naranja) junto a la tuya (azul).
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-end' }}>
        <Box>
          <TextField
            label="Voltaje mínimo"
            variant="filled"
            type="number"
            value={minV}
            onChange={e => setMinV(e.target.value)}
            inputProps={{ step: '0.1', min: 0, max: maxV, style: { color: '#222', textAlign: 'center', background: "#fff" }}}
            size="small"
            sx={{ background: '#fff', borderRadius: 1, width: 130 }}
            InputLabelProps={{ style: { color: '#222' } }}
          />
        </Box>
        <Box>
          <TextField
            label="Voltaje máximo"
            variant="filled"
            type="number"
            value={maxV}
            onChange={e => setMaxV(e.target.value)}
            inputProps={{ step: '0.1', min: minV, max: 16, style: { color: '#222', textAlign: 'center', background: "#fff" }}}
            size="small"
            sx={{ background: '#fff', borderRadius: 1, width: 130 }}
            InputLabelProps={{ style: { color: '#222' } }}
          />
        </Box>
        <Button
          variant="contained"
          sx={{ bgcolor: '#29b6f6', color: '#fff', minWidth: 180 }}
          onClick={handleEstimate}
        >
          Calcular configuraciones óptimas
        </Button>
      </Box>
      <svg
        ref={svgRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ background: '#fff', borderRadius: 10, cursor: 'crosshair', border: '2px solid #1976d2', display: "block", marginBottom: 8 }}
      >
        <polyline
          fill="none"
          stroke="#1976d2"
          strokeWidth={3}
          points={values.map((v, i) => {
            const x = PADDING + i * stepWidth;
            const y = HEIGHT - PADDING - (v / 16) * (HEIGHT - 2 * PADDING);
            return `${x},${y}`;
          }).join(' ')}
        />
        {renderSimCurveSVG()}
        {values.map((v, i) => {
          const x = PADDING + i * stepWidth;
          const y = HEIGHT - PADDING - (v / 16) * (HEIGHT - 2 * PADDING);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={draggingIdx === i ? 10 : 5}
              fill={i === POINTS - 1 ? "#888" : "#1976d2"}
              stroke="#222"
              style={{ cursor: i === POINTS - 1 ? 'default' : 'pointer', transition: "r 0.13s" }}
              onMouseDown={e => {
                if (i !== POINTS - 1) {
                  setDraggingIdx(i);
                  e.preventDefault();
                }
              }}
            />
          );
        })}
        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="#bbb" />
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="#bbb" />
        {[0, 4, 8, 12, 16].map((yv) => (
          <text
            key={`v${yv}`}
            x={PADDING - 8}
            y={HEIGHT - PADDING - (yv / 16) * (HEIGHT - 2 * PADDING) + 5}
            fill="#1976d2"
            fontSize="13"
            textAnchor="end"
          >{yv}</text>
        ))}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((pct) => (
          <text
            key={`h${pct}`}
            x={PADDING + pct * ((WIDTH - 2 * PADDING) / 14)}
            y={HEIGHT - PADDING + 19}
            fill="#1976d2"
            fontSize="13"
            textAnchor="middle"
          >{Math.round(pct * (100 / 14))}%</text>
        ))}
      </svg>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
          Tabla de mejores perfiles (marca para comparar curvas):
        </Typography>
        {results.length > 0 && (
          <TableContainer component={Paper} sx={{ background: "#222" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {PARAMS.map(par =>
                    <TableCell key={par.key} sx={{ color: "#fff", fontSize: 12 }}>
                      <strong>{par.key}</strong>
                      <div style={{ fontSize: 10, color: "#ace" }}>{par.desc}</div>
                    </TableCell>
                  )}
                  <TableCell sx={{ color: "#fff", fontSize: 12, minWidth: 70 }}>
                    V Máx
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontSize: 12, minWidth: 38 }}>
                    Error
                  </TableCell>
                  <TableCell sx={{ color: "#fff", fontSize: 12, minWidth: 32 }}>
                    Pico fuera
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row, idx) => (
                  <TableRow key={row._id} hover>
                    {PARAMS.map(par =>
                      <TableCell key={par.key} sx={{ color: "#fff", fontSize: 14 }}>
                        {row[par.key]}
                      </TableCell>
                    )}
                    <TableCell sx={{ color: "#bfe", fontSize: 14 }}>
                      {row.maxV}V
                    </TableCell>
                    <TableCell sx={{ color: "#ffa", fontSize: 14 }}>
                      {row.error.toFixed(0)}
                    </TableCell>
                    <TableCell sx={{ color: row.overflow ? "#f00" : "#fff", fontSize: 16, fontWeight: 700 }}>
                      {row.overflow ? "⚠️" : ""}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selectedCurves.some(sel => sel._id === row._id)}
                        onChange={() => {
                          setSelectedCurves(selectedCurves.some(sel => sel._id === row._id)
                            ? selectedCurves.filter(sel => sel._id !== row._id)
                            : [...selectedCurves, row]
                          );
                        }}
                        sx={{ color: "#29b6f6" }}
                        inputProps={{ "aria-label": "Selecciona para comparar gráfica" }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {results.length === 0 && (
          <Typography variant="body2" sx={{ color: '#fff', mt: 2 }}>
            Ajusta la curva y pulsa el botón para ver la tabla de combinaciones óptimas.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
