interface ITimingResult {
  url: string;
  time: number;
  success: boolean;
  status: number;
  start: number;
  end: number;
}

interface IRegionNode {
  region: string;
  count: number;
}
