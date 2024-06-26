mod scraper;

use scraper::{get_absence, get_assignments, get_dashboard, get_schedule, get_schools, login};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust! via Tauri", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_schools,
            login,
            get_schedule,
            get_dashboard,
            get_absence,
            get_assignments
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
