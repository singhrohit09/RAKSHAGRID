export interface MapLayerPreferences {
  showIncidents: boolean;
  showTeams: boolean;
  showShelters: boolean;
  showRiskRadius: boolean;
}

export interface AppSettings {
  operatingRegion: string;
  operationsCenterName: string;
  timeZone: string;
  use24HourFormat: boolean;
  mapDefaultLat: number;
  mapDefaultLng: number;
  mapDefaultZoom: number;
  mapLayers: MapLayerPreferences;
  demoNotificationsEnabled: boolean;
  soundAlertsEnabled: boolean;
  demoModeNoticeDismissed: boolean;
  simulatedIntegrations: {
    weatherService: 'simulated' | 'offline';
    seismicFeed: 'simulated' | 'offline';
    sirenNetwork: 'simulated' | 'offline';
    capGateway: 'simulated' | 'offline';
  };
}
