# architecturego

This project powers the Landmark web app (Vite + React) with live camera capture, landmark detection, and mapping tools.

## Getting Started

1. `cd Landmark`
2. Copy `.env.example` to `.env` and add your API keys:
   - `VITE_GOOGLE_VISION_KEY` for Google Cloud Vision (used on the home camera feed)
   - `VITE_GEMINI_KEY` for Gemini landmark descriptions
   - `VITE_GEMINI_MODEL` (optional) if you need a specific Gemini model id. Without it the app will try, in order: `gemini-1.5-flash`, `gemini-1.5-flash-8b`, `gemini-1.0-pro`, `gemini-pro`.
   - `VITE_GOOGLE_MAPS_KEY` for the map experience (optional if you only need the camera)
   - Alternatively, place a Google service-account JSON (for example `lankdmark-*.json`) in the `Landmark/` directory and the app will sign Vision requests with that credential instead of an API key.
3. Install dependencies with `npm install`
4. Run the development server with `npm run dev`

## Landmark Detection Flow

- The home camera feed captures a frame and sends it to Google Cloud Vision for `LANDMARK_DETECTION`.
- When a landmark is found, the best match, confidence score, coordinates, and the top labels are stored with the snapshot.
- Gemini adds a short narrative about confirmed landmarks so the library doubles as a travel guide. If Gemini is unavailable, the snapshot is still saved with a warning.
- Failures gracefully fall back to saving the snapshot without landmark details so nothing is lost.

Remember to keep your API keys private and rotate them if they are ever exposed.
