//! SystemTrayService (native side).
//!
//! Builds the tray icon + menu and wires menu clicks to Tauri events that the
//! React frontend listens for (`tray://*`). Also keeps a handle to the
//! "Adhan: On/Off" item so the frontend can update its label via the
//! `set_tray_adhan_state` command.

use std::sync::Mutex;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Wry,
};

/// Managed state holding the toggle item so we can mutate its label later.
#[derive(Default)]
pub struct TrayState {
    pub adhan_item: Mutex<Option<MenuItem<Wry>>>,
}

/// Show + focus the main window (used by tray "Open" and left-click).
pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let open_i = MenuItem::with_id(app, "open", "فتح التطبيق  ·  Open", true, None::<&str>)?;
    let adhan_i = MenuItem::with_id(app, "toggle-adhan", "الأذان  ·  Adhan", true, None::<&str>)?;
    let lang_i = MenuItem::with_id(app, "change-language", "تغيير اللغة  ·  Language", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit_i = MenuItem::with_id(app, "quit", "خروج  ·  Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&open_i, &adhan_i, &lang_i, &sep, &quit_i])?;

    // Stash the toggle item so the frontend command can rename it.
    if let Some(state) = app.try_state::<TrayState>() {
        *state.adhan_item.lock().unwrap() = Some(adhan_i.clone());
    }

    TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Nidaa")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                show_main_window(app);
                let _ = app.emit("tray://open", ());
            }
            "toggle-adhan" => {
                let _ = app.emit("tray://toggle-adhan", ());
            }
            "change-language" => {
                let _ = app.emit("tray://change-language", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            // Left-click → reopen the window. Right-click shows the menu (with
            // Quit), handled automatically by the menu.
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}
