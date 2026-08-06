import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
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

function useSimpleVideoTexture(src: string) {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);
  const [aspect, setAspect] = useState<number>(16 / 9);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.style.cssText =
      "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px;";
    document.body.appendChild(video);

    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;

    const onMeta = () => {
      if (video.videoWidth && video.videoHeight) {
        setAspect(video.videoWidth / video.videoHeight);
      }
    };
    video.addEventListener("loadedmetadata", onMeta);
    video.load();
    video.play().catch(() => {});

    setTexture(tex);
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (video.parentNode) video.parentNode.removeChild(video);
      tex.dispose();
    };
  }, [src]);

  return { texture, aspect };
}

function Mesh({ videoSrc, motionDir, motionStrength, tint }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { texture, aspect } = useSimpleVideoTexture(videoSrc);

  const material = useMemo(() => {
    const faceAspect = HALF.x / HALF.y;
    let fit: [number, number];
    if (aspect > faceAspect) {
      fit = [faceAspect / aspect, 1];
    } else {
      fit = [1, aspect / faceAspect];
    }

    return new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      uniforms: {
        uVideo: { value: texture },
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
  }, [texture, aspect, motionDir, motionStrength, tint]);

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
