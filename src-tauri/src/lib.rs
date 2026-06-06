mod tray;

use tauri::WindowEvent;
use tray::TrayState;

/// Update the tray "Adhan: On/Off" label from the frontend.
#[tauri::command]
fn set_tray_adhan_state(state: tauri::State<TrayState>, enabled: bool) {
    if let Some(item) = state.adhan_item.lock().unwrap().as_ref() {
        let label = if enabled {
            "الأذان: مُفعّل  ·  Adhan: On"
        } else {
            "الأذان: مُعطّل  ·  Adhan: Off"
        };
        let _ = item.set_text(label);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Single-instance must be registered first so a second launch focuses the
    // existing window instead of opening a duplicate.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            tray::show_main_window(app);
        }));
        builder = builder.plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ));
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .manage(TrayState::default())
        .invoke_handler(tauri::generate_handler![set_tray_adhan_state])
        .setup(|app| {
            tray::build_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Minimize-to-tray: closing the main window hides it instead of
            // quitting, so the scheduler keeps running in the background.
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
