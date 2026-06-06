# Dev audio fallback

When running the frontend in a plain browser (`npm run dev`, no Tauri shell),
`AudioService` loads Adhan files from this folder (`/audio/<file>.mp3`).

Copy the same `.mp3` files described in `src-tauri/audio/README.md` here if you
want to preview Adhan playback in the browser. In the packaged desktop app the
bundled `src-tauri/audio/` files are used instead.
