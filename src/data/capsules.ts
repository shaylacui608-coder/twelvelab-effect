export type CapsuleSpec = {
  label: string;
  videoSrc: string;
  motionDir: [number, number];
  motionStrength: number;
  tint: [number, number, number];
};

export const CAPSULES: CapsuleSpec[] = [
  {
    label: "Off-road dirt bike on a dirt track",
    videoSrc: "/clips/dirt-bike.webm",
    motionDir: [1.0, 0.0],
    motionStrength: 0.045,
    tint: [1.0, 0.98, 0.92],
  },
  {
    label: "Woman running uphill with red roses",
    videoSrc: "/clips/dancers.webm",
    motionDir: [1.0, 0.35],
    motionStrength: 0.045,
    tint: [1.02, 0.98, 0.96],
  },
  {
    label: "Red robotic arm in action",
    videoSrc: "/clips/robot-arm.webm",
    motionDir: [0.9, 0.3],
    motionStrength: 0.05,
    tint: [1.06, 0.95, 0.9],
  },
  {
    label: "Fantasy RPG cutscene",
    videoSrc: "/clips/fantasy.webm",
    motionDir: [0.2, 0.9],
    motionStrength: 0.055,
    tint: [0.95, 0.95, 1.1],
  },
  {
    label: "Green tennis ball bouncing on the court",
    videoSrc: "/clips/tennis.webm",
    motionDir: [0.1, 1.0],
    motionStrength: 0.06,
    tint: [0.96, 1.02, 0.94],
  },
  {
    label: "Street-view scene of Shibuya",
    videoSrc: "/clips/shibuya.webm",
    motionDir: [1.0, 0.05],
    motionStrength: 0.04,
    tint: [1.0, 1.0, 1.0],
  },
];
