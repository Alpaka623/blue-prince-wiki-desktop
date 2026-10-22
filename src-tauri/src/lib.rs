use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager, Runtime};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct Finding {
    id: String,
    #[serde(default)]
    image_url: String,
    image_path: String,
    title: String,
    category: String,
    #[serde(default)]
    description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    extracted_text: Option<String>,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    custom_content: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    room: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    custom_prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    ai_raw_response: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    order: Option<i64>, // Use i64 for JS timestamps
    created_at: String,
    updated_at: String,
}

#[tauri::command]
fn get_app_data_dir<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().replace("\\\\?\\", ""))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn load_findings<R: Runtime>(app: AppHandle<R>) -> Result<Vec<Finding>, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let data_path = data_dir.join("data.json");

    if !data_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(data_path).map_err(|e| e.to_string())?;
    let findings: Vec<Finding> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(findings)
}

#[tauri::command]
fn save_findings<R: Runtime>(app: AppHandle<R>, findings: Vec<Finding>) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    }
    let data_path = data_dir.join("data.json");
    let content = serde_json::to_string_pretty(&findings).map_err(|e| e.to_string())?;
    fs::write(data_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn upload_image<R: Runtime>(
    app: AppHandle<R>,
    name: String,
    base64_data: String,
) -> Result<String, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let images_dir = data_dir.join("images");
    if !images_dir.exists() {
        fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;
    }

    let file_path = images_dir.join(&name);

    // Decode base64 (assuming format "data:image/png;base64,xxxx" or just "xxxx")
    let base64_str = if base64_data.contains(",") {
        base64_data.split(",").nth(1).unwrap_or("")
    } else {
        &base64_data
    };

    // Remove any potential whitespace/newlines from base64 string
    let base64_str = base64_str.replace(|c: char| c.is_whitespace(), "");

    use base64::{engine::general_purpose, Engine as _};
    let bytes = general_purpose::STANDARD
        .decode(base64_str)
        .map_err(|e| e.to_string())?;

    fs::write(&file_path, bytes).map_err(|e| e.to_string())?;

    // Return the filename
    Ok(name)
}

#[tauri::command]
fn load_settings<R: Runtime>(app: AppHandle<R>) -> Result<serde_json::Value, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let settings_path = data_dir.join("settings.json");

    if !settings_path.exists() {
        return Ok(serde_json::json!({}));
    }

    let content = fs::read_to_string(settings_path).map_err(|e| e.to_string())?;
    let settings: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
fn save_settings<R: Runtime>(app: AppHandle<R>, settings: serde_json::Value) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    }
    let settings_path = data_dir.join("settings.json");
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(settings_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn delete_image<R: Runtime>(app: AppHandle<R>, name: String) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| format!("Path error: {}", e))?;
    let image_path = data_dir.join("images").join(&name);

    if image_path.exists() {
        fs::remove_file(&image_path).map_err(|e| format!("Failed to delete {}: {}", image_path.display(), e))?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_data_dir,
            load_findings,
            save_findings,
            upload_image,
            delete_image,
            load_settings,
            save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
