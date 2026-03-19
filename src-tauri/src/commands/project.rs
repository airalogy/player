use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub path: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub tags: Vec<String>,
    pub starred: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub path: Option<String>,
}

fn get_app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

fn get_projects_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = get_app_data_dir(app)?;
    let projects_dir = data_dir.join("projects");
    if !projects_dir.exists() {
        fs::create_dir_all(&projects_dir)
            .map_err(|e| format!("Failed to create projects dir: {}", e))?;
    }
    Ok(projects_dir)
}

fn get_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = get_app_data_dir(app)?;
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir)
            .map_err(|e| format!("Failed to create data dir: {}", e))?;
    }
    Ok(data_dir.join("aimdlab.db"))
}

#[tauri::command]
pub async fn get_db_path_cmd(app: tauri::AppHandle) -> Result<String, String> {
    let path = get_db_path(&app)?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn create_project(
    app: tauri::AppHandle,
    name: String,
    description: Option<String>,
    path: Option<String>,
) -> Result<Project, String> {
    log::info!("Creating project: {}", name);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs() as i64;

    let id = uuid::Uuid::new_v4().to_string();

    let project_path = path.unwrap_or_else(|| {
        let projects_dir = get_projects_dir(&app).unwrap_or_default();
        projects_dir.join(&id).to_string_lossy().to_string()
    });

    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    let aimd_path = PathBuf::from(&project_path).join(format!("{}.aimd", id));
    log::info!("Creating aimd file at: {:?}", aimd_path);
    let aimd_content = format!("# {}\n\n{}", name, description.as_deref().unwrap_or(""));
    fs::write(&aimd_path, &aimd_content)
        .map_err(|e| format!("Failed to create aimd file: {}", e))?;
    log::info!("Aimd file created successfully");

    let project = Project {
        id,
        name,
        description: description.unwrap_or_default(),
        path: project_path,
        created_at: now,
        updated_at: now,
        tags: vec![],
        starred: false,
    };

    log::info!("Project created successfully");
    Ok(project)
}

#[tauri::command]
pub async fn list_projects(app: tauri::AppHandle) -> Result<Vec<Project>, String> {
    log::info!("Listing projects");
    let projects_dir = get_projects_dir(&app)?;

    let mut projects = Vec::new();

    let entries = fs::read_dir(&projects_dir).map_err(|e| {
        log::error!("Failed to read projects dir: {}", e);
        e.to_string()
    })?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(id) = path.file_name().and_then(|n| n.to_str()) {
                let aimd_path = path.join(format!("{}.aimd", id));
                let (name, description) = if aimd_path.exists() {
                    if let Ok(content) = fs::read_to_string(&aimd_path) {
                        let mut lines = content.lines();
                        let first_line = lines.next().unwrap_or("Untitled").trim_start_matches('#').trim();
                        let description: String = lines.collect::<Vec<_>>().join("\n").trim().to_string();
                        (first_line.to_string(), description)
                    } else {
                        (id.to_string(), String::new())
                    }
                } else {
                    (id.to_string(), String::new())
                };

                let metadata = fs::metadata(&path).ok();
                let created_at = metadata
                    .as_ref()
                    .and_then(|m| m.created().ok())
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0);

                let updated_at = metadata
                    .as_ref()
                    .and_then(|m| m.modified().ok())
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0);

                projects.push(Project {
                    id: id.to_string(),
                    name,
                    description,
                    path: path.to_string_lossy().to_string(),
                    created_at,
                    updated_at,
                    tags: vec![],
                    starred: false,
                });
            }
        }
    }

    projects.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(projects)
}

#[tauri::command]
pub async fn open_project(app: tauri::AppHandle, id: String) -> Result<Project, String> {
    log::info!("Opening project: {}", id);
    let projects_dir = get_projects_dir(&app)?;
    let project_path = projects_dir.join(&id);

    if !project_path.exists() {
        return Err(format!("Project not found: {}", id));
    }

    let aimd_path = project_path.join(format!("{}.aimd", id));
    let (name, description) = if aimd_path.exists() {
        if let Ok(content) = fs::read_to_string(&aimd_path) {
            let mut lines = content.lines();
            let first_line = lines.next().unwrap_or("Untitled").trim_start_matches('#').trim();
            let description: String = lines.collect::<Vec<_>>().join("\n").trim().to_string();
            (first_line.to_string(), description)
        } else {
            (id.clone(), String::new())
        }
    } else {
        (id.clone(), String::new())
    };

    let metadata = fs::metadata(&project_path).ok();
    let created_at = metadata
        .as_ref()
        .and_then(|m| m.created().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let updated_at = metadata
        .as_ref()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    Ok(Project {
        id,
        name,
        description,
        path: project_path.to_string_lossy().to_string(),
        created_at,
        updated_at,
        tags: vec![],
        starred: false,
    })
}

#[tauri::command]
pub async fn delete_project(app: tauri::AppHandle, id: String) -> Result<(), String> {
    log::info!("Deleting project: {}", id);
    let projects_dir = get_projects_dir(&app)?;
    let project_path = projects_dir.join(&id);

    if project_path.exists() {
        fs::remove_dir_all(&project_path)
            .map_err(|e| format!("Failed to delete project: {}", e))?;
    }

    Ok(())
}
