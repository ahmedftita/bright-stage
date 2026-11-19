import React from 'react';
import { Box, Cylinder, Html } from '@react-three/drei';

/**
 * Technical Truss 3D component
 * Supports Box Grid & Goalpost with accurate tube diameters, sleeve blocks,
 * top sections, base plates, and measurement annotations.
 */

const TrussSegment = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 2,
  color = '#4b5563',
  spacing = 0.24,
  width,
  height,
  tubeSize = 0.05
}) => {
  const w = width || spacing;
  const h = height || spacing;
  const halfW = w / 2;
  const halfH = h / 2;

  // Bracing / Diagonals
  const bracingInterval = 0.6;
  const bracingCount = Math.max(1, Math.floor(length / bracingInterval));
  const braces = [];
  const bThick = 0.018;

  for (let i = 0; i < bracingCount; i++) {
    const zMid = (i * bracingInterval) - (length / 2) + (bracingInterval / 2);

    // Top / Bottom braces
    braces.push(
      <Cylinder
        key={`bt-${i}`}
        args={[bThick, bThick, w * 1.05, 4]}
        position={[0, halfH, zMid]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
      </Cylinder>
    );
    braces.push(
      <Cylinder
        key={`bb-${i}`}
        args={[bThick, bThick, w * 1.05, 4]}
        position={[0, -halfH, zMid]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
      </Cylinder>
    );

    // Side braces
    braces.push(
      <Cylinder
        key={`bl-${i}`}
        args={[bThick, bThick, h * 1.05, 4]}
        position={[-halfW, 0, zMid]}
        rotation={[0, 0, 0]}
      >
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
      </Cylinder>
    );
    braces.push(
      <Cylinder
        key={`br-${i}`}
        args={[bThick, bThick, h * 1.05, 4]}
        position={[halfW, 0, zMid]}
        rotation={[0, 0, 0]}
      >
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
      </Cylinder>
    );
  }

  return (
    <group position={position} rotation={rotation}>
      {/* 4 Main Aluminum Chords (50mm tubes) */}
      <Cylinder args={[tubeSize / 2, tubeSize / 2, length, 8]} position={[halfW, halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[tubeSize / 2, tubeSize / 2, length, 8]} position={[-halfW, halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[tubeSize / 2, tubeSize / 2, length, 8]} position={[halfW, -halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[tubeSize / 2, tubeSize / 2, length, 8]} position={[-halfW, -halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      {braces}
    </group>
  );
};

const SleeveBlock = ({ position, size = 0.45 }) => (
  <group position={position}>
    <Box args={[size, size, size]}>
      <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
    </Box>
    <Box args={[size + 0.02, size - 0.08, size - 0.08]}>
      <meshStandardMaterial color="#38bdf8" wireframe />
    </Box>
  </group>
);

const TopSection = ({ position }) => (
  <group position={position}>
    <Box args={[0.45, 0.25, 0.45]} position={[0, 0.12, 0]}>
      <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
    </Box>
    {/* Pulley wheel */}
    <Cylinder args={[0.12, 0.12, 0.08, 16]} position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
      <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.4} />
    </Cylinder>
  </group>
);

const DimensionBadge = ({ position, label }) => (
  <group position={position}>
    <Html center style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(4px)',
        color: '#f8fafc',
        padding: '3px 8px',
        borderRadius: '6px',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        fontSize: '11px',
        fontWeight: '700',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
      }}>
        {label}
      </div>
    </Html>
  </group>
);

export default function Truss3D({
  length = 8,
  width = 6,
  height = 6,
  sectionSize = 0.29,
  tubeSize = 0.05,
  isOverload = false,
  grid = {},
  towSpec = {},
  gridSpecL = {},
  gridSpecW = {},
  showLabels = true
}) {
  const towerWidth = towSpec.sectionWidth || sectionSize;
  const towerHeightDim = towSpec.sectionHeight || sectionSize;

  const gridWL = gridSpecL.sectionWidth || sectionSize;
  const gridHL = gridSpecL.sectionHeight || sectionSize;
  const gridWW = gridSpecW.sectionWidth || sectionSize;
  const gridHW = gridSpecW.sectionHeight || sectionSize;

  let tubeSpacing = 0.24;
  if (Math.max(towerWidth, gridWL, gridWW) >= 0.35) tubeSpacing = 0.35;

  const sleeveSize = Math.max(towerWidth, towerHeightDim, gridWL, gridHL, gridWW, gridHW) + 0.06;

  const defaultColor = '#64748b';
  const towerColor = isOverload ? '#ef4444' : '#94a3b8';
  const beamColorL = isOverload ? '#ef4444' : '#38bdf8';
  const beamColorW = isOverload ? '#ef4444' : '#818cf8';

  const towerTopHeight = height + 1.0;

  const parseSpansLocal = (input) => {
    if (typeof input === 'number') return [Math.max(1, input)];
    const str = String(input).replace(/,/g, ' ').trim();
    const parts = str.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
    return parts.length > 0 ? parts : [parseFloat(input) || 6];
  };

  const generateGridPoints = (spans) => {
    let current = 0;
    const points = [0];
    spans.forEach(val => {
      current += val;
      points.push(current);
    });
    const total = points[points.length - 1];
    const offset = total / 2;
    return points.map(p => p - offset);
  };

  const lenSpans = grid.lenSpans || parseSpansLocal(length);
  const widSpans = grid.widSpans || parseSpansLocal(width);

  const isGoalpost = !!grid.isGoalpost;

  const xPos = isGoalpost ? [0] : generateGridPoints(widSpans);
  const zPos = generateGridPoints(lenSpans);

  // Towers positioning
  const towers = [];
  const sleeves = [];
  let towerCoords = [];

  if (isGoalpost) {
    if (zPos.length >= 2) {
      towerCoords = [[0, zPos[0]], [0, zPos[zPos.length - 1]]];
    } else {
      towerCoords = [[0, -length / 2], [0, length / 2]];
    }
  } else {
    xPos.forEach(x => {
      zPos.forEach(z => {
        towerCoords.push([x, z]);
      });
    });
  }

  // Generate Towers
  towerCoords.forEach(([x, z], idx) => {
    towers.push(
      <group key={`tower-${idx}-${x}-${z}`} position={[x, towerTopHeight / 2, z]}>
        <TrussSegment
          length={towerTopHeight}
          width={towerWidth}
          height={towerHeightDim}
          spacing={tubeSpacing}
          color={towerColor}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <TopSection position={[0, towerTopHeight / 2, 0]} />
        {/* Chain drop line */}
        <Cylinder args={[0.006, 0.006, height, 4]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </Cylinder>
        {/* Base Plate */}
        <Box args={[0.65, 0.04, 0.65]} position={[0, -towerTopHeight / 2, 0]}>
          <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.3} />
        </Box>

        {/* Goalpost stabilizer outriggers */}
        {isGoalpost && (
          <group position={[0, -towerTopHeight / 2 + 0.15, 0]}>
            <TrussSegment
              position={[1, 0, 0]}
              length={2}
              width={towerWidth}
              height={towerHeightDim}
              spacing={tubeSpacing}
              color={towerColor}
              rotation={[0, 0, Math.PI / 2]}
            />
            <TrussSegment
              position={[-1, 0, 0]}
              length={2}
              width={towerWidth}
              height={towerHeightDim}
              spacing={tubeSpacing}
              color={towerColor}
              rotation={[0, 0, Math.PI / 2]}
            />
          </group>
        )}
      </group>
    );
  });

  // Sleeves
  if (!isGoalpost) {
    xPos.forEach(x => {
      zPos.forEach(z => {
        sleeves.push(<SleeveBlock key={`sleeve-${x}-${z}`} position={[x, height, z]} size={sleeveSize} />);
      });
    });
  } else {
    sleeves.push(<SleeveBlock key="sleeve-gp-1" position={[0, height, zPos[0]]} size={sleeveSize} />);
    sleeves.push(<SleeveBlock key="sleeve-gp-2" position={[0, height, zPos[zPos.length - 1]]} size={sleeveSize} />);
  }

  // Beams
  const beams = [];

  if (isGoalpost) {
    // Goalpost main beam along Z axis
    for (let i = 0; i < zPos.length - 1; i++) {
      const z1 = zPos[i];
      const z2 = zPos[i + 1];
      const midZ = (z1 + z2) / 2;
      const segLen = Math.abs(z2 - z1) - sleeveSize;
      beams.push(
        <TrussSegment
          key={`beam-gp-${i}`}
          position={[0, height, midZ]}
          length={segLen}
          width={gridWL}
          height={gridHL}
          spacing={tubeSpacing}
          color={beamColorL}
          rotation={[0, 0, 0]}
        />
      );
    }

    // Suspended LED Screen placeholder
    const screenH = Math.max(1.5, height - 2);
    const screenW = Math.max(2, length - 1.2);
    beams.push(
      <group key="gp-screen-mesh" position={[0, height - screenH / 2 - 0.2, 0]}>
        {/* Frame */}
        <Box args={[0.14, screenH, screenW]}>
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
        </Box>
        {/* Screen Face */}
        <Box args={[0.15, screenH - 0.1, screenW - 0.1]}>
          <meshStandardMaterial color="#1e1b4b" emissive="#312e81" roughness={0.2} />
        </Box>
      </group>
    );
  } else {
    // Grid Length Beams (along Z axis) at each xPos
    xPos.forEach(x => {
      for (let i = 0; i < zPos.length - 1; i++) {
        const z1 = zPos[i];
        const z2 = zPos[i + 1];
        const midZ = (z1 + z2) / 2;
        const segLen = Math.abs(z2 - z1) - sleeveSize;

        beams.push(
          <TrussSegment
            key={`beam-z-${x}-${i}`}
            position={[x, height, midZ]}
            length={segLen}
            width={gridWL}
            height={gridHL}
            spacing={tubeSpacing}
            color={beamColorL}
            rotation={[0, 0, 0]}
          />
        );
      }
    });

    // Grid Width Beams (along X axis) at each zPos
    zPos.forEach(z => {
      for (let i = 0; i < xPos.length - 1; i++) {
        const x1 = xPos[i];
        const x2 = xPos[i + 1];
        const midX = (x1 + x2) / 2;
        const segLen = Math.abs(x2 - x1) - sleeveSize;

        beams.push(
          <TrussSegment
            key={`beam-x-${z}-${i}`}
            position={[midX, height, z]}
            length={segLen}
            width={gridWW}
            height={gridHW}
            spacing={tubeSpacing}
            color={beamColorW}
            rotation={[0, Math.PI / 2, 0]}
          />
        );
      }
    });
  }

  return (
    <group>
      {towers}
      {sleeves}
      {beams}

      {/* Dimension Badges */}
      {showLabels && (
        <>
          <DimensionBadge
            position={[-width / 2 - 0.8, height / 2, 0]}
            label={`Longueur: ${length}m`}
          />
          {!isGoalpost && (
            <DimensionBadge
              position={[0, height + 0.6, length / 2 + 0.5]}
              label={`Largeur: ${width}m`}
            />
          )}
          <DimensionBadge
            position={[width / 2 + 0.8, height / 2, length / 2]}
            label={`Hauteur: ${height}m`}
          />
        </>
      )}
    </group>
  );
}
