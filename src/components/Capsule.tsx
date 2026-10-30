import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import vert from "../three/shaders/capsule.vert.glsl";
import frag from "../three/shaders/capsule.frag.glsl";
import edgeVert from "../three/shaders/edge.vert.glsl";
import edgeFrag from "../three/shaders/edge.frag.glsl";
import { useHistoryStrip } from "../three/hooks/useHistoryStrip";

type Props = {
  videoSrc: string;
  tint: [number, number, number];
  scrollSpeed?: number;
  pasteWidth?: number;
  radius?: number;
  cameraZoom?: number;
  thicknessScale?: number;
  reflectionStrength?: number;
  /** Bigger ping-pong buffer for high-resolution presentations (museum). */
  stripSize?: [number, number];
  castShadow?: boolean;
};

const HALF = new THREE.Vector2(0.90, 0.48);
const HALF_DEPTH = 1.1;
const DEFAULT_RADIUS = 0.36;

function createLeftSideGeometry(radiusValue = DEFAULT_RADIUS) {
  const halfZ = HALF_DEPTH;
  const halfY = HALF.y;
  const radius = Math.min(radiusValue, halfZ, halfY);
  const shape = new THREE.Shape();

  shape.moveTo(-halfZ + radius, -halfY);
  shape.lineTo(halfZ - radius, -halfY);
  shape.quadraticCurveTo(halfZ, -halfY, halfZ, -halfY + radius);
  shape.lineTo(halfZ, halfY - radius);
  shape.quadraticCurveTo(halfZ, halfY, halfZ - radius, halfY);
  shape.lineTo(-halfZ + radius, halfY);
  shape.quadraticCurveTo(-halfZ, halfY, -halfZ, halfY - radius);
  shape.lineTo(-halfZ, -halfY + radius);
  shape.quadraticCurveTo(-halfZ, -halfY, -halfZ + radius, -halfY);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: HALF.x * 2,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: 0.18,
    bevelSegments: 32,
    curveSegments: 24,
    steps: 1,
  });

  geometry.translate(0, 0, -HALF.x);
  geometry.rotateY(Math.PI / 2);
  geometry.deleteAttribute("normal");
  geometry.deleteAttribute("uv");

  const smoothGeometry = mergeVertices(geometry, 0.001);
  smoothGeometry.computeVertexNormals();

  return smoothGeometry;
}

function useSimpleVideoTexture(src: string, paused = false) {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);
  const [aspect, setAspect] = useState<number>(16 / 9);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    videoRef.current = video;

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
      videoRef.current = null;
    };
  }, [src]);

  // Pause / resume video decoding on demand — saves CPU + battery when a
  // capsule is off-camera or overshadowed by a focused sibling.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) {
      v.pause();
    } else {
      v.play().catch(() => {});
    }
  }, [paused]);

  return { texture, aspect };
}

type MeshProps = Props & { autoRotate?: boolean; paused?: boolean };

function Mesh({
  videoSrc,
  tint,
  scrollSpeed = 0.55,
  pasteWidth = 0.22,
  radius = DEFAULT_RADIUS,
  thicknessScale = 1,
  reflectionStrength = 1,
  autoRotate = true,
  stripSize,
  paused = false,
  castShadow = false,
}: MeshProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const { texture, aspect } = useSimpleVideoTexture(videoSrc, paused);
  const geometry = useMemo(() => createLeftSideGeometry(radius), [radius]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  const stripTextureRef = useHistoryStrip({
    videoTexture: texture,
    videoAspect: aspect,
    pillAspect: HALF.x / HALF.y,
    scrollSpeed,
    pasteWidth,
    stripSize,
    paused,
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
        uHalfDepth: { value: HALF_DEPTH },
        uPasteWidth: { value: pasteWidth },
      },
    });
  }, [tint, pasteWidth, stripTextureRef]);

  const edgeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: edgeVert,
      fragmentShader: edgeFrag,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uEdgeColor: { value: new THREE.Color(1.0, 0.96, 0.88) },
        uEdgeStrength: { value: 0.38 * reflectionStrength },
        uEdgePower: { value: 2.8 },
        uHairlineStrength: { value: 0.16 * reflectionStrength },
        uHalfSize: { value: HALF.clone() },
        uHalfDepth: { value: HALF_DEPTH },
        uNormalCurve: { value: 0.40 },
      },
    });
  }, [reflectionStrength]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    material.uniforms.uTime.value = t;
    material.uniforms.uStrip.value = stripTextureRef.current;
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y = 0.6 + Math.sin(t * 0.3) * 0.015;
      groupRef.current.rotation.x = 0.34 + Math.cos(t * 0.28) * 0.01;
    }
  });

  return (
    <group ref={groupRef} scale={[1, thicknessScale, 1]}>
      <mesh
        castShadow={castShadow}
        geometry={geometry}
        material={material}
      />
      <mesh
        geometry={geometry}
        material={edgeMaterial}
        renderOrder={2}
        scale={1.004}
      />
    </group>
  );
}

/** Headless capsule mesh — no Canvas of its own. Drop it into a shared scene. */
export const CapsuleMesh = Mesh;

export function Capsule(props: Props) {
  const { cameraZoom = 104 } = props;

  return (
    <Canvas
      dpr={[1, 2]}
      orthographic
      camera={{ position: [0, 0, 6], zoom: cameraZoom }}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      style={{ background: "transparent" }}
    >
      <Mesh {...props} />
    </Canvas>
  );
}
