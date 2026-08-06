# twelvelab-effect

A study of the "video-in-glass-capsule" effect from Pentagram's TwelveLabs
identity — six lozenge-shaped glass capsules on a warm off-white page, each
holding a video that appears refracted inside the glass with directional
motion blur and chromatic dispersion.

## Stack

- Vite + React + TypeScript
- three.js + @react-three/fiber + @react-three/drei
- A custom GLSL fragment shader for refraction, RGB dispersion, and 16-tap
  directional motion blur (see `src/three/shaders/capsule.frag.glsl`).

## Run

```
pnpm install     # or npm install / yarn
pnpm dev         # http://localhost:5173
```

## Swap in real clips

The `public/clips/*.mp4` files shipped in this repo are tiny animated
gradients generated with ffmpeg — just enough to prove the shader works. To
replace them with real footage, drop MP4 files with the same names into
`public/clips/`:

- `dirt-bike.mp4`
- `dancers.mp4`
- `robot-arm.mp4`
- `fantasy.mp4`
- `tennis.mp4`
- `shibuya.mp4`

Keep clips short (2–6s), muted, and looping-friendly. Adjust the
`motionDir` and `motionStrength` per clip in `src/data/capsules.ts` so the
directional blur streaks along the primary motion axis of each video.

## How the effect works — the six ingredients

1. **True 3D superellipsoid.** `RoundedBox` mesh, corner radius ≈ 0.55, depth
   ≈ 60% of height. The bulge on every axis is what makes the silhouette
   feel like a soap bar rather than a flat rounded rectangle.
2. **Refracted interior.** In `capsule.frag.glsl`, the video texture is
   sampled with UVs bent by `refract(-viewDir, normal, 1.0/ior)`, so
   footage appears trapped inside the glass.
3. **Directional motion blur.** 16 taps along a per-clip `uMotionDir`
   vector — horizontal for the dirt-bike, vertical for the tennis ball —
   with a triangular weight for a soft, filmic falloff.
4. **Chromatic dispersion.** The R and B channels are sampled with a small
   offset in opposite directions (`uDispersion`), giving the red-orange /
   cyan-teal rim fringes you see on every capsule in the reference.
5. **Fresnel top sheen + CSS drop-shadow.** A broad specular sheen along the
   top curve (Fresnel term in the shader) plus a wide soft shadow underneath
   (`filter: drop-shadow(...)` in `styles.css`) anchor the object to the
   page.
6. **"Specimen" chrome.** The hairline tick and uppercase pill caption
   (`CaptionPill`) is what makes the whole grid read as *catalogued* rather
   than *decorative*.

## Tuning knobs

All in `src/data/capsules.ts` per clip, or in `src/components/Capsule.tsx`
in the `uniforms` block:

| Uniform            | What it does                                       |
| ------------------ | -------------------------------------------------- |
| `uIor`             | Index of refraction. 1.42 ≈ crown glass.           |
| `uDispersion`      | RGB channel offset for chromatic fringing.         |
| `uRefractStrength` | How hard the UVs bend at the edges.                |
| `uMotionDir`       | Unit vector along which the blur streaks.          |
| `uMotionStrength`  | Blur length in UV units. 0.03–0.06 is a good band. |
| `uTint`            | Multiplier for warm/cool color grading.            |
