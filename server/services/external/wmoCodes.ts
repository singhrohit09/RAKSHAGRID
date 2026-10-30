import { WeatherCondition, WeatherSeverity } from './types.js';

export interface WmoCodeDetails {
  description: string;
  condition: WeatherCondition;
  severity: WeatherSeverity;
}

/**
 * Standard World Meteorological Organization (WMO) Code interpretation table
 * Reference: https://open-meteo.com/en/docs
 */
export function interpretWmoCode(code: number, windSpeedKmh = 0, precipitationMm = 0): WmoCodeDetails {
  if (windSpeedKmh > 90 || precipitationMm > 60) {
    return {
      description: 'Severe cyclonic or catastrophic precipitation event',
      condition: 'cyclonic_storm',
      severity: 'critical'
    };
  }

  switch (code) {
    case 0:
      return { description: 'Clear sky', condition: 'clear', severity: 'normal' };
    case 1:
      return { description: 'Mainly clear', condition: 'clear', severity: 'normal' };
    case 2:
      return { description: 'Partly cloudy', condition: 'partly_cloudy', severity: 'normal' };
    case 3:
      return { description: 'Overcast', condition: 'overcast', severity: 'normal' };
    case 45:
      return { description: 'Fog', condition: 'fog', severity: 'advisory' };
    case 48:
      return { description: 'Depositing rime fog', condition: 'fog', severity: 'advisory' };
    case 51:
      return { description: 'Light drizzle', condition: 'rain', severity: 'normal' };
    case 53:
      return { description: 'Moderate drizzle', condition: 'rain', severity: 'advisory' };
    case 55:
      return { description: 'Dense drizzle', condition: 'rain', severity: 'advisory' };
    case 61:
      return { description: 'Slight rain', condition: 'rain', severity: 'normal' };
    case 63:
      return { description: 'Moderate rain', condition: 'rain', severity: 'advisory' };
    case 65:
      return { description: 'Heavy rain', condition: 'heavy_rain', severity: 'warning' };
    case 66:
    case 67:
      return { description: 'Freezing rain', condition: 'rain', severity: 'warning' };
    case 71:
      return { description: 'Slight snow fall', condition: 'snow', severity: 'normal' };
    case 73:
      return { description: 'Moderate snow fall', condition: 'snow', severity: 'advisory' };
    case 75:
      return { description: 'Heavy snow fall', condition: 'snow', severity: 'warning' };
    case 80:
      return { description: 'Slight rain showers', condition: 'rain', severity: 'normal' };
    case 81:
      return { description: 'Moderate rain showers', condition: 'rain', severity: 'advisory' };
    case 82:
      return { description: 'Violent torrential rain showers', condition: 'heavy_rain', severity: 'critical' };
    case 95:
      return { description: 'Thunderstorm (Slight or moderate)', condition: 'thunderstorm', severity: 'warning' };
    case 96:
    case 99:
      return { description: 'Severe thunderstorm with hail', condition: 'thunderstorm', severity: 'critical' };
    default:
      if (precipitationMm > 30) {
        return { description: 'Heavy precipitation', condition: 'heavy_rain', severity: 'warning' };
      }
      return { description: `Variable weather conditions (WMO ${code})`, condition: 'partly_cloudy', severity: 'normal' };
  }
}
