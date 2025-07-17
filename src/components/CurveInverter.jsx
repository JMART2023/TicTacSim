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
  { key: "P5", desc: "Aceleración (Respuesta acelerador)" },
  { key: "P7", desc: "Zona Potencia (Dónde actúa)" },
  { key: "P8", desc: "Paso por Curva (Entrega tras curva)" },
  { key: "P10", desc: "Pot. Multifunción (Freno/volt)" },
  { key: "P11", desc: "Anticipar Frenada (Adelanto freno)" },
  { key: "P14", desc: "Velocidad Entrada Freno" },
  { key: "P15", desc: "Freno Mínimo" },
  { key: "P16", desc: "Sensibilidad Potenciómetro" }
];

function interpolateCurve(values) {
  const step = 100 / (values.length - 1);
  const curve = [];
  for (let i = 0; i <= 100; ++i) {
    const idx = Math.floor(i / step);
    const frac = (i % step) / step;
    if (idx >= values.length - 1) curve.push(values[values.length - 1]);
    else curve.push(values[idx] + frac * (values[idx + 1] - values[idx]));
  }
  return curve;
}

function simulateCurve(P, volt) {
  const { P4, P5, P7, P8, P10, P11, P14, P15, P16 } = P;
  let simCurve = [];
  for (let i = 0; i <= 100; i++) {
    simCurve.push(
      volt * (i / 100) * (P4 / 15) * (P5 / 15) * ((16 - P7) / 15) *
      (P8 / 15) * (P10 / 2) * (P11 / 2) * (P14 / 15) *
      (P15 / 15) * (P16 / 15)
    );
  }
  return simCurve;
}

function findClosestConfigs(target, minV, maxV) {
  const combos = [];
  for (let P4 = 4; P4 <= 15; P4 += 3) {
    for (let P5 = 1; P5 <= 15; P5 += 7) {
      for (let P7 = 1; P7 <= 15; P7 += 7) {
        for (let P8 = 1; P8 <= 15; P8 += 7) {
          for (let P10 = 1; P10 <= 2; P10++) {
            for (let P11 = 1; P11 <= 2; P11++) {
              for (let P14 = 1; P14 <= 15; P14 += 7) {
                for (let P15 = 1; P15 <= 15; P15 += 7) {
                  for (let P16 = 1; P16 <= 15; P16 += 7) {
                    for (let volt = minV; volt <= maxV; volt += 0.5) {
                      const P = { P4, P5, P7, P8, P10, P11, P14, P15, P16 };
                      let c = simulateCurve(P, volt);

                      // Si algún punto excede el voltaje máximo, marcar overflow
                      let overflow = c.some(v => v > volt + 0.05);
                      let error = c.reduce((acc, v, idx) => acc + Math.abs(v - target[idx]), 0);
                      combos.push({
                        ...P,
                        volt: Number(volt.toFixed(2)),
                        error,
                        overflow,
                        simCurve: c
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  combos.sort((a, b) => a.error - b.error);
  return combos.slice(0, 5);
}

export default function CurveInverter() {
  const [values, setValues] = useState(Array.from({ length: POINTS }, (_, i) => (12 * i) / (POINTS - 1)));
  const [minV, setMinV] = useState(10);
  const [maxV, setMaxV] = useState(14);
  const [results, setResults] = useState([]);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [selectedCurve, setSelectedCurve] = useState(null);

  const svgRef = useRef(null);
  const stepWidth = (WIDTH - 2 * PADDING) / (POINTS - 1);

  const valueToY = (v) => HEIGHT - PADDING - (v / 16) * (HEIGHT - 2 * PADDING);
  const yToValue = (y) => Math.min(16, Math.max(0, ((HEIGHT - PADDING - y) / (HEIGHT - 2 * PADDING)) * 16));

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
    function onMouseUp() {
      setDraggingIdx(null);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [draggingIdx, values]);

  const handleEstimate = () => {
    let targetCurve = interpolateCurve(values);
    setResults(findClosestConfigs(targetCurve, Number(minV), Number(maxV)));
    setSelectedCurve(null);
  };

  function renderSimCurves() {
    if (!selectedCurve) return null;
    let c = selectedCurve.simCurve;
    return (
      <polyline
        fill="none"
        stroke="#ffb300"
        strokeWidth={2.2}
        strokeDasharray="8 2"
        points={c.map((v, idx) => {
          const x = PADDING + idx * ((WIDTH - 2 * PADDING) / 100);
          const y = valueToY(Math.max(0, Math.min(16, v)));
          return `${x},${y}`;
        }).join(' ')}
      />
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#181818', borderRadius: 2, maxWidth: 1100, margin: 'auto' }}>
      <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
        Inversión de curva (arrastre gráfico)
      </Typography>
      <Typography variant="body1" sx={{ color: '#ddd', mb: 2 }}>
        Arrastra los puntos azules para definir la curva deseada. El último punto (100%) es fijo.<br />
        Pulsa el botón para ver los mejores parámetros. Marca una fila para comparar la curva original (azul) con la aproximada (naranja punteada).
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-end' }}>
        <Box>
          <TextField
            label="Voltaje mínimo"
            variant="filled"
            type="number"
            value={minV}
            onChange={(e) => setMinV(e.target.value)}
            inputProps={{
              step: '0.1',
              min: 0,
              max: maxV,
              style: { color: '#222', textAlign: 'center', background: "#fff" }
            }}
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
            onChange={(e) => setMaxV(e.target.value)}
            inputProps={{
              step: '0.1',
              min: minV,
              max: 16,
              style: { color: '#222', textAlign: 'center', background: "#fff" }
            }}
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
        {/* Curva original */}
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
        {/* Curva simulada seleccionada */}
        {renderSimCurves()}
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
              onMouseDown={(e) => {
                if (i !== POINTS - 1) {
                  setDraggingIdx(i);
                  e.preventDefault();
                }
              }}
            />
          );
        })}
        {/* Ejes */}
        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="#bbb" />
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="#bbb" />
        {/* Etiquetas */}
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
          Tabla de mejores coincidencias (selecciona para comparar):
        </Typography>
        {results.length > 0 && (
          <TableContainer component={Paper} sx={{ background: "#222" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {PARAMS.map(par =>
                    <TableCell key={par.key} sx={{ color: "#fff", fontSize: 12, minWidth: 60 }}>
                      <strong>{par.key}</strong>
                      <div style={{ fontSize: 10, color: "#ace" }}>{par.desc}</div>
                    </TableCell>
                  )}
                  <TableCell sx={{ color: "#fff", fontSize: 12, minWidth: 70 }}>
                    V Máx. buscado
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
                  <TableRow key={idx} hover>
                    {PARAMS.map(par =>
                      <TableCell key={par.key} sx={{ color: "#fff", fontSize: 14 }}>
                        {row[par.key]}
                      </TableCell>
                    )}
                    <TableCell sx={{ color: "#bfe", fontSize: 14 }}>
                      {row.volt}V
                    </TableCell>
                    <TableCell sx={{ color: "#ffa", fontSize: 14 }}>
                      {row.error.toFixed(0)}
                    </TableCell>
                    <TableCell sx={{ color: row.overflow ? "#f00" : "#fff", fontSize: 16, fontWeight: 700 }}>
                      {row.overflow ? "⚠️" : ""}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selectedCurve && selectedCurve.error === row.error}
                        onChange={() => setSelectedCurve(selectedCurve && selectedCurve.error === row.error ? null : row)}
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
