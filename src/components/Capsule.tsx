import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import vert from "../three/shaders/capsule.vert.glsl";
import frag from "../three/shaders/capsule.frag.glsl";
import { useHistoryStrip } from "../three/hooks/useHistoryStrip";

type Props = {
  videoSrc: string;
  tint: [number, number, number];
  scrollSpeed?: number;
  pasteWidth?: number;
};

const HALF = new THREE.Vector2(1.4, 0.65);
const SIZE: [number, number, number] = [HALF.x * 2, HALF.y * 2, 1.15];
const RADIUS = 0.15;

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

function Mesh({
  videoSrc,
  tint,
  scrollSpeed = 0.55,
  pasteWidth = 0.22,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { texture, aspect } = useSimpleVideoTexture(videoSrc);

  const stripTextureRef = useHistoryStrip({
    videoTexture: texture,
    videoAspect: aspect,
    pillAspect: HALF.x / HALF.y,
    scrollSpeed,
    pasteWidth,
  });

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      uniforms: {
        uStrip: { value: stripTextureRef.current },
        uIor: { value: 1.3 },
        uRefractStrength: { value: 0.1 },
        uTint: { value: new THREE.Color(tint[0], tint[1], tint[2]) },
        uTime: { value: 0 },
        uHalfSize: { value: HALF.clone() },
      },
    });
  }, [tint, stripTextureRef]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    material.uniforms.uTime.value = t;
    material.uniforms.uStrip.value = stripTextureRef.current;
    if (meshRef.current) {
      meshRef.current.rotation.y = 0.3 + Math.sin(t * 0.3) * 0.015;
      meshRef.current.rotation.x = -0.34 + Math.cos(t * 0.28) * 0.01;
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
      camera={{ position: [0, 0, 6], zoom: 115 }}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      style={{ background: "transparent" }}
    >
      <Mesh {...props} />
    </Canvas>
  );
}
