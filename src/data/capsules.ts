export type CapsuleSpec = {
  label: string;
  videoSrc: string;
  tint: [number, number, number];
  scrollSpeed?: number;
  pasteWidth?: number;
};

export const CAPSULES: CapsuleSpec[] = [
  {
    label: "Off-road dirt bike on a dirt track",
    videoSrc: "/clips/dirt-bike.webm",
    tint: [1.0, 0.98, 0.92],
    scrollSpeed: 0.55,
  },
  {
    label: "Woman running uphill with red roses",
    videoSrc: "/clips/dancers.webm",
    tint: [1.02, 0.99, 0.97],
    scrollSpeed: 0.55,
  },
  {
    label: "Red robotic arm in action",
    videoSrc: "/clips/robot-arm.webm",
    tint: [1.05, 0.96, 0.92],
    scrollSpeed: 0.6,
  },
  {
    label: "Fantasy RPG cutscene",
    videoSrc: "/clips/fantasy.webm",
    tint: [0.96, 0.96, 1.08],
    scrollSpeed: 0.45,
  },
  {
    label: "Green tennis ball bouncing on the court",
    videoSrc: "/clips/tennis.webm",
    tint: [0.98, 1.02, 0.95],
    scrollSpeed: 0.5,
  },
  {
    label: "Street-view scene of Shibuya",
    videoSrc: "/clips/shibuya.webm",
    tint: [1.0, 1.0, 1.0],
    scrollSpeed: 0.55,
  },
];
