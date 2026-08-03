import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial, Torus, Stars } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";
import { ClientOnly } from "./ClientOnly";

function Rig() {
  const g = useRef<Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!g.current) return;
    const t = clock.getElapsedTime();
    g.current.rotation.y = t * 0.15 + pointer.x * 0.3;
    g.current.rotation.x = pointer.y * 0.2;
  });
  return (
    <group ref={g}>
      <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1.4}>
        <Sphere args={[1, 64, 64]} scale={1.3}>
          <MeshDistortMaterial
            color="#8b5cf6"
            distort={0.4}
            speed={2}
            roughness={0.1}
            metalness={0.85}
            emissive="#5b21b6"
            emissiveIntensity={0.35}
          />
        </Sphere>
      </Float>
      <Torus args={[2.2, 0.02, 16, 128]} rotation={[Math.PI / 3, 0, 0]}>
        <meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={0.5} />
      </Torus>
      <Torus args={[2.6, 0.02, 16, 128]} rotation={[Math.PI / 2.2, Math.PI / 4, 0]}>
        <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={0.5} />
      </Torus>
    </group>
  );
}

function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 3, 3]} intensity={2.2} color="#c4b5fd" />
      <pointLight position={[-3, -2, -2]} intensity={1.6} color="#67e8f9" />
      <Stars radius={30} depth={40} count={400} factor={3} fade speed={0.4} />
      <Rig />
    </Canvas>
  );
}

export function DashboardScene({ className = "" }: { className?: string }) {
  return (
    <div className={"relative h-56 w-full overflow-hidden rounded-2xl border border-white/10 " + className}>
      <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl" style={{ background: "radial-gradient(circle at 20% 20%, oklch(0.72 0.19 295 / 0.15), transparent 60%)" }} />
      <ClientOnly fallback={<div className="h-full w-full bg-gradient-to-br from-fuchsia-500/20 via-purple-500/10 to-cyan-500/20" />}>
        <Scene />
      </ClientOnly>
    </div>
  );
}