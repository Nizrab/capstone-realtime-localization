# Capstone Real-Time Localization

RTLS Pilot Monitor — Real-time indoor positioning system deployed at Carleton University Canal Building.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: AWS Elastic Beanstalk + S3
- **Positioning**: Wi-Fi RSSI Trilateration (AP31–AP34)

## Development

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API endpoint (Elastic Beanstalk) |
