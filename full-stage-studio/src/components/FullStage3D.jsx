import React, { useMemo, useEffect } from 'react';
import { Box, Cylinder, Cone, Sphere, Html } from '@react-three/drei';
import { CanvasTexture } from 'three';
import { getFixtureTypeForPosition } from '../utils/conceptionLogic';

/**
 * Full Stage 3D Studio Visualizer
 * Renders:
 * 1. Stage podium (deck, legs, skirting, stairs)
 * 2. Truss structure (towers, beams, sleeves, base plates)
 * 3. LED Screen (back wall with glow & frame)
 * 4. Lighting fixtures (moving heads, blinders, led bars, volumetric beams)
 */

// Simple Truss Beam helper
// Truss Beam helper with explicit axis orientation
const TrussBeam = ({ length, width = 0.35, height = 0.35, color = '#64748b', axis = 'y' }) => {
  const halfW = width / 2;
  const halfH = height / 2;
  const tubeR = 0.024;
  const braceInterval = 0.5;
  const count = Math.max(1, Math.floor(length / braceInterval));
  const braces = [];

  for (let i = 0; i < count; i++) {
    const y = (i * braceInterval) - (length / 2) + (braceInterval / 2);
    // X-axis braces
    braces.push(
      <Cylinder key={`bx1-${i}`} args={[0.01, 0.01, width, 4]} position={[0, y, halfH]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </Cylinder>
    );
    braces.push(
      <Cylinder key={`bx2-${i}`} args={[0.01, 0.01, width, 4]} position={[0, y, -halfH]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </Cylinder>
    );
    // Z-axis braces
    braces.push(
      <Cylinder key={`bz1-${i}`} args={[0.01, 0.01, height, 4]} position={[halfW, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </Cylinder>
    );
    braces.push(
      <Cylinder key={`bz2-${i}`} args={[0.01, 0.01, height, 4]} position={[-halfW, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </Cylinder>
    );
  }

  // group rotation based on axis
  // 'y': vertical (standing up)
  // 'x': horizontal along X (left to right)
  // 'z': horizontal along Z (front to back)
  const groupRot = axis === 'x' ? [0, 0, -Math.PI / 2] : (axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]);

  return (
    <group rotation={groupRot}>
      <Cylinder args={[tubeR, tubeR, length, 8]} position={[halfW, 0, halfH]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[tubeR, tubeR, length, 8]} position={[-halfW, 0, halfH]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[tubeR, tubeR, length, 8]} position={[halfW, 0, -halfH]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[tubeR, tubeR, length, 8]} position={[-halfW, 0, -halfH]}>
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
  const isBeam = type === 'beam';
  return (
    <group position={position} rotation={rotation}>
      {/* Base / Clamp */}
      <Box args={[0.22, 0.08, 0.22]} position={[0, dir * 0.04, 0]}>
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </Box>
      {/* Yoke (U-bracket) */}
      <Box args={[0.06, 0.16, 0.26]} position={[0, dir * 0.12, 0]}>
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </Box>
      {/* Head / Lens Chassis */}
      <Cylinder args={[0.09, 0.08, 0.18, 12]} position={[0, dir * 0.24, 0]}>
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.2} />
      </Cylinder>
      {/* Compact Glowing Lens Face */}
      <Cylinder args={[0.075, 0.075, 0.015, 12]} position={[0, dir * 0.33, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.5} />
      </Cylinder>

      {/* Volumetric Light Cone: apex starts at lens (Y=dir*0.34) and expands cleanly without oversized lamp disc */}
      {showBeam && (
        <group
          position={[0, dir * (0.34 + coneLength / 2), 0]}
          rotation={[upright ? Math.PI : 0, 0, 0]}
        >
          <Cone args={[coneLength * Math.tan(coneAngle), coneLength, 20, 1, true]}>
            <meshBasicMaterial
              color={color}
              transparent={true}
              opacity={isBeam ? 0.32 : 0.18}
              depthWrite={false}
            />
          </Cone>
        </group>
      )}
    </group>
  );
};

// 36LED Strobe Beam 220W (LeLeght / Swingable 180° Wallwasher & Strobe Moving Head)
const StrobeBeam36Fixture = ({ position, rotation = [0, 0, 0], showBeam = true, tilt = 0.15 }) => {
  // 36 Warm White / Amber Beam Lenses in 4 rows x 9 columns
  const lenses = useMemo(() => {
    const list = [];
    const cols = 9;
    const rows = 4;
    const startX = -0.14;
    const stepX = 0.28 / (cols - 1);
    const startY = 0.052;
    const stepY = 0.104 / (rows - 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lx = startX + c * stepX;
        const ly = startY - r * stepY;
        list.push(
          <group key={`sb-lens-${r}-${c}`} position={[lx, ly, 0.043]}>
            {/* Convex lens collar */}
            <Cylinder args={[0.012, 0.013, 0.005, 8]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </Cylinder>
            {/* Convex warm amber/gold LED bead */}
            <Sphere args={[0.010, 8, 8]} position={[0, 0, 0.003]}>
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f59e0b"
                emissiveIntensity={3.2}
                roughness={0.1}
              />
            </Sphere>
          </group>
        );
      }
    }
    return list;
  }, []);

  return (
    <group position={position} rotation={rotation}>
      {/* 1. Base / Motorized Chassis */}
      <Box args={[0.44, 0.07, 0.13]} position={[0, -0.09, 0]}>
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </Box>

      {/* Digital Display Screen 8.8.8.8. */}
      <Box args={[0.065, 0.022, 0.005]} position={[0, -0.088, 0.066]}>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} />
      </Box>
      {/* 4 Menu Buttons */}
      <Box args={[0.035, 0.006, 0.004]} position={[0, -0.106, 0.066]}>
        <meshStandardMaterial color="#94a3b8" />
      </Box>
      {/* "36LED STROBE BEAM" White Silkscreen text bar */}
      <Box args={[0.13, 0.012, 0.003]} position={[0.12, -0.09, 0.066]}>
        <meshStandardMaterial color="#cbd5e1" emissive="#f8fafc" emissiveIntensity={0.6} />
      </Box>

      {/* 2. Side Yokes / Upright Arms */}
      {/* Left Arm */}
      <Box args={[0.045, 0.16, 0.11]} position={[-0.20, -0.01, 0]}>
        <meshStandardMaterial color="#0b0f19" roughness={0.3} metalness={0.8} />
      </Box>
      {/* Left Tilt Hub */}
      <Cylinder args={[0.028, 0.028, 0.015, 12]} position={[-0.178, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </Cylinder>

      {/* Right Arm */}
      <Box args={[0.045, 0.16, 0.11]} position={[0.20, -0.01, 0]}>
        <meshStandardMaterial color="#0b0f19" roughness={0.3} metalness={0.8} />
      </Box>
      {/* Right Tilt Hub */}
      <Cylinder args={[0.028, 0.028, 0.015, 12]} position={[0.178, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </Cylinder>

      {/* Back Clamp mount */}
      <Cylinder args={[0.018, 0.018, 0.05, 8]} position={[0, -0.09, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </Cylinder>

      {/* 3. Tilting Rectangular Head (Pivot at Y=0.02) */}
      <group position={[0, 0.02, 0]} rotation={[tilt, 0, 0]}>
        {/* Head outer chassis */}
        <Box args={[0.35, 0.16, 0.08]}>
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </Box>
        {/* Rear heat sink fins */}
        <Box args={[0.33, 0.14, 0.015]} position={[0, 0, -0.045]}>
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </Box>

        {/* Front Face Panel frame */}
        <Box args={[0.33, 0.145, 0.005]} position={[0, 0, 0.04]}>
          <meshStandardMaterial color="#020617" />
        </Box>

        {/* 648 RGB SMD LED matrix backlight background (3 colored zones) */}
        {/* Zone 1: Green/Cyan */}
        <Box args={[0.10, 0.135, 0.006]} position={[-0.105, 0, 0.041]}>
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.8} />
        </Box>
        {/* Zone 2: Amber/Gold / Warm Center */}
        <Box args={[0.10, 0.135, 0.006]} position={[0, 0, 0.041]}>
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2.0} />
        </Box>
        {/* Zone 3: Blue/Purple/Magenta */}
        <Box args={[0.10, 0.135, 0.006]} position={[0.105, 0, 0.041]}>
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.8} />
        </Box>

        {/* 36 Warm White / Amber Beam Lenses */}
        {lenses}

        {/* 4. Volumetric Light Beams (when active) */}
        {showBeam && (
          <group position={[0, 0, 0.05]}>
            {/* Wide wash & strobe glow */}
            <Cone args={[0.45, 2.5, 16, 1, true]} position={[0, 0, 1.25]} rotation={[-Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#fef08a" transparent opacity={0.16} depthWrite={false} />
            </Cone>
            {/* Intense Warm Center Beams */}
            <Cone args={[0.22, 3.2, 12, 1, true]} position={[0, 0, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#ffffff" transparent opacity={0.26} depthWrite={false} />
            </Cone>
            {/* Lateral RGB Strobe Wash Cone */}
            <Cone args={[0.55, 2.0, 12, 1, true]} position={[0, 0, 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.10} depthWrite={false} />
            </Cone>
          </group>
        )}
      </group>
    </group>
  );
};

// 1. Blinder COB LED 2 Yeux (2x100W Warm White / Amber) - Image 2
const BlinderCob2EyeFixture = ({ position, rotation = [0, 0, 0], showBeam = true, tilt = 0.15 }) => {
  return (
    <group position={position} rotation={rotation}>
      <group rotation={[tilt, 0, 0]}>
        {/* Main rectangular black aluminum housing */}
        <Box args={[0.36, 0.18, 0.12]}>
          <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.8} />
        </Box>
        {/* Rear heat sink fins */}
        <Box args={[0.34, 0.16, 0.02]} position={[0, 0, -0.065]}>
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </Box>
        {/* Top/Side U-bracket */}
        <Box args={[0.40, 0.012, 0.04]} position={[0, 0.10, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>
        <Box args={[0.012, 0.18, 0.035]} position={[-0.195, 0.01, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>
        <Box args={[0.012, 0.18, 0.035]} position={[0.195, 0.01, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>
        {/* Adjustment knobs */}
        <Cylinder args={[0.018, 0.018, 0.02, 12]} position={[-0.205, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </Cylinder>
        <Cylinder args={[0.018, 0.018, 0.02, 12]} position={[0.205, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </Cylinder>

        {/* EYE 1: Left COB Cell */}
        <group position={[-0.088, 0, 0.055]}>
          <Cylinder args={[0.075, 0.075, 0.01, 24]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </Cylinder>
          <Cylinder args={[0.070, 0.032, 0.035, 24]} position={[0, 0, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </Cylinder>
          <Box args={[0.024, 0.024, 0.005]} position={[0, 0, -0.025]}>
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={3.5} />
          </Box>
          <Cylinder args={[0.068, 0.068, 0.003, 24]} position={[0, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={1.8} transparent opacity={0.85} />
          </Cylinder>
          {showBeam && (
            <group position={[0, 0, 0.02]}>
              <Cylinder args={[0.07, 0.42, 2.8, 16, 1, true]} position={[0, 0, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#fef08a" transparent opacity={0.18} depthWrite={false} side={2} />
              </Cylinder>
              <Cylinder args={[0.03, 0.22, 2.8, 16, 1, true]} position={[0, 0, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} side={2} />
              </Cylinder>
            </group>
          )}
        </group>

        {/* EYE 2: Right COB Cell */}
        <group position={[0.088, 0, 0.055]}>
          <Cylinder args={[0.075, 0.075, 0.01, 24]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </Cylinder>
          <Cylinder args={[0.070, 0.032, 0.035, 24]} position={[0, 0, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </Cylinder>
          <Box args={[0.024, 0.024, 0.005]} position={[0, 0, -0.025]}>
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={3.5} />
          </Box>
          <Cylinder args={[0.068, 0.068, 0.003, 24]} position={[0, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={1.8} transparent opacity={0.85} />
          </Cylinder>
          {showBeam && (
            <group position={[0, 0, 0.02]}>
              <Cylinder args={[0.07, 0.42, 2.8, 16, 1, true]} position={[0, 0, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#fef08a" transparent opacity={0.18} depthWrite={false} side={2} />
              </Cylinder>
              <Cylinder args={[0.03, 0.22, 2.8, 16, 1, true]} position={[0, 0, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} side={2} />
              </Cylinder>
            </group>
          )}
        </group>
      </group>
    </group>
  );
};

// 2. Projecteur Décoratif Vintage Retro Bowl Ø55cm (Style Portman P1) - Image 3
const RetroVintageBowlFixture = ({ position, rotation = [0, 0, 0], showBeam = true, tilt = 0.15 }) => {
  return (
    <group position={position} rotation={rotation}>
      <group rotation={[tilt, 0, 0]}>
        {/* Outer dark grey shell */}
        <Cylinder args={[0.22, 0.12, 0.14, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.7} />
        </Cylinder>
        {/* Outer rim bezel */}
        <Cylinder args={[0.225, 0.225, 0.015, 32]} position={[0, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </Cylinder>

        {/* Inner Golden Hammered Parabolic Reflector Dish */}
        <Cylinder args={[0.21, 0.07, 0.12, 32]} position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color="#eab308"
            emissive="#78350f"
            emissiveIntensity={0.9}
            metalness={0.92}
            roughness={0.35}
          />
        </Cylinder>

        {/* Concentric metal rings */}
        <Cylinder args={[0.15, 0.15, 0.006, 24]} position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Cylinder>
        <Cylinder args={[0.09, 0.09, 0.006, 24]} position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Cylinder>
        {/* Radial struts */}
        <Box args={[0.38, 0.006, 0.006]} position={[0, 0, 0.05]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>
        <Box args={[0.006, 0.38, 0.006]} position={[0, 0, 0.05]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>

        {/* Central Black Dome Cap */}
        <Sphere args={[0.042, 16, 16]} position={[0, 0, 0.055]}>
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </Sphere>
        {/* Warm Tungsten Corona Halo */}
        <Cylinder args={[0.055, 0.055, 0.004, 20]} position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={3.8} />
        </Cylinder>

        {/* Rear mounting bracket */}
        <Box args={[0.46, 0.015, 0.04]} position={[0, -0.02, -0.06]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>
        <Box args={[0.015, 0.22, 0.035]} position={[-0.23, 0, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>
        <Box args={[0.015, 0.22, 0.035]} position={[0.23, 0, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>

        {/* Volumetric Warm Golden Light Beam */}
        {showBeam && (
          <group position={[0, 0, 0.07]}>
            <Cylinder args={[0.20, 0.75, 3.2, 24, 1, true]} position={[0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.16} depthWrite={false} side={2} />
            </Cylinder>
            <Cylinder args={[0.08, 0.40, 3.2, 24, 1, true]} position={[0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#fef08a" transparent opacity={0.22} depthWrite={false} side={2} />
            </Cylinder>
          </group>
        )}
      </group>
    </group>
  );
};

// 3. Projecteur Halogène Vintage Rond Ø50cm avec Grille Croix (Style Portman P2) - Image 4
const VintageHalogenRoundFixture = ({ position, rotation = [0, 0, 0], showBeam = true, tilt = 0.15 }) => {
  return (
    <group position={position} rotation={rotation}>
      <group rotation={[tilt, 0, 0]}>
        {/* Silver Aluminum Drum body */}
        <Cylinder args={[0.20, 0.20, 0.13, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.25} />
        </Cylinder>
        {/* Silver Front Bezel with bolts */}
        <Cylinder args={[0.21, 0.21, 0.015, 32]} position={[0, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
        </Cylinder>

        {/* Amber / Warm Halogen Reflector dish inside */}
        <Cylinder args={[0.19, 0.08, 0.10, 32]} position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color="#ea580c"
            emissive="#9a3412"
            emissiveIntensity={1.2}
            metalness={0.85}
            roughness={0.3}
          />
        </Cylinder>

        {/* Central Halogen tungsten bulb */}
        <Sphere args={[0.024, 12, 12]} position={[0, 0, 0.03]}>
          <meshStandardMaterial color="#ffedd5" emissive="#ea580c" emissiveIntensity={3.5} />
        </Sphere>

        {/* Distinctive Cross (+) Front Grille */}
        <Cylinder args={[0.03, 0.03, 0.008, 16]} position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
        </Cylinder>
        <Box args={[0.39, 0.014, 0.008]} position={[0, 0, 0.07]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
        </Box>
        <Box args={[0.014, 0.39, 0.008]} position={[0, 0, 0.07]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
        </Box>
        <Cylinder args={[0.19, 0.19, 0.002, 32]} position={[0, 0, 0.066]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#d97706" emissive="#b45309" emissiveIntensity={1.0} wireframe />
        </Cylinder>

        {/* Tubular Silver Yoke */}
        <Box args={[0.44, 0.02, 0.04]} position={[0, -0.04, -0.06]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.88} />
        </Box>
        <Box args={[0.02, 0.22, 0.035]} position={[-0.22, 0, 0]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.88} />
        </Box>
        <Box args={[0.02, 0.22, 0.035]} position={[0.22, 0, 0]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.88} />
        </Box>

        {/* Volumetric Amber Light Beam */}
        {showBeam && (
          <group position={[0, 0, 0.07]}>
            <Cylinder args={[0.19, 0.65, 3.2, 24, 1, true]} position={[0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#f97316" transparent opacity={0.17} depthWrite={false} side={2} />
            </Cylinder>
            <Cylinder args={[0.06, 0.35, 3.2, 24, 1, true]} position={[0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#fed7aa" transparent opacity={0.24} depthWrite={false} side={2} />
            </Cylinder>
          </group>
        )}
      </group>
    </group>
  );
};

// 4. Projecteur PAR LED 18×12W RGBW Multi-Lentilles - Image 1
const ParLed18Fixture = ({ position, rotation = [0, 0, 0], showBeam = true, tilt = 0.15, beamColor = '#38bdf8' }) => {
  const lenses = useMemo(() => {
    const list = [];
    list.push({ x: 0, y: 0 });
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5;
      list.push({ x: Math.cos(a) * 0.044, y: Math.sin(a) * 0.044 });
    }
    for (let i = 0; i < 12; i++) {
      const a = (i * 2 * Math.PI) / 12 + 0.15;
      list.push({ x: Math.cos(a) * 0.084, y: Math.sin(a) * 0.084 });
    }
    return list;
  }, []);

  return (
    <group position={position} rotation={rotation}>
      <group rotation={[tilt, 0, 0]}>
        {/* PAR Can Front Barrel */}
        <Cylinder args={[0.125, 0.105, 0.14, 24]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </Cylinder>
        {/* PAR Can Rear Cone */}
        <Cylinder args={[0.105, 0.065, 0.09, 24]} position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
        </Cylinder>
        {/* Front Bezel Collar */}
        <Cylinder args={[0.13, 0.13, 0.015, 24]} position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#020617" metalness={0.85} />
        </Cylinder>

        {/* 18 Lenses cluster on front face */}
        {lenses.map((l, idx) => (
          <group key={`par-lens-${idx}`} position={[l.x, l.y, 0.072]}>
            <Cylinder args={[0.016, 0.016, 0.005, 12]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </Cylinder>
            <Sphere args={[0.013, 10, 10]} position={[0, 0, 0.003]}>
              <meshStandardMaterial color={beamColor} emissive={beamColor} emissiveIntensity={2.8} />
            </Sphere>
          </group>
        ))}

        {/* Dual Mounting Yoke with Side Knobs */}
        <Box args={[0.28, 0.012, 0.035]} position={[0, -0.06, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>
        <Box args={[0.012, 0.16, 0.03]} position={[-0.14, 0, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>
        <Box args={[0.012, 0.16, 0.03]} position={[0.14, 0, 0]}>
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </Box>
        <Cylinder args={[0.016, 0.016, 0.02, 10]} position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </Cylinder>
        <Cylinder args={[0.016, 0.016, 0.02, 10]} position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </Cylinder>

        {/* Volumetric PAR Wash/Beam Cone */}
        {showBeam && (
          <group position={[0, 0, 0.08]}>
            <Cylinder args={[0.12, 0.50, 3.0, 16, 1, true]} position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color={beamColor} transparent opacity={0.20} depthWrite={false} side={2} />
            </Cylinder>
            <Cylinder args={[0.04, 0.25, 3.0, 16, 1, true]} position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} side={2} />
            </Cylinder>
          </group>
        )}
      </group>
    </group>
  );
};

// Dispatcher Component for Side / Flank Scenic Fixtures
const SideScenicFixture = ({
  fixtureType = 'cob_blinder_2eye',
  position,
  rotation = [0, 0, 0],
  showBeam = true,
  tilt = 0.15,
  beamColor = '#38bdf8'
}) => {
  switch (fixtureType) {
    case 'cob_blinder_2eye':
      return <BlinderCob2EyeFixture position={position} rotation={rotation} showBeam={showBeam} tilt={tilt} />;
    case 'retro_bowl':
      return <RetroVintageBowlFixture position={position} rotation={rotation} showBeam={showBeam} tilt={tilt} />;
    case 'vintage_round':
      return <VintageHalogenRoundFixture position={position} rotation={rotation} showBeam={showBeam} tilt={tilt} />;
    case 'par_led_18':
      return <ParLed18Fixture position={position} rotation={rotation} showBeam={showBeam} tilt={tilt} beamColor={beamColor} />;
    case 'strobe_beam_36':
    default:
      return <StrobeBeam36Fixture position={position} rotation={rotation} showBeam={showBeam} tilt={tilt} />;
  }
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
      {/* Angled forward towards audience/face ("en face") */}
      <MovingFixture
        position={[0, height + 0.02, 0]}
        type="beam"
        color={beamColor}
        showBeam={showBeam}
        coneAngle={0.065}
        coneLength={9.5}
        upright={true}
        rotation={[0.32, 0, beamFanAngle]}
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

  const isStageEnabled = stage.enabled !== false;
  const isStructureEnabled = structure.enabled !== false;
  const isScreenEnabled = screen.enabled !== false;
  const isLightingEnabled = lighting.enabled !== false;

  // Dimensions
  const stageL = isStageEnabled ? stage.dimensions.lengthM : 0;
  const stageW = isStageEnabled ? stage.dimensions.widthM : 0;
  const stageH = isStageEnabled ? stage.dimensions.heightM : 0;

  const structL = structure.dimensions.length;
  const structW = structure.dimensions.width;
  const structH = structure.dimensions.height;
  const isGoalpost = structure.isGoalpost;

  const screenW = screen.dimensions.widthM;
  const screenH = screen.dimensions.heightM;
  // USER REQUEST: "lecran debut depuis la scene svp" -> L'écran démarre posé directement sur le plateau de scène
  const screenBottomY = isStageEnabled ? stageH : 0;
  const isScreenSuspended = isStructureEnabled && (screen.mountType === 'suspended_truss') && !screen.startFromStage;
  const screenY = isScreenSuspended
    ? (stageH + 0.6 + screenH / 2)
    : (screenBottomY + screenH / 2);

  // Positions
  // Stage is centered on X=0, Y=stageH/2, Z=0
  const stageCenterY = stageH / 2;

  // Screen is placed near the back edge of stage: Z = -stageW/2 + 0.35m (or centered if no stage)
  const screenZ = isStageEnabled ? (-stageW / 2 + 0.35) : (isStructureEnabled ? -structW / 2 + 0.5 : 0);

  // Lighting parameters
  const beamColor = lighting.beamColor || '#38bdf8';
  const showBeams = isLightingEnabled && lighting.showBeams;

  // Dynamic Canvas Texture for LED Screen: Bright Stage Logo + "Réalisé avec Ahmed Ftita"
  const screenTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Dark futuristic concert stage background gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w / 1.1);
    bgGrad.addColorStop(0, '#1e1b4b'); // deep indigo
    bgGrad.addColorStop(0.55, '#090d16'); // dark slate
    bgGrad.addColorStop(1, '#020617'); // obsidian black
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Subtle LED cabinet grid lines (representing 500x500mm tiles)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1.5;
    const gridCols = screen.cabinets?.width || 8;
    const gridRows = screen.cabinets?.height || 5;
    for (let c = 1; c < gridCols; c++) {
      const gx = (c / gridCols) * w;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let r = 1; r < gridRows; r++) {
      const gy = (r / gridRows) * h;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // 3. Ambient neon lighting aura / glow behind logo
    const glowGrad = ctx.createRadialGradient(w / 2, h * 0.38, 20, w / 2, h * 0.38, 260);
    glowGrad.addColorStop(0, 'rgba(236, 72, 153, 0.5)'); // hot pink magenta aura
    glowGrad.addColorStop(0.45, 'rgba(99, 102, 241, 0.35)'); // vibrant indigo aura
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.38, 260, 0, Math.PI * 2);
    ctx.fill();

    // 4. Logo Icon: Glowing "BS" Stage Crest
    const badgeW = 96;
    const badgeH = 96;
    const badgeX = w / 2 - badgeW / 2;
    const badgeY = h * 0.16;

    ctx.save();
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 24;
    const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    badgeGrad.addColorStop(0, '#ec4899');
    badgeGrad.addColorStop(1, '#6366f1');
    ctx.fillStyle = badgeGrad;
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 18);
      ctx.fill();
    } else {
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.restore();

    // Badge letters "BS"
    ctx.font = '900 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('BS', w / 2, badgeY + badgeH / 2);

    // 5. Brand Title: "BRIGHT STAGE"
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.font = '900 62px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('BRIGHT STAGE', w / 2, h * 0.48);
    ctx.restore();

    // Cyan subtitle / tag
    ctx.save();
    ctx.font = '700 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('PROFESSIONAL STAGE & LIGHTING DESIGN', w / 2, h * 0.58);
    ctx.restore();

    // 6. Gold / Amber Accent Line
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 160, h * 0.67);
    ctx.lineTo(w / 2 + 160, h * 0.67);
    ctx.stroke();
    ctx.restore();

    // 7. USER REQUEST: "réalisé avec ahmed ftita"
    ctx.save();
    ctx.font = 'italic 700 28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fef08a'; // glowing warm gold/cream
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 16;
    ctx.fillText('Réalisé avec Ahmed Ftita', w / 2, h * 0.78);
    ctx.restore();

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [screenW, screenH, screen.cabinets]);

  useEffect(() => {
    return () => {
      if (screenTexture) screenTexture.dispose();
    };
  }, [screenTexture]);

  // Generate stairs steps
  const stairSteps = useMemo(() => {
    if (!isStageEnabled || !stage.hasStairs || stage.counts.stairs === 0 || stageH <= 0) return [];
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
    // If structure is disabled or Gril is deactivated (structureType === 'none'), no fixtures hang in midair
    if (!isStructureEnabled || structure.structureType === 'none') return [];
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
    if (!isStructureEnabled) return [];
    const totemsConfig = structure.totems;
    if (!totemsConfig || !totemsConfig.count || totemsConfig.count <= 0) return [];
    const count = totemsConfig.count;
    const height = totemsConfig.heightM || 2.5;
    const totemZ = screenZ - 0.55;
    const items = [];

    // Span behind screen or across back stage
    const span = Math.min(Math.max(2.8, stageL > 0 ? stageL - 1.2 : 4), Math.max(2.8, screenW + 0.8));
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
          showBeam={isLightingEnabled && showBeams}
          beamFanAngle={fanAngle}
        />
      );
    }
    return items;
  }, [isStructureEnabled, isLightingEnabled, structure.totems, stageL, screenW, screenZ, beamColor, showBeams]);

  // Lateral / Horizontal LED Fixtures (Orientation verticale ou horizontale, multiples flancs, 4 modèles au choix)
  const sideScreenMatrices = useMemo(() => {
    if (!isScreenEnabled || !isLightingEnabled) return [];
    const countPerFlanc = lighting.sideMatricesCount || 0;
    if (countPerFlanc <= 0) return [];

    const flancsCount = Math.max(1, parseInt(lighting.sideMatricesFlancs) || 1);
    const orientation = lighting.sideMatricesOrientation || 'horizontal'; // 'horizontal' | 'vertical'
    const positionMode = lighting.sideMatricesPosition || 'lateral'; // 'lateral' | 'horizontal_floor'
    const rotZ = orientation === 'vertical' ? Math.PI / 2 : 0;
    const items = [];

    if (positionMode === 'horizontal_floor') {
      // USER OPTION: Horizontal rows along the stage deck in front of the screen
      const totalCount = countPerFlanc * flancsCount * 2;
      const spacing = (screenW - 0.3) / Math.max(1, totalCount - 1);
      const startX = -screenW / 2 + 0.15;
      const y = screenBottomY + (orientation === 'vertical' ? 0.22 : 0.09);
      const z = screenZ + 0.32;

      for (let i = 0; i < totalCount; i++) {
        const x = totalCount > 1 ? startX + i * spacing : 0;
        const fType = getFixtureTypeForPosition({
          mode: lighting.sideFixtureMode || 'single',
          singleType: lighting.sideFixtureType || 'cob_blinder_2eye',
          fixtureA: lighting.sideFixtureA || 'cob_blinder_2eye',
          fixtureB: lighting.sideFixtureB || 'retro_bowl',
          flancIndex: 0,
          itemIndex: i,
          totalFlancs: 1,
          countPerFlanc: totalCount
        });
        items.push(
          <SideScenicFixture
            fixtureType={fType}
            key={`sb-floor-${i}`}
            position={[x, y, z]}
            rotation={[0, 0, rotZ]}
            showBeam={showBeams}
            tilt={0.22}
            beamColor={lighting.beamColor || '#38bdf8'}
          />
        );
      }
    } else {
      // Default & USER REQUEST: Multiple Lateral Flanks / Wings on left and right sides of the LED screen
      // Configurable distance between screen and first flank, and distance between flanks
      const baseMargin = typeof lighting.sideMatricesMargin === 'number'
        ? lighting.sideMatricesMargin
        : (orientation === 'vertical' ? 0.28 : 0.40);
      const flancSpacing = typeof lighting.sideMatricesFlancSpacing === 'number'
        ? lighting.sideMatricesFlancSpacing
        : (orientation === 'vertical' ? 0.32 : 0.50);

      // Distribute vertically across screen height
      const topY = screenY + (screenH / 2) - (orientation === 'vertical' ? 0.32 : 0.24);
      const botY = screenY - (screenH / 2) + (orientation === 'vertical' ? 0.32 : 0.24);
      const stepY = countPerFlanc > 1 ? (topY - botY) / (countPerFlanc - 1) : 0;

      for (let f = 0; f < flancsCount; f++) {
        const offset = f * flancSpacing;
        const xLeft = -screenW / 2 - baseMargin - offset;
        const xRight = screenW / 2 + baseMargin + offset;
        // Concert stage curved wing angle (flanks angled slightly forward toward audience)
        const wingAngle = 0.18 + f * 0.08;
        const zFlanc = screenZ - (f * 0.12);

        // Aluminum boom pipes holding this flank
        items.push(
          <Cylinder key={`boom-pipe-left-${f}`} args={[0.024, 0.024, screenH + 0.2, 8]} position={[xLeft, screenY, zFlanc - 0.05]}>
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </Cylinder>
        );
        items.push(
          <Cylinder key={`boom-pipe-right-${f}`} args={[0.024, 0.024, screenH + 0.2, 8]} position={[xRight, screenY, zFlanc - 0.05]}>
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </Cylinder>
        );

        for (let i = 0; i < countPerFlanc; i++) {
          const y = countPerFlanc > 1 ? (botY + i * stepY) : screenY;
          const tiltAngle = countPerFlanc > 1 ? ((i - (countPerFlanc - 1) / 2) * -0.05) : 0;
          const fType = getFixtureTypeForPosition({
            mode: lighting.sideFixtureMode || 'single',
            singleType: lighting.sideFixtureType || 'cob_blinder_2eye',
            fixtureA: lighting.sideFixtureA || 'cob_blinder_2eye',
            fixtureB: lighting.sideFixtureB || 'retro_bowl',
            flancIndex: f,
            itemIndex: i,
            totalFlancs: flancsCount,
            countPerFlanc
          });

          // Left flank fixture
          items.push(
            <SideScenicFixture
              fixtureType={fType}
              key={`mat-left-${f}-${i}`}
              position={[xLeft, y, zFlanc]}
              rotation={[0, wingAngle, rotZ]}
              showBeam={showBeams}
              tilt={tiltAngle}
              beamColor={lighting.beamColor || '#38bdf8'}
            />
          );
          // Right flank fixture
          items.push(
            <SideScenicFixture
              fixtureType={fType}
              key={`mat-right-${f}-${i}`}
              position={[xRight, y, zFlanc]}
              rotation={[0, -wingAngle, rotZ]}
              showBeam={showBeams}
              tilt={tiltAngle}
              beamColor={lighting.beamColor || '#38bdf8'}
            />
          );
        }
      }
    }
    return items;
  }, [
    isScreenEnabled,
    isLightingEnabled,
    lighting.sideMatricesCount,
    lighting.sideMatricesFlancs,
    lighting.sideMatricesMargin,
    lighting.sideMatricesFlancSpacing,
    lighting.sideMatricesOrientation,
    lighting.sideMatricesPosition,
    lighting.sideFixtureMode,
    lighting.sideFixtureType,
    lighting.sideFixtureA,
    lighting.sideFixtureB,
    lighting.beamColor,
    screenW,
    screenH,
    screenY,
    screenZ,
    screenBottomY,
    showBeams
  ]);

  return (
    <group>
      {/* ========================================================
          1. STAGE (SCÈNE & PODIUMS MODULAIRES)
          ======================================================== */}
      {isStageEnabled && (
        <>
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
        </>
      )}

      {/* ========================================================
          2. ÉCRAN LED (MUR VIDÉO FOND DE SCÈNE)
          ======================================================== */}
      {isScreenEnabled && (
        <group position={[0, screenY, screenZ]}>
          {/* Main Display Frame / Backing Cabinet */}
          <Box args={[screenW, screenH, 0.08]}>
            <meshStandardMaterial
              color="#0b0f19"
              metalness={0.7}
              roughness={0.4}
            />
          </Box>

          {/* Glowing LED Screen with Bright Stage Logo + Réalisé avec Ahmed Ftita */}
          <mesh position={[0, 0, 0.041]}>
            <planeGeometry args={[screenW - 0.02, screenH - 0.02]} />
            <meshStandardMaterial
              map={screenTexture}
              emissive="#ffffff"
              emissiveMap={screenTexture}
              emissiveIntensity={0.95}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>

          {/* LED Back Structure & Vertical Bumping Bars */}
          <Box args={[screenW + 0.1, screenH + 0.1, 0.04]} position={[0, 0, -0.06]}>
            <meshStandardMaterial color="#020617" metalness={0.7} />
          </Box>
          {/* Top Bumping Bar */}
          <Cylinder args={[0.025, 0.025, screenW, 8]} position={[0, screenH / 2 + 0.05, -0.06]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </Cylinder>
          {/* Bottom Ground-Support Feet resting directly on the stage deck */}
          {!isScreenSuspended && (
            <group position={[0, -screenH / 2 + 0.02, -0.04]}>
              <Box args={[screenW, 0.04, 0.28]}>
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
              </Box>
              {/* Back outrigger stabilizers to stage floor */}
              <Box args={[0.04, 0.04, 0.5]} position={[-screenW / 3, -0.01, -0.2]}>
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </Box>
              <Box args={[0.04, 0.04, 0.5]} position={[screenW / 3, -0.01, -0.2]}>
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </Box>
            </group>
          )}
        </group>
      )}

      {/* ========================================================
          3. STRUCTURE TRUSS (TOURS & GRIL SCÉNIQUE)
          ======================================================== */}
      {isStructureEnabled && structure.structureType !== 'none' && (
        isGoalpost ? (
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
            <group position={[0, structH, 0]}>
              <TrussBeam length={structL} width={0.4} height={0.4} color="#38bdf8" axis="x" />
            </group>
          </>
        ) : (
          // Box Grid: 4 towers at 4 corners
          <>
            {/* Back Left Tower */}
            <group position={[-structL / 2, structH / 2, -structW / 2]}>
              <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" axis="y" />
              <Box args={[0.65, 0.04, 0.65]} position={[0, -structH / 2 + 0.02, 0]}><meshStandardMaterial color="#090d16" /></Box>
              {/* Top Pulley head */}
              <Box args={[0.4, 0.2, 0.4]} position={[0, structH / 2 + 0.1, 0]}><meshStandardMaterial color="#ef4444" /></Box>
            </group>
            {/* Back Right Tower */}
            <group position={[structL / 2, structH / 2, -structW / 2]}>
              <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" axis="y" />
              <Box args={[0.65, 0.04, 0.65]} position={[0, -structH / 2 + 0.02, 0]}><meshStandardMaterial color="#090d16" /></Box>
              <Box args={[0.4, 0.2, 0.4]} position={[0, structH / 2 + 0.1, 0]}><meshStandardMaterial color="#ef4444" /></Box>
            </group>
            {/* Front Left Tower */}
            <group position={[-structL / 2, structH / 2, structW / 2]}>
              <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" axis="y" />
              <Box args={[0.65, 0.04, 0.65]} position={[0, -structH / 2 + 0.02, 0]}><meshStandardMaterial color="#090d16" /></Box>
              <Box args={[0.4, 0.2, 0.4]} position={[0, structH / 2 + 0.1, 0]}><meshStandardMaterial color="#ef4444" /></Box>
            </group>
            {/* Front Right Tower */}
            <group position={[structL / 2, structH / 2, structW / 2]}>
              <TrussBeam length={structH} width={0.35} height={0.35} color="#64748b" axis="y" />
              <Box args={[0.65, 0.04, 0.65]} position={[0, -structH / 2 + 0.02, 0]}><meshStandardMaterial color="#090d16" /></Box>
              <Box args={[0.4, 0.2, 0.4]} position={[0, structH / 2 + 0.1, 0]}><meshStandardMaterial color="#ef4444" /></Box>
            </group>

            {/* Horizontal Beams at height structH */}
            {/* Back Beam (X axis) */}
            <group position={[0, structH, -structW / 2]}>
              <TrussBeam length={structL} width={0.4} height={0.4} color="#38bdf8" axis="x" />
            </group>
            {/* Front Beam (X axis) */}
            <group position={[0, structH, structW / 2]}>
              <TrussBeam length={structL} width={0.4} height={0.4} color="#38bdf8" axis="x" />
            </group>
            {/* Left Side Beam (Z axis) */}
            <group position={[-structL / 2, structH, 0]}>
              <TrussBeam length={structW} width={0.35} height={0.35} color="#818cf8" axis="z" />
            </group>
            {/* Right Side Beam (Z axis) */}
            <group position={[structL / 2, structH, 0]}>
              <TrussBeam length={structW} width={0.35} height={0.35} color="#818cf8" axis="z" />
            </group>

            {/* 4 Corner Sleeve Blocks */}
            <Box args={[0.48, 0.48, 0.48]} position={[-structL / 2, structH, -structW / 2]}><meshStandardMaterial color="#1e293b" /></Box>
            <Box args={[0.48, 0.48, 0.48]} position={[structL / 2, structH, -structW / 2]}><meshStandardMaterial color="#1e293b" /></Box>
            <Box args={[0.48, 0.48, 0.48]} position={[-structL / 2, structH, structW / 2]}><meshStandardMaterial color="#1e293b" /></Box>
            <Box args={[0.48, 0.48, 0.48]} position={[structL / 2, structH, structW / 2]}><meshStandardMaterial color="#1e293b" /></Box>
          </>
        )
      )}

      {/* ========================================================
          4. ÉCLAIRAGE (LIGHTING FIXTURES & VOLUMETRIC BEAMS)
          ======================================================== */}
      {isLightingEnabled && isStructureEnabled && lightingFixtures}

      {/* ========================================================
          5. TOTEMS FOND DE SCÈNE (AVEC LYRES BEAM 280W)
          ======================================================== */}
      {isStructureEnabled && upstageTotems}

      {/* ========================================================
          6. MATRICES LED LATÉRALES (STROBE / BEAM FLANCS ÉCRAN)
          ======================================================== */}
      {isScreenEnabled && isLightingEnabled && sideScreenMatrices}

      {/* ========================================================
          7. DIMENSION LABELS
          ======================================================== */}
      {showLabels && (
        <>
          {isStageEnabled && (
            <DimensionLabel
              position={[0, stageH + 0.3, stageW / 2 + 0.3]}
              label={`Scène : ${stageL}m × ${stageW}m (H=${Math.round(stageH * 100)}cm)`}
            />
          )}
          {isScreenEnabled && (
            <DimensionLabel
              position={[0, screenY + screenH / 2 + 0.3, screenZ]}
              label={`Écran LED : ${screenW}m × ${screenH}m (${screen.pitch})`}
            />
          )}
          {isStructureEnabled && (
            <DimensionLabel
              position={[-structL / 2 - 0.8, structH / 2, 0]}
              label={`Structure : ${structL}m × ${structW}m (H=${structH}m)`}
            />
          )}
          {isStructureEnabled && structure.totems?.count > 0 && (
            <DimensionLabel
              position={[0, (structure.totems.heightM || 2.5) + 0.5, screenZ - 0.6]}
              label={`${structure.totems.count}x Totems Truss (H=${structure.totems.heightM || 2.5}m)${isLightingEnabled ? ' + Beams 280W' : ''}`}
            />
          )}
          {isScreenEnabled && isLightingEnabled && lighting.sideMatricesCount > 0 && (
            <DimensionLabel
              position={[screenW / 2 + 0.9, screenY, screenZ]}
              label={`${lighting.totalSideMatrices}x ${lighting.sideFixtureSpec?.name || 'Projecteurs Flancs'} (${(lighting.sideMatricesCount || 0) * (lighting.sideMatricesFlancs || 1)}G + ${(lighting.sideMatricesCount || 0) * (lighting.sideMatricesFlancs || 1)}D)`}
            />
          )}
        </>
      )}
    </group>
  );
}
