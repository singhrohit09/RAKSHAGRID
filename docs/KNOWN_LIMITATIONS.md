# RakshaGrid — Known Limitations & Future Roadmap

---

## 1. Current Architecture Limitations

1. **Map Tile Caching in Total Offline Scenarios:**
   - *Observation:* While incident coordinates, risk buffers, and tactical vector markers function completely offline from local cache, base raster map tiles (CartoDB/OpenStreetMap) require cached tile pre-fetching if the client is completely disconnected without prior map exploration.
   - *Mitigation:* The system alerts the operator with the tactical offline banner (`DISCONNECTED — Operating in resilient offline cache mode`) and preserves all vector geometries and coordinates.
2. **Supabase Realtime Connection Thresholds:**
   - *Observation:* On free-tier Supabase projects, concurrent WebSocket connections are capped at 200 simultaneous users.
   - *Mitigation:* Enterprise deployments should configure connection pooling (Supavisor) or scale to Supabase Pro/Team tiers.
3. **Simulated Weather Sensor Feeds:**
   - *Observation:* When an OpenWeather API key is not supplied, the weather service uses deterministic mathematical models calibrated for coastal cyclones and monsoonal precipitation rather than live satellite radar.
   - *Mitigation:* Production deployments can supply `VITE_OPENWEATHER_API_KEY` in `.env`.
4. **Browser LocalStorage Quotas:**
   - *Observation:* Browser `localStorage` typically enforces a 5MB to 10MB quota per domain.
   - *Mitigation:* DataService automatically caps audit logs at the 200 most recent operational events to prevent storage exhaustion. Production environments synchronize directly with PostgreSQL.

---

## 2. Planned Future Enhancements

- **Direct HAM Radio / LoRa Mesh Gateway:** Integration with low-power LoRa mesh radios (Meshtastic) to transmit low-bandwidth CAP alerts directly to field radios without cellular or internet infrastructure.
- **Drone Telemetry Video Streams:** WebRTC video streaming feeds embedded directly in the GIS Map marker popup for real-time aerial damage assessment.
- **Satellite InSAR Subsidence Tracking:** Automated integration with ESA Copernicus Sentinel-1 radar data to detect structural levee failures before breach occurs.
