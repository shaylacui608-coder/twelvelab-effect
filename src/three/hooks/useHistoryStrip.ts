import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import historyVert from "../shaders/history.vert.glsl";
import historyFrag from "../shaders/history.frag.glsl";

const STRIP_W = 512;
const STRIP_H = 128;
const MAX_HISTORY_DELTA = 1 / 30;

type Options = {
  videoTexture: THREE.VideoTexture | null;
  videoAspect: number;
  pillAspect: number;
  scrollSpeed: number;
  pasteWidth: number;
};

export function useHistoryStrip({
  videoTexture,
  videoAspect,
  pillAspect,
  scrollSpeed,
  pasteWidth,
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
    return new THREE.ShaderMaterial({
      vertexShader: historyVert,
      fragmentShader: historyFrag,
      uniforms: {
        uPrev: { value: null },
        uVideo: { value: null },
        uShiftUv: { value: 0.005 },
        uPasteWidth: { value: 0.2 },
        uVideoAspectFit: { value: new THREE.Vector2(1, 1) },
      },
    });
  }, []);

  const quad = useMemo(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(m);
    return m;
  }, [material, scene]);

  useEffect(() => {
    material.uniforms.uPasteWidth.value = pasteWidth;

    const pasteRegionAspect = (STRIP_W * pasteWidth) / STRIP_H;
    const paintedAspect = pasteRegionAspect / (pillAspect * pasteWidth);
    const targetAspect = paintedAspect * pasteWidth * pillAspect;

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
  }, [material, videoAspect, pillAspect, pasteWidth]);

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
    if (
      !video ||
      video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA ||
      !video.videoWidth ||
      !video.videoHeight ||
      video.seeking
    ) {
      return;
    }

    material.uniforms.uVideo.value = videoTexture;
    material.uniforms.uPrev.value = pingPong.current.read.texture;
    material.uniforms.uShiftUv.value = Math.min(delta, MAX_HISTORY_DELTA) * scrollSpeed;

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
