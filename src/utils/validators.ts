/**
 * Operational form validation functions
 */

export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
}

export function isNonNegativeNumber(val: number): boolean {
  return typeof val === 'number' && !isNaN(val) && val >= 0;
}

export function isPositiveNumber(val: number): boolean {
  return typeof val === 'number' && !isNaN(val) && val > 0;
}

export function validateIncidentForm(data: {
  title: string;
  category: string;
  severity: string;
  locationName: string;
  latitude: number;
  longitude: number;
  affectedPopulation: number;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Incident title must be at least 3 characters.';
  }

  if (!data.category) {
    errors.category = 'Disaster category is required.';
  }

  if (!data.severity) {
    errors.severity = 'Severity classification is required.';
  }

  if (!data.locationName || data.locationName.trim().length < 2) {
    errors.locationName = 'Location name is required.';
  }

  if (!isValidLatitude(data.latitude)) {
    errors.latitude = 'Latitude must be a valid number between -90 and 90.';
  }

  if (!isValidLongitude(data.longitude)) {
    errors.longitude = 'Longitude must be a valid number between -180 and 180.';
  }

  if (!isNonNegativeNumber(data.affectedPopulation)) {
    errors.affectedPopulation = 'Affected population estimate cannot be negative.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

