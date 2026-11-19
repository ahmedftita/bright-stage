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
  coneLength = 5.5,
  upright = false
}) => {
  const dir = upright ? 1 : -1;
  return (
    <group position={position} rotation={rotation}>
      {/* Base / Clamp */}
      <Box args={[0.22, 0.08, 0.22]} position={[0, upright ? 0.04 : 0.04, 0]}>
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </Box>
      {/* Yoke (U-bracket) */}
      <Box args={[0.06, 0.16, 0.26]} position={[0, dir * 0.12, 0]}>
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </Box>
      {/* Head / Lens */}
      <Cylinder args={[0.09, 0.08, 0.18, 12]} position={[0, dir * 0.24, 0]}>
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.2} />
      </Cylinder>
      {/* Glowing Lens Face */}
      <Cylinder args={[0.08, 0.08, 0.02, 12]} position={[0, dir * 0.33, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.5} />
      </Cylinder>

      {/* Volumetric Light Cone */}
      {showBeam && (
        <group position={[0, dir * (0.34 + coneLength / 2), 0]} rotation={[upright ? 0 : Math.PI, 0, 0]}>
          <Cone args={[coneLength * Math.tan(coneAngle), coneLength, 16, 1, true]}>
            <meshBasicMaterial
              color={color}
              transparent={true}
              opacity={type === 'beam' ? 0.38 : 0.22}
              depthWrite={false}
            />
          </Cone>
        </group>
      )}
    </group>
  );
};

// LED Strobe / Beam Matrix Panel (5x5 / JDC1 style)
const LedMatrixPanel = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Outer Chassis */}
      <Box args={[0.38, 0.38, 0.08]}>
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </Box>
      {/* Front Face Frame */}
      <Box args={[0.34, 0.34, 0.01]} position={[0, 0, 0.041]}>
        <meshStandardMaterial color="#020617" />
      </Box>
      {/* Central High-Intensity White Strobe Tube */}
      <Box args={[0.30, 0.04, 0.015]} position={[0, 0, 0.046]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4.0} />
      </Box>
      {/* Upper RGB LED Matrix section */}
      <Box args={[0.30, 0.11, 0.012]} position={[0, 0.085, 0.044]}>
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.2} />
      </Box>
      {/* Lower RGB LED Matrix section */}
      <Box args={[0.30, 0.11, 0.012]} position={[0, -0.085, 0.044]}>
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2.2} />
      </Box>
      {/* Volumetric Strobe Glow */}
      <Cone args={[0.35, 1.0, 12, 1, true]} position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.16} depthWrite={false} />
      </Cone>
    </group>
  );
};

