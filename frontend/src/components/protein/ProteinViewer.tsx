"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Center, Environment, PerspectiveCamera, Float } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "../ui/Button";
import { Camera, Download } from "lucide-react";

interface ProteinViewerProps {
    pdbData?: string;
    pdbUrl?: string; // URL to fetch PDB from
    className?: string;
}

// Minimal PDB Parser for C-alpha backbone
const parsePdbBackbone = (pdbText: string) => {
    const points: THREE.Vector3[] = [];
    const lines = pdbText.split("\n");

    for (const line of lines) {
        if (line.startsWith("ATOM")) {
            const atomName = line.slice(12, 16).trim();
            if (atomName === "CA") {
                const x = parseFloat(line.slice(30, 38));
                const y = parseFloat(line.slice(38, 46));
                const z = parseFloat(line.slice(46, 54));
                points.push(new THREE.Vector3(x, y, z));
            }
        }
    }
    return points;
};

function ProteinRibbon({ pdbText }: { pdbText: string }) {
    const { points, curve } = useMemo(() => {
        const pts = parsePdbBackbone(pdbText);
        if (pts.length < 2) return { points: [], curve: null };
        const crv = new THREE.CatmullRomCurve3(pts);
        crv.tension = 0.5;
        return { points: pts, curve: crv };
    }, [pdbText]);

    if (!curve || points.length === 0) return null;

    return (
        <group>
            {/* The Ribbon */}
            <mesh castShadow receiveShadow>
                <tubeGeometry args={[curve, points.length * 4, 0.4, 8, false]} />
                <meshPhysicalMaterial
                    color="#10b981"
                    roughness={0.2}
                    metalness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    transmission={0.2}
                    opacity={0.9}
                    transparent
                />
            </mesh>

            {/* Atomic spheres for detail (C-alphas) */}
            {points.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshStandardMaterial color="#34d399" roughness={0.4} />
                </mesh>
            ))}
        </group>
    );
}

function SceneContent({ pdbText }: { pdbText: string }) {
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Center>
                <ProteinRibbon pdbText={pdbText} />
            </Center>
        </Float>
    );
}

export function ProteinViewer({ pdbUrl, pdbData: initialData, className = "" }: ProteinViewerProps) {
    const [pdbText, setPdbText] = useState<string | null>(initialData || null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (pdbUrl) {
            fetch(pdbUrl)
                .then((res) => res.text())
                .then((text) => setPdbText(text))
                .catch((err) => console.error("Failed to fetch PDB:", err));
        }
    }, [pdbUrl]);

    // Handle Snapshot
    const takeSnapshot = () => {
        const canvas = containerRef.current?.querySelector("canvas");
        if (canvas) {
            const link = document.createElement("a");
            link.download = "protein-snapshot.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        }
    };

    return (
        <div ref={containerRef} className={`relative bg-neutral-900 rounded-3xl overflow-hidden ${className}`}>
            {!pdbText ? (
                <div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">
                    Loading 3D Model...
                </div>
            ) : (
                <>
                    <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
                        <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={50} />
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#emerald" />

                        <Environment preset="city" />

                        <SceneContent pdbText={pdbText} />

                        <OrbitControls
                            autoRotate
                            autoRotateSpeed={1}
                            enableZoom={true}
                            minDistance={10}
                            maxDistance={100}
                        />
                    </Canvas>

                    {/* Controls Overlay */}
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={takeSnapshot}
                            className="bg-white/10 text-white border-white/10 hover:bg-white/20 backdrop-blur-md gap-2"
                        >
                            <Camera className="w-4 h-4" />
                            Snapshot
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
