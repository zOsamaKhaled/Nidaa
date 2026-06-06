# App icons

Tauri needs platform icon files here (`32x32.png`, `128x128.png`,
`128x128@2x.png`, `icon.icns`, `icon.ico`). They are **not** committed because
they are generated.

Generate them in one command from a single square PNG (1024×1024 recommended):

```bash
npm run tauri icon ./app-icon.png
```

This populates `src-tauri/icons/` with every size/format referenced in
`tauri.conf.json`. You must do this once before `npm run tauri:dev` or
`npm run tauri:build`, otherwise the build fails with a missing-icon error.

A starter source icon (`public/vite.svg`) is included — export it to a 1024px
PNG named `app-icon.png` at the project root, then run the command above.
