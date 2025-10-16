export function downloadGeoJSON(geoJson: any, filename: string) {
  const blob = new Blob([JSON.stringify(geoJson, null, 2)], {
    type: 'application/geo+json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function calculateBounds(
  geometry: any
): [[number, number], [number, number]] | null {
  if (!geometry || !geometry.coordinates) return null;

  let minLat = Infinity,
    maxLat = -Infinity;
  let minLng = Infinity,
    maxLng = -Infinity;

  const processCoordinates = (coords: any[]) => {
    coords.forEach(coord => {
      if (Array.isArray(coord[0])) {
        processCoordinates(coord);
      } else {
        const [lng, lat] = coord;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    });
  };

  processCoordinates(geometry.coordinates);

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}