// Upstage Vertical Truss Totem with Moving Head Beam 280W on top
const UpstageTotem = ({
  position = [0, 0, 0],
  height = 2.5,
  beamColor = '#38bdf8',
  showBeam = true,
  beamFanAngle = 0
}) => {
  const [x, yGround, z] = position;
  return (
    <group position={[x, yGround, z]}>
      {/* Base Plate Acier 600x600x15 mm lestée */}
      <Box args={[0.6, 0.03, 0.6]} position={[0, 0.015, 0]}>
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.2} />
      </Box>
      {/* Rubber feet */}
      <Cylinder args={[0.03, 0.03, 0.02, 8]} position={[-0.25, 0.01, -0.25]}><meshStandardMaterial color="#1e293b" /></Cylinder>
      <Cylinder args={[0.03, 0.03, 0.02, 8]} position={[0.25, 0.01, -0.25]}><meshStandardMaterial color="#1e293b" /></Cylinder>
      <Cylinder args={[0.03, 0.03, 0.02, 8]} position={[-0.25, 0.01, 0.25]}><meshStandardMaterial color="#1e293b" /></Cylinder>
      <Cylinder args={[0.03, 0.03, 0.02, 8]} position={[0.25, 0.01, 0.25]}><meshStandardMaterial color="#1e293b" /></Cylinder>

      {/* Vertical Truss Column (section 290mm) */}
      <group position={[0, height / 2, 0]}>
        <TrussBeam length={height} width={0.29} height={0.29} color="#94a3b8" />
      </group>

      {/* Top Mounting Plate 350x350 mm */}
      <Box args={[0.35, 0.02, 0.35]} position={[0, height + 0.01, 0]}>
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </Box>

      {/* Moving Head Beam 280W (Robe Pointe / Sharpy) mounted upright on top */}
      <MovingFixture
        position={[0, height + 0.02, 0]}
        type="beam"
        color={beamColor}
        showBeam={showBeam}
        coneAngle={0.065}
        coneLength={9.5}
        upright={true}
        rotation={[-0.18, 0, beamFanAngle]} // Angled slightly forward and fanned out
      />
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

  // Upstage Vertical Totems with Beam 280W (derrière l'écran LED)
  const upstageTotems = useMemo(() => {
    const totemsConfig = structure.totems;
    if (!totemsConfig || !totemsConfig.count || totemsConfig.count <= 0) return [];
    const count = totemsConfig.count;
    const height = totemsConfig.heightM || 2.5;
    const totemZ = screenZ - 0.55;
    const items = [];

    // Span behind screen or across back stage
    const span = Math.min(stageL - 1.2, Math.max(2.8, screenW + 0.8));
    const spacing = count > 1 ? span / (count - 1) : 0;
    const startX = count > 1 ? -span / 2 : 0;

    for (let i = 0; i < count; i++) {
      const x = count > 1 ? (startX + i * spacing) : 0;
      // Slight fan angle outward
      const fanAngle = count > 1 ? ((i - (count - 1) / 2) / (count - 1)) * 0.22 : 0;
      items.push(
        <UpstageTotem
          key={`totem-${i}`}
          position={[x, 0, totemZ]}
          height={height}
          beamColor={beamColor}
          showBeam={showBeams}
          beamFanAngle={fanAngle}
        />
      );
    }
    return items;
  }, [structure.totems, stageL, screenW, screenZ, beamColor, showBeams]);

  // Lateral LED Matrices (5 à gauche et 5 à droite de l'écran LED)
  const sideScreenMatrices = useMemo(() => {
    const countPerSide = lighting.sideMatricesCount || 0;
    if (countPerSide <= 0) return [];
    const items = [];
    const margin = 0.38;
    const xLeft = -screenW / 2 - margin;
    const xRight = screenW / 2 + margin;
    const z = screenZ;

    // Distribute vertically across screen height
    const topY = screenY + (screenH / 2) - 0.25;
    const botY = screenY - (screenH / 2) + 0.25;
    const stepY = countPerSide > 1 ? (topY - botY) / (countPerSide - 1) : 0;

    // Aluminum boom pipes holding the matrices
    items.push(
      <Cylinder key="boom-pipe-left" args={[0.024, 0.024, screenH + 0.3, 8]} position={[xLeft, screenY, z - 0.05]}>
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </Cylinder>
    );
    items.push(
      <Cylinder key="boom-pipe-right" args={[0.024, 0.024, screenH + 0.3, 8]} position={[xRight, screenY, z - 0.05]}>
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </Cylinder>
    );

    for (let i = 0; i < countPerSide; i++) {
      const y = countPerSide > 1 ? (botY + i * stepY) : screenY;
      // Left matrix
      items.push(
        <LedMatrixPanel
          key={`mat-left-${i}`}
          position={[xLeft, y, z]}
          rotation={[0, 0.18, 0]}
        />
      );
      // Right matrix
      items.push(
        <LedMatrixPanel
          key={`mat-right-${i}`}
          position={[xRight, y, z]}
          rotation={[0, -0.18, 0]}
        />
      );
    }
    return items;
  }, [lighting.sideMatricesCount, screenW, screenH, screenY, screenZ]);

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
          5. TOTEMS FOND DE SCÈNE (AVEC LYRES BEAM 280W)
          ======================================================== */}
      {upstageTotems}

      {/* ========================================================
          6. MATRICES LED LATÉRALES (STROBE / BEAM FLANCS ÉCRAN)
          ======================================================== */}
      {sideScreenMatrices}

      {/* ========================================================
          7. DIMENSION LABELS
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
          {structure.totems?.count > 0 && (
            <DimensionLabel
              position={[0, (structure.totems.heightM || 2.5) + 0.5, screenZ - 0.6]}
              label={`${structure.totems.count}x Totems Truss (H=${structure.totems.heightM || 2.5}m) + Beams 280W`}
            />
          )}
          {lighting.sideMatricesCount > 0 && (
            <DimensionLabel
              position={[screenW / 2 + 0.9, screenY, screenZ]}
              label={`${lighting.totalSideMatrices}x Matrices LED Strobe (5G + 5D)`}
            />
          )}
        </>
      )}
    </group>
  );
}
