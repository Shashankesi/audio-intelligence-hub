import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial, Sparkles, Torus } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group, Mesh } from "three";

/** Glass crystal core: refractive icosahedron wrapped in an inner neural lattice. */
function CrystalCore() {
  const glass = useRef<Mesh>(null);
  const inner = useRef<Mesh>(null);

  useFrame(({ clock, pointer }, delta) => {
    const t = clock.getElapsedTime();
    if (glass.current) {
      glass.current.rotation.y += delta * 0.18;
      glass.current.rotation.x = THREE.MathUtils.lerp(glass.current.rotation.x, pointer.y * 0.25, 0.05);
      glass.current.rotation.z = THREE.MathUtils.lerp(glass.current.rotation.z, pointer.x * 0.2, 0.05);
    }
    if (inner.current) {
      inner.current.rotation.y -= delta * 0.4;
      inner.current.rotation.x = t * 0.15;
      const s = 1 + Math.sin(t * 1.4) * 0.05;
      inner.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <mesh ref={glass} scale={1.55}>
        <icosahedronGeometry args={[1, 6]} />
        <MeshTransmissionMaterial
          samples={6}
          resolution={256}
          thickness={1.2}
          roughness={0.08}
          anisotropy={0.4}
          chromaticAberration={0.35}
          distortion={0.35}
          distortionScale={0.4}
          temporalDistortion={0.15}
          ior={1.42}
          color="#c7b8ff"
          attenuationColor="#7c3aed"
          attenuationDistance={2.2}
        />
      </mesh>
      <mesh ref={inner} scale={0.75}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#06b6d4"
          emissiveIntensity={1.6}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

/** Orbiting rings that read as an AI neural core. */
function Orbits() {
  const g = useRef<Group>(null);
  useFrame((_, delta) => {
    if (g.current) g.current.rotation.z += delta * 0.12;
  });
  const rings = useMemo(
    () => [
      { r: 2.3, rot: [1.4, 0.2, 0] as const, c: "#7C3AED" },
      { r: 2.7, rot: [0.5, 1.1, 0.4] as const, c: "#06B6D4" },
      { r: 3.05, rot: [1.9, 0.6, 1.2] as const, c: "#14F195" },
    ],
    [],
  );
  return (
    <group ref={g}>
      {rings.map((r, i) => (
        <Torus key={i} args={[r.r, 0.008, 12, 128]} rotation={r.rot as unknown as [number, number, number]}>
          <meshBasicMaterial color={r.c} transparent opacity={0.55} />
        </Torus>
      ))}
    </group>
  );
}

function Inner() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 4, 4]} intensity={3} color="#c4b5fd" />
      <pointLight position={[-4, -3, -2]} intensity={2} color="#67e8f9" />
      <pointLight position={[0, -4, 3]} intensity={1.2} color="#14f195" />
      <Float speed={1.1} rotationIntensity={0.25} floatIntensity={1.1}>
        <CrystalCore />
      </Float>
      <Orbits />
      <Sparkles count={70} scale={7} size={2.4} speed={0.35} opacity={0.5} color="#a5b4fc" />
      <Environment preset="night" />
      <EffectComposer>
        <Bloom intensity={1.1} luminanceThreshold={0.12} luminanceSmoothing={0.5} mipmapBlur />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0009)} radialModulation={false} modulationOffset={0} />
        <Vignette eskil={false} offset={0.18} darkness={0.65} />
      </EffectComposer>
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Inner />
    </Canvas>
  );
}