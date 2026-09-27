import { useCallback, useMemo, useState } from 'react';
import { canZoomMapIn, canZoomMapOut, normalizeMapRegion, scaleMapRegion } from '../domain/mapRegion';

export function useMapViewport(baseRegion) {
  const [viewport, setViewport] = useState(null);
  const region = useMemo(() => viewport || baseRegion, [baseRegion, viewport]);

  const handleRegionChangeComplete = useCallback((nextRegion) => {
    const normalized = normalizeMapRegion(nextRegion);
    if (normalized) setViewport(normalized);
  }, []);

  const zoomIn = useCallback(() => {
    setViewport((current) => scaleMapRegion(current || baseRegion, 0.5));
  }, [baseRegion]);

  const zoomOut = useCallback(() => {
    setViewport((current) => scaleMapRegion(current || baseRegion, 2));
  }, [baseRegion]);

  const reset = useCallback(() => setViewport(null), []);

  return {
    region,
    canZoomIn: canZoomMapIn(region),
    canZoomOut: canZoomMapOut(region),
    handleRegionChangeComplete,
    zoomIn,
    zoomOut,
    reset,
  };
}
