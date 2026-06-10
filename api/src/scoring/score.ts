export type Priority = "balanced" | "comfort" | "speed";

interface Weights {
  congestion:  number;
  reliability: number;
  time:        number;
  transfer:    number;
  personal:    number;
}

export function getWeights(priority: Priority): Weights {
  switch (priority) {
    case "comfort":
      return { congestion: 0.40, reliability: 0.25, time: 0.15, transfer: 0.10, personal: 0.10 };
    case "speed":
      return { congestion: 0.15, reliability: 0.25, time: 0.40, transfer: 0.10, personal: 0.10 };
    default:
      return { congestion: 0.30, reliability: 0.25, time: 0.25, transfer: 0.10, personal: 0.10 };
  }
}

export function computeTotalScore(
  scores: {
    congestion:  number;
    reliability: number;
    time:        number;
    transfer:    number;
    personal:    number;
  },
  priority: Priority
): number {
  const w = getWeights(priority);
  const total =
    w.congestion  * scores.congestion  +
    w.reliability * scores.reliability +
    w.time        * scores.time        +
    w.transfer    * scores.transfer    +
    w.personal    * scores.personal;
  return Math.round(Math.max(0, Math.min(100, total)));
}
