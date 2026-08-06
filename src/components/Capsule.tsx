import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, useVideoTexture } from "@react-three/drei";
import * as THREE from "three";

import vert from "../three/shaders/capsule.vert.glsl";
import frag from "../three/shaders/capsule.frag.glsl";

type Props = {
  videoSrc: string;
  motionDir: [number, number];
  motionStrength: number;
  tint: [number, number, number];
};

const HALF = new THREE.Vector2(1.5, 0.84);
const SIZE: [number, number, number] = [HALF.x * 2, HALF.y * 2, 1.2];
const RADIUS = 0.55;

function Mesh({ videoSrc, motionDir, motionStrength, tint }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);

  const videoTexture = useVideoTexture(videoSrc, {
    muted: true,
    loop: true,
    start: true,
    playsInline: true,
    crossOrigin: "anonymous",
  });

  const material = useMemo(() => {
    const videoAspect =
      videoTexture.image && (videoTexture.image as HTMLVideoElement).videoWidth
        ? (videoTexture.image as HTMLVideoElement).videoWidth /
          (videoTexture.image as HTMLVideoElement).videoHeight
        : 16 / 9;
    const faceAspect = HALF.x / HALF.y;

    let fit: [number, number];
    if (videoAspect > faceAspect) {
      fit = [faceAspect / videoAspect, 1];
    } else {
      fit = [1, videoAspect / faceAspect];
    }

    videoTexture.wrapS = THREE.ClampToEdgeWrapping;
    videoTexture.wrapT = THREE.ClampToEdgeWrapping;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    return new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      uniforms: {
        uVideo: { value: videoTexture },
        uMotionDir: {
          value: new THREE.Vector2(motionDir[0], motionDir[1]).normalize(),
        },
        uMotionStrength: { value: motionStrength },
        uIor: { value: 1.42 },
        uDispersion: { value: 0.012 },
        uRefractStrength: { value: 0.22 },
        uTint: { value: new THREE.Color(tint[0], tint[1], tint[2]) },
        uTime: { value: 0 },
        uHalfSize: { value: HALF.clone() },
        uVideoAspectFit: { value: new THREE.Vector2(fit[0], fit[1]) },
      },
    });
  }, [videoTexture, motionDir, motionStrength, tint]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    material.uniforms.uTime.value = t;
    if (meshRef.current) {
      meshRef.current.rotation.y = 0.22 + Math.sin(t * 0.5) * 0.05;
      meshRef.current.rotation.x = -0.32 + Math.cos(t * 0.4) * 0.03;
    }
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={SIZE}
      radius={RADIUS}
      smoothness={10}
      bevelSegments={10}
      creaseAngle={0.9}
      material={material}
    />
  );
}

export function Capsule(props: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      orthographic
      camera={{ position: [0, 0, 6], zoom: 130 }}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      style={{ background: "transparent" }}
    >
      <Mesh {...props} />
    </Canvas>
  );
}
