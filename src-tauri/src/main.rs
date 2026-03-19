#[cfg(debug_assertions)]
use tauri::Manager;

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();

    log::info!("Starting AimdLab application");

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::project::get_db_path_cmd,
            commands::project::create_project,
            commands::project::list_projects,
            commands::project::open_project,
            commands::project::delete_project,
            commands::file::read_file,
            commands::file::write_file,
            commands::file::list_files,
            commands::file::create_directory,
            commands::file::delete_file,
        ])
        .setup(|_app| {
            log::info!("AimdLab setup complete");

            #[cfg(debug_assertions)]
            {
                let window = _app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}

fn main() {
    run();
}
