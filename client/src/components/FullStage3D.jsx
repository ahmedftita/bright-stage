import React, { useMemo } from 'react';
import { Box, Cylinder, Cone, Html } from '@react-three/drei';

/**
 * Full Stage 3D Studio Visualizer
 * Renders:
 * 1. Stage podium (deck, legs, skirting, stairs)
 * 2. Truss structure (towers, beams, sleeves, base plates)
 * 3. LED Screen (back wall with glow & frame)
 * 4. Lighting fixtures (moving heads, blinders, led bars, volumetric beams)
 */

// Simple Truss Beam helper
const TrussBeam = ({ length, width = 0.35, height = 0.35, color = '#64748b' }) => {
  const halfW = width / 2;
  const halfH = height / 2;
  const tubeR = 0.024;
  const braceInterval = 0.5;
  const count = Math.max(1, Math.floor(length / braceInterval));
  const braces = [];

  for (let i = 0; i < count; i++) {
    const z = (i * braceInterval) - (length / 2) + (braceInterval / 2);
    braces.push(
      <Cylinder key={`bt-${i}`} args={[0.01, 0.01, width, 4]} position={[0, halfH, z]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </Cylinder>
    );
    braces.push(
      <Cylinder key={`bb-${i}`} args={[0.01, 0.01, width, 4]} position={[0, -halfH, z]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </Cylinder>
    );
  }

  return (
    <group>
      <Cylinder args={[tubeR, tubeR, length, 8]} position={[halfW, halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[tubeR, tubeR, length, 8]} position={[-halfW, halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[tubeR, tubeR, length, 8]} position={[halfW, -halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[tubeR, tubeR, length, 8]} position={[-halfW, -halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      {braces}
    </group>
  );
};

// Moving Head Fixture with Volumetric Light Cone
const MovingFixture = ({
  position = [0, 0, 0],
  type = 'beam',
  color = '#38bdf8',
  showBeam = true,
  rotation = [0, 0, 0],
  coneAngle = 0.2,
  coneLength = 5.5
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Base / Clamp */}
      <Box args={[0.22, 0.08, 0.22]} position={[0, 0.04, 0]}>
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </Box>
      {/* Yoke (U-bracket) */}
      <Box args={[0.06, 0.16, 0.26]} position={[0, -0.06, 0]}>
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </Box>
      {/* Head / Lens */}
      <Cylinder args={[0.09, 0.08, 0.18, 12]} position={[0, -0.16, 0]}>
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.2} />
      </Cylinder>
      {/* Glowing Lens Face */}
      <Cylinder args={[0.08, 0.08, 0.02, 12]} position={[0, -0.25, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
      </Cylinder>

      {/* Volumetric Light Cone */}
      {showBeam && (
        <group position={[0, -0.26 - (coneLength / 2), 0]} rotation={[Math.PI, 0, 0]}>
          <Cone args={[coneLength * Math.tan(coneAngle), coneLength, 16, 1, true]}>
            <meshBasicMaterial
              color={color}
              transparent={true}
              opacity={type === 'beam' ? 0.35 : 0.2}
              depthWrite={false}
            />
          </Cone>
        </group>
      )}
    </group>
  );
};

// Measurement label tag
const DimensionLabel = ({ position, label }) => (
  <group position={position}>
    <Html center style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(4px)',
        color: '#f8fafc',
        padding: '2px 7px',
        borderRadius: '5px',
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

export default function FullStage3D({
  conception,
  nightMode = true,
  showLabels = true
}) {
  const { stage, structure, screen, lighting } = conception;

  // Dimensions
  const stageL = stage.dimensions.lengthM;
  const stageW = stage.dimensions.widthM;
  const stageH = stage.dimensions.heightM;

  const structL = structure.dimensions.length;
  const structW = structure.dimensions.width;
  const structH = structure.dimensions.height;
  const isGoalpost = structure.isGoalpost;

  const screenW = screen.dimensions.widthM;
  const screenH = screen.dimensions.heightM;
  const isScreenSuspended = screen.mountType === 'suspended_truss';

  // Positions
  // Stage is centered on X=0, Y=stageH/2, Z=0
  const stageCenterY = stageH / 2;

  // Screen is placed near the back edge of stage: Z = -stageW/2 + 0.3m
  const screenZ = -stageW / 2 + 0.35;
  const screenY = isScreenSuspended
    ? (stageH + 0.6 + screenH / 2)
    : (stageH + screenH / 2);

  // Lighting parameters
  const beamColor = lighting.beamColor || '#38bdf8';
  const showBeams = lighting.showBeams;

  // Generate stairs steps
  const stairSteps = useMemo(() => {
    if (!stage.hasStairs || stage.counts.stairs === 0) return [];
    const stepsCount = stage.counts.stairSteps;
    const stepH = stageH / stepsCount;
    const stepDepth = 0.35;
    const stepWidth = 1.0;
    const items = [];

    const sideMults = [];
    if (stage.counts.stairsSide === 'right' || stage.counts.stairsSide === 'both') sideMults.push(1);
    if (stage.counts.stairsSide === 'left' || stage.counts.stairsSide === 'both') sideMults.push(-1);

    sideMults.forEach((mult, mIdx) => {
      const baseX = mult * (stageL / 2 + 0.1);
      for (let s = 1; s <= stepsCount; s++) {
        // Highest step flush with stage, lowest step on ground
        const hCurrent = (stepsCount - s + 1) * stepH;
        const xPos = baseX + mult * ((s - 1) * stepDepth + stepDepth / 2);
        const yPos = hCurrent / 2;
        items.push(
          <group key={`stair-${mIdx}-${s}`} position={[xPos, yPos, 0]}>
            <Box args={[stepDepth, hCurrent, stepWidth]}>
              <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.4} />
            </Box>
            {/* Step edge highlight */}
            <Box args={[0.04, 0.02, stepWidth]} position={[mult * (stepDepth / 2 - 0.02), hCurrent / 2, 0]}>
              <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
            </Box>
          </group>
        );
      }
    });

    return items;
  }, [stage, stageL, stageH]);

  // Generate Light Fixtures along Trusses
  const lightingFixtures = useMemo(() => {
    const list = [];
    const bColor = beamColor;

    // 1. BACK TRUSS (Contre-jour & Beams vers le public)
    const backZ = -structW / 2;
    const backY = structH;
    const beamCount = lighting.counts.beams || 0;
    if (beamCount > 0) {
      const spacing = (structL - 1.5) / Math.max(1, beamCount - 1);
      for (let i = 0; i < beamCount; i++) {
        const x = -structL / 2 + 0.75 + i * spacing;
        list.push(
          <MovingFixture
            key={`beam-${i}`}
            position={[x, backY - 0.2, backZ]}
            type="beam"
            color={bColor}
            showBeam={showBeams}
            coneAngle={0.12}
            coneLength={structH + 2}
            rotation={[0.3, 0, (i - beamCount / 2) * 0.08]} // fanned out towards audience
          />
        );
      }
    }

    // 2. FRONT TRUSS (Face artistes - Spots & Washes)
    if (!isGoalpost) {
      const frontZ = structW / 2;
      const frontY = structH;
      const spotCount = lighting.counts.spots || 0;
      if (spotCount > 0) {
        const spacing = (structL - 2) / Math.max(1, spotCount - 1);
        for (let i = 0; i < spotCount; i++) {
          const x = -structL / 2 + 1 + i * spacing;
          list.push(
            <MovingFixture
              key={`spot-${i}`}
              position={[x, frontY - 0.2, frontZ]}
              type="spot"
              color="#fbbf24"
              showBeam={showBeams}
              coneAngle={0.24}
              coneLength={structH - 0.5}
              rotation={[-0.45, 0, 0]} // pointing back down to stage center
            />
          );
        }
      }

      // Washes on Front Truss
      const washCount = lighting.counts.washes || 0;
      if (washCount > 0) {
        const spacing = (structL - 2) / Math.max(1, washCount - 1);
        for (let i = 0; i < washCount; i++) {
          const x = -structL / 2 + 1.2 + i * spacing;
          list.push(
            <MovingFixture
              key={`wash-${i}`}
              position={[x, frontY - 0.15, frontZ - 0.2]}
              type="wash"
              color="#a855f7"
              showBeam={showBeams}
              coneAngle={0.32}
              coneLength={structH - 0.5}
              rotation={[-0.35, 0, 0]}
            />
          );
        }
      }

      // Blinders 4-Lite on Front Truss
      const blinderCount = lighting.counts.blinders || 0;
      if (blinderCount > 0) {
        const spacing = (structL - 1) / Math.max(1, blinderCount);
        for (let i = 0; i < blinderCount; i++) {
          const x = -structL / 2 + 1 + i * spacing;
          list.push(
            <group key={`blinder-${i}`} position={[x, frontY - 0.1, frontZ + 0.15]}>
              <Box args={[0.35, 0.35, 0.08]}>
                <meshStandardMaterial color="#0f172a" />
              </Box>
              {/* 4 lamps */}
              <Cylinder args={[0.06, 0.06, 0.02, 12]} position={[-0.08, 0.08, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#ffedd5" emissive="#ffedd5" emissiveIntensity={2} />
              </Cylinder>
              <Cylinder args={[0.06, 0.06, 0.02, 12]} position={[0.08, 0.08, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#ffedd5" emissive="#ffedd5" emissiveIntensity={2} />
              </Cylinder>
              <Cylinder args={[0.06, 0.06, 0.02, 12]} position={[-0.08, -0.08, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#ffedd5" emissive="#ffedd5" emissiveIntensity={2} />
              </Cylinder>
              <Cylinder args={[0.06, 0.06, 0.02, 12]} position={[0.08, -0.08, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#ffedd5" emissive="#ffedd5" emissiveIntensity={2} />
              </Cylinder>
            </group>
          );
        }
      }
    }

    return list;
  }, [lighting, structL, structW, structH, isGoalpost, beamColor, showBeams]);

  return (
    <group>
      {/* ========================================================
          1. STAGE (SCÈNE & PODIUMS MODULAIRES)
          ======================================================== */}
      <group position={[0, stageCenterY, 0]}>
        {/* Stage Top Deck (Plaques 18mm antidérapantes) */}
        <Box args={[stageL, 0.05, stageW]} position={[0, stageCenterY - 0.025, 0]}>
          <meshStandardMaterial color="#1e2230" roughness={0.6} metalness={0.2} />
        </Box>

        {/* Modular Grid lines on deck (1.22m x 1.22m plaques representation) */}
        <Box args={[stageL, 0.052, stageW]} position={[0, stageCenterY - 0.024, 0]}>
          <meshStandardMaterial color="#0f172a" wireframe wireframeLinewidth={1.5} />
        </Box>

        {/* Stage Skirting / Jupe de scène noire plissée */}
        {stage.hasSkirting && (
          <>
            {/* Front Skirt */}
            <Box args={[stageL, stageH - 0.02, 0.02]} position={[0, 0, stageW / 2]}>
              <meshStandardMaterial color="#090d16" roughness={0.8} />
            </Box>
            {/* Left Skirt */}
            <Box args={[0.02, stageH - 0.02, stageW]} position={[-stageL / 2, 0, 0]}>
              <meshStandardMaterial color="#090d16" roughness={0.8} />
            </Box>
            {/* Right Skirt */}
            <Box args={[0.02, stageH - 0.02, stageW]} position={[stageL / 2, 0, 0]}>
              <meshStandardMaterial color="#090d16" roughness={0.8} />
            </Box>
          </>
        )}

        {/* Legs / Stage Pieds (Vérins) */}
        <Cylinder args={[0.03, 0.03, stageH, 8]} position={[-stageL / 2 + 0.1, 0, -stageW / 2 + 0.1]}>
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </Cylinder>
        <Cylinder args={[0.03, 0.03, stageH, 8]} position={[stageL / 2 - 0.1, 0, -stageW / 2 + 0.1]}>
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </Cylinder>
        <Cylinder args={[0.03, 0.03, stageH, 8]} position={[-stageL / 2 + 0.1, 0, stageW / 2 - 0.1]}>
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </Cylinder>
        <Cylinder args={[0.03, 0.03, stageH, 8]} position={[stageL / 2 - 0.1, 0, stageW / 2 - 0.1]}>
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </Cylinder>
      </group>

      {/* Stairs */}
      {stairSteps}

      {/* ========================================================
          2. ÉCRAN LED (MUR VIDÉO FOND DE SCÈNE)
          ======================================================== */}
      <group position={[0, screenY, screenZ]}>
        {/* Main Display Face */}
        <Box args={[screenW, screenH, 0.08]}>
          <meshStandardMaterial
            color="#0f172a"
            emissive="#1e1b4b"
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </Box>

        {/* Glowing Screen Content Simulation */}
        <Box args={[screenW - 0.06, screenH - 0.06, 0.09]}>
          <meshStandardMaterial
            color="#2563eb"
            emissive="#38bdf8"
            emissiveIntensity={1.2}
            roughness={0.1}
          />
        </Box>

        {/* LED Back Structure & Vertical Bumping Bars */}
        <Box args={[screenW + 0.1, screenH + 0.1, 0.04]} position={[0, 0, -0.06]}>
          <meshStandardMaterial color="#020617" metalness={0.7} />
        </Box>
        {/* Top Bumping Bar */}
        <Cylinder args={[0.025, 0.025, screenW, 8]} position={[0, screenH / 2 + 0.05, -0.06]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </Cylinder>
      </group>

      {/* ========================================================
          3. STRUCTURE TRUSS (TOURS & GRIL SCÉNIQUE)
          ======================================================== */}
      {/* 4 Towers / Poteaux */}
      {isGoalpost ? (
        // Goalpost: 2 towers at Z=screenZ or Z=0
        <>
          <group position={[-structL / 2, structH / 2, 0]}>
            <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" />
            <Box args={[0.7, 0.04, 0.7]} position={[0, -structH / 2, 0]}><meshStandardMaterial color="#0f172a" /></Box>
            {/* Outriggers 2m */}
            <Box args={[0.2, 0.06, 2]} position={[0, -structH / 2 + 0.1, 0]}><meshStandardMaterial color="#475569" /></Box>
          </group>
          <group position={[structL / 2, structH / 2, 0]}>
            <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" />
            <Box args={[0.7, 0.04, 0.7]} position={[0, -structH / 2, 0]}><meshStandardMaterial color="#0f172a" /></Box>
            <Box args={[0.2, 0.06, 2]} position={[0, -structH / 2 + 0.1, 0]}><meshStandardMaterial color="#475569" /></Box>
          </group>
          {/* Main Top Beam along X */}
          <group position={[0, structH, 0]} rotation={[0, Math.PI / 2, 0]}>
            <TrussBeam length={structL} width={0.4} height={0.4} color="#38bdf8" />
          </group>
        </>
      ) : (
        // Box Grid: 4 towers at 4 corners
        <>
          {/* Back Left Tower */}
          <group position={[-structL / 2, structH / 2, -structW / 2]}>
            <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" />
            <Box args={[0.65, 0.04, 0.65]} position={[0, -structH / 2, 0]}><meshStandardMaterial color="#090d16" /></Box>
            {/* Top Pulley head */}
            <Box args={[0.4, 0.2, 0.4]} position={[0, structH / 2 + 0.1, 0]}><meshStandardMaterial color="#ef4444" /></Box>
          </group>
          {/* Back Right Tower */}
          <group position={[structL / 2, structH / 2, -structW / 2]}>
            <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" />
            <Box args={[0.65, 0.04, 0.65]} position={[0, -structH / 2, 0]}><meshStandardMaterial color="#090d16" /></Box>
            <Box args={[0.4, 0.2, 0.4]} position={[0, structH / 2 + 0.1, 0]}><meshStandardMaterial color="#ef4444" /></Box>
          </group>
          {/* Front Left Tower */}
          <group position={[-structL / 2, structH / 2, structW / 2]}>
            <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" />
            <Box args={[0.65, 0.04, 0.65]} position={[0, -structH / 2, 0]}><meshStandardMaterial color="#090d16" /></Box>
            <Box args={[0.4, 0.2, 0.4]} position={[0, structH / 2 + 0.1, 0]}><meshStandardMaterial color="#ef4444" /></Box>
          </group>
          {/* Front Right Tower */}
          <group position={[structL / 2, structH / 2, structW / 2]}>
            <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" />
            <Box args={[0.65, 0.04, 0.65]} position={[0, -structH / 2, 0]}><meshStandardMaterial color="#090d16" /></Box>
            <Box args={[0.4, 0.2, 0.4]} position={[0, structH / 2 + 0.1, 0]}><meshStandardMaterial color="#ef4444" /></Box>
          </group>

          {/* Horizontal Beams at height structH */}
          {/* Back Beam (X axis) */}
          <group position={[0, structH, -structW / 2]} rotation={[0, Math.PI / 2, 0]}>
            <TrussBeam length={structL} width={0.4} height={0.4} color="#38bdf8" />
          </group>
          {/* Front Beam (X axis) */}
          <group position={[0, structH, structW / 2]} rotation={[0, Math.PI / 2, 0]}>
            <TrussBeam length={structL} width={0.4} height={0.4} color="#38bdf8" />
          </group>
          {/* Left Side Beam (Z axis) */}
          <group position={[-structL / 2, structH, 0]} rotation={[0, 0, 0]}>
            <TrussBeam length={structW} width={0.35} height={0.35} color="#818cf8" />
          </group>
          {/* Right Side Beam (Z axis) */}
          <group position={[structL / 2, structH, 0]} rotation={[0, 0, 0]}>
            <TrussBeam length={structW} width={0.35} height={0.35} color="#818cf8" />
          </group>

          {/* 4 Corner Sleeve Blocks */}
          <Box args={[0.48, 0.48, 0.48]} position={[-structL / 2, structH, -structW / 2]}><meshStandardMaterial color="#1e293b" /></Box>
          <Box args={[0.48, 0.48, 0.48]} position={[structL / 2, structH, -structW / 2]}><meshStandardMaterial color="#1e293b" /></Box>
          <Box args={[0.48, 0.48, 0.48]} position={[-structL / 2, structH, structW / 2]}><meshStandardMaterial color="#1e293b" /></Box>
          <Box args={[0.48, 0.48, 0.48]} position={[structL / 2, structH, structW / 2]}><meshStandardMaterial color="#1e293b" /></Box>
        </>
      )}

      {/* ========================================================
          4. ÉCLAIRAGE (LIGHTING FIXTURES & VOLUMETRIC BEAMS)
          ======================================================== */}
      {lightingFixtures}

      {/* ========================================================
          5. DIMENSION LABELS
          ======================================================== */}
      {showLabels && (
        <>
          <DimensionLabel
            position={[0, stageH + 0.3, stageW / 2 + 0.3]}
            label={`Scène : ${stageL}m × ${stageW}m (H=${Math.round(stageH * 100)}cm)`}
          />
          <DimensionLabel
            position={[0, screenY + screenH / 2 + 0.3, screenZ]}
            label={`Écran LED : ${screenW}m × ${screenH}m (${screen.pitch})`}
          />
          <DimensionLabel
            position={[-structL / 2 - 0.8, structH / 2, 0]}
            label={`Structure : ${structL}m × ${structW}m (H=${structH}m)`}
          />
        </>
      )}
    </group>
  );
}
