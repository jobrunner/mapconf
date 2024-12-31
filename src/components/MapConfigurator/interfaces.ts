export interface ConfigurationInterface {
  projection: string
  centerLon: number
  centerLat: number
  rotateLambda: number
  rotatePhi: number
  rotateGamma: number
  translateX: number
  translateY: number
  scale: number
  viewWidth: number
  viewHeight: number

  // type script hack...
  [key: string]: any;
}

export interface ConfigurationLimitsInterface {
  minCenterLat: number
  maxCenterLat: number
  stepCenterLat: number

  minCenterLon: number
  maxCenterLon: number
  stepCenterLon: number

  minRotateLambda: number
  maxRotateLambda: number
  stepRotateLambda: number

  minRotatePhi: number
  maxRotatePhi: number
  stepRotatePhi: number

  minRotateGamma: number
  maxRotateGamma: number
  stepRotateGamma: number

  minTranslationX: number
  maxTranslationX: number
  stepTranslationX: number

  minTranslationY: number
  maxTranslationY: number
  stepTranslationY: number

  minScale: number
  maxScale: number
  stepScale: number

  minViewWidth: number
  maxViewWidth: number
  stepViewWidth: number

  minViewHeight: number
  maxViewHeight: number
  stepViewHeight: number
};
