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
    videoSrc: "/clips/dirt-bike.mp4",
    motionDir: [1.0, 0.0],
    motionStrength: 0.045,
    tint: [1.0, 0.98, 0.92],
  },
  {
    label: "Two people dancing against the blue sky",
    videoSrc: "/clips/dancers.mp4",
    motionDir: [0.6, -0.2],
    motionStrength: 0.035,
    tint: [0.98, 1.0, 1.05],
  },
  {
    label: "Red robotic arm in action",
    videoSrc: "/clips/robot-arm.mp4",
    motionDir: [0.9, 0.3],
    motionStrength: 0.05,
    tint: [1.06, 0.95, 0.9],
  },
  {
    label: "Fantasy RPG cutscene",
    videoSrc: "/clips/fantasy.mp4",
    motionDir: [0.2, 0.9],
    motionStrength: 0.055,
    tint: [0.95, 0.95, 1.1],
  },
  {
    label: "Green tennis ball bouncing on the court",
    videoSrc: "/clips/tennis.mp4",
    motionDir: [0.1, 1.0],
    motionStrength: 0.06,
    tint: [0.96, 1.02, 0.94],
  },
  {
    label: "Street-view scene of Shibuya",
    videoSrc: "/clips/shibuya.mp4",
    motionDir: [1.0, 0.05],
    motionStrength: 0.04,
    tint: [1.0, 1.0, 1.0],
  },
];
