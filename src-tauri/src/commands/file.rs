use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    log::info!("Reading file: {}", path);
    fs::read_to_string(&path).map_err(|e| {
        log::error!("Failed to read file {}: {}", path, e);
        format!("Failed to read file: {}", e)
    })
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    log::info!("Writing file: {}", path);

    if let Some(parent) = PathBuf::from(&path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub async fn list_files(dir: String) -> Result<Vec<FileInfo>, String> {
    log::info!("Listing files in: {}", dir);
    let path = PathBuf::from(&dir);

    if !path.exists() || !path.is_dir() {
        return Err(format!("Not a valid directory: {}", dir));
    }

    let mut files = Vec::new();

    if let Ok(entries) = fs::read_dir(&path) {
        for entry in entries.flatten() {
            let file_path = entry.path();
            let metadata = fs::metadata(&file_path).ok();

            if let Some(name) = file_path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with(".") {
                    continue;
                }

                let file_info = FileInfo {
                    name: name.to_string(),
                    path: file_path.to_string_lossy().to_string(),
                    is_dir: file_path.is_dir(),
                    size: metadata.as_ref().map(|m| m.len()).unwrap_or(0),
                    modified_at: metadata
                        .as_ref()
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs() as i64)
                        .unwrap_or(0),
                };
                log::info!("Found file: {} at {}", name, file_info.path);
                files.push(file_info);
            }
        }
    }

    files.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    log::info!("Returning {} files", files.len());
    Ok(files)
}

#[derive(serde::Serialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified_at: i64,
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    log::info!("Creating directory: {}", path);
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    log::info!("Deleting file: {}", path);
    let p = PathBuf::from(&path);
    if p.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))
    }
}
