export const getValidatedBbox = (bboxstring) => {
  if (!bboxstring) {
    return '';
  }
  if (typeof bboxstring !== 'string') {
    return null;
  }
  if (bboxstring.trim() === '') {
    return '';
  }
  const bboxParts = bboxstring.split(',');
  if (bboxParts.length !== 4) {
    return null;
  }
  for (let i = 0; i < 4; i++) {
    bboxParts[i] = parseFloat(bboxParts[i]);
    if (isNaN(bboxParts[i])) {
      return null;
    }
    if (i == 1 || i == 3) {
      // latitude
      if (bboxParts[i] < -90 || bboxParts[i] > 90) {
        return null;
      }
    }
  }
  const west = Math.min(bboxParts[0], bboxParts[2]);
  const east = Math.max(bboxParts[0], bboxParts[2]);
  const south = Math.min(bboxParts[1], bboxParts[3]);
  const north = Math.max(bboxParts[1], bboxParts[3]);
  return [west,south,east,north].join(',');
}