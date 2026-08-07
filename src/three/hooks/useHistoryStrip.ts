import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import historyVert from "../shaders/history.vert.glsl";
import historyFrag from "../shaders/history.frag.glsl";

const STRIP_W = 512;
const STRIP_H = 128;

type Options = {
  videoTexture: THREE.VideoTexture | null;
  videoAspect: number;
  pillAspect: number;
  scrollSpeed: number;
  tiles: number;
};

export function useHistoryStrip({
  videoTexture,
  videoAspect,
  pillAspect,
  scrollSpeed,
  tiles,
}: Options) {
  const { gl } = useThree();

  const rts = useMemo(() => {
    const opts = {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    };
    return {
      a: new THREE.WebGLRenderTarget(STRIP_W, STRIP_H, opts),
      b: new THREE.WebGLRenderTarget(STRIP_W, STRIP_H, opts),
    };
  }, []);

  const pingPong = useRef({ read: rts.a, write: rts.b });
  const outputTexture = useRef<THREE.Texture>(rts.a.texture);

  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    [],
  );

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: historyVert,
      fragmentShader: historyFrag,
      uniforms: {
        uPrev: { value: null },
        uVideo: { value: null },
        uShiftUv: { value: 0.005 },
        uPasteWidth: { value: 1 / 4 },
        uVideoAspectFit: { value: new THREE.Vector2(1, 1) },
      },
    });
    return m;
  }, []);

  const quad = useMemo(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(m);
    return m;
  }, [material, scene]);

  useEffect(() => {
    const pasteFraction = 1 / tiles;
    material.uniforms.uPasteWidth.value = pasteFraction;

    const pasteRegionAspect =
      (STRIP_W * pasteFraction) / STRIP_H / (pillAspect / tiles);
    const targetAspect = pasteRegionAspect * (pillAspect / tiles);

    if (videoAspect > targetAspect) {
      material.uniforms.uVideoAspectFit.value.set(
        targetAspect / videoAspect,
        1,
      );
    } else {
      material.uniforms.uVideoAspectFit.value.set(
        1,
        videoAspect / targetAspect,
      );
    }
  }, [material, videoAspect, pillAspect, tiles]);

  useEffect(() => {
    return () => {
      rts.a.dispose();
      rts.b.dispose();
      material.dispose();
      quad.geometry.dispose();
    };
  }, [rts, material, quad]);

  useFrame((_, delta) => {
    if (!videoTexture) return;
    const video = videoTexture.image as HTMLVideoElement | undefined;
    if (!video || video.readyState < 2) return;
    material.uniforms.uVideo.value = videoTexture;
    material.uniforms.uPrev.value = pingPong.current.read.texture;
    material.uniforms.uShiftUv.value = Math.min(delta * scrollSpeed, 0.06);

    const prevRt = gl.getRenderTarget();
    gl.setRenderTarget(pingPong.current.write);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(prevRt);

    const swap = pingPong.current.read;
    pingPong.current.read = pingPong.current.write;
    pingPong.current.write = swap;
    outputTexture.current = pingPong.current.read.texture;
  });

  return outputTexture;
}
