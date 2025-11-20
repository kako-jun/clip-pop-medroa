#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap, env, fs, path::PathBuf};

use arboard::Clipboard;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use thiserror::Error;

#[derive(Debug, Error)]
enum AppError {
    #[error("unable to determine config directory")]
    MissingConfigDir,
    #[error("{0}")]
    Other(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum Theme {
    Dark,
    Light,
    Custom,
}

impl Default for Theme {
    fn default() -> Self {
        Theme::Dark
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum Corner {
    BottomRight,
    BottomLeft,
    TopRight,
    TopLeft,
}

impl Default for Corner {
    fn default() -> Self {
        Corner::BottomRight
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
struct CustomImages {
    copy: Option<String>,
    clear: Option<String>,
}

impl Default for CustomImages {
    fn default() -> Self {
        Self {
            copy: None,
            clear: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
struct AppConfig {
    theme: Theme,
    display_time: u64,
    corner: Corner,
    custom_images: CustomImages,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: Theme::Dark,
            display_time: 3,
            corner: Corner::BottomRight,
            custom_images: CustomImages::default(),
        }
    }
}

#[derive(Default)]
struct ClipboardState(Mutex<Option<String>>);

#[derive(Debug, Serialize)]
struct ClipboardPayload {
    kind: ClipboardEvent,
    text: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "lowercase")]
enum ClipboardEvent {
    Copy,
    Clear,
    None,
}

fn config_dir() -> Result<PathBuf, AppError> {
    if let Ok(override_dir) = env::var("CLIP_POP_MEDROA_CONFIG_DIR") {
        return Ok(PathBuf::from(override_dir));
    }

    let mut base = dirs_next::config_dir().ok_or(AppError::MissingConfigDir)?;
    base.push("ClipPopMedroa");
    Ok(base)
}

fn config_path() -> Result<PathBuf, AppError> {
    let mut path = config_dir()?;
    path.push("config.yaml");
    Ok(path)
}

fn read_config() -> Result<AppConfig, AppError> {
    let path = config_path()?;
    if !path.exists() {
        let default = AppConfig::default();
        write_config(&default)?;
        return Ok(default);
    }
    let contents = fs::read_to_string(&path).map_err(|e| AppError::Other(e.to_string()))?;
    let cfg: AppConfig = serde_yaml::from_str(&contents)
        .map_err(|e| AppError::Other(format!("failed to parse config: {e}")))?;
    Ok(sanitize_config(cfg))
}

fn write_config(cfg: &AppConfig) -> Result<(), AppError> {
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::Other(e.to_string()))?;
    }
    let contents = serde_yaml::to_string(&sanitize_config(cfg.clone()))
        .map_err(|e| AppError::Other(e.to_string()))?;
    fs::write(&path, contents).map_err(|e| AppError::Other(e.to_string()))?;
    Ok(())
}

fn sanitize_config(mut cfg: AppConfig) -> AppConfig {
    if cfg.display_time == 0 {
        cfg.display_time = 3;
    }
    if cfg.display_time > 60 {
        cfg.display_time = 60;
    }
    cfg
}

fn locale_candidates(raw: &str) -> Vec<String> {
    let lowered = raw.to_lowercase();
    let mut parts: Vec<&str> = lowered.split(|c| c == '-' || c == '_').collect();
    let mut result = Vec::new();
    while !parts.is_empty() {
        result.push(parts.join("_"));
        parts.pop();
    }
    if !result.iter().any(|code| code == "en") {
        result.push("en".to_string());
    }
    result
}

fn read_locale_from_path(path: PathBuf) -> Result<HashMap<String, String>, AppError> {
    let contents = fs::read_to_string(&path).map_err(|e| AppError::Other(e.to_string()))?;
    let data: HashMap<String, String> = serde_yaml::from_str(&contents)
        .map_err(|e| AppError::Other(format!("failed to parse locale: {e}")))?;
    Ok(data)
}

#[tauri::command]
fn load_config() -> Result<AppConfig, String> {
    read_config().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_config(config: AppConfig) -> Result<(), String> {
    write_config(&config).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_locale(locale: String, app: AppHandle) -> Result<HashMap<String, String>, String> {
    for candidate in locale_candidates(&locale) {
        if let Ok(dir) = config_dir() {
            let candidate_path = dir.join("locales").join(format!("{candidate}.yaml"));
            if candidate_path.exists() {
                return read_locale_from_path(candidate_path).map_err(|e| e.to_string());
            }
        }

        if let Some(path) = app
            .path_resolver()
            .resolve_resource(format!("resources/locales/{candidate}.yaml"))
        {
            if path.exists() {
                return read_locale_from_path(path).map_err(|e| e.to_string());
            }
        }
    }

    Err("no locale resources found".into())
}

#[tauri::command]
fn poll_clipboard(state: State<ClipboardState>) -> Result<ClipboardPayload, String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    let current = clipboard
        .get_text()
        .ok()
        .map(|text| text.replace('\0', ""))
        .filter(|text| !text.is_empty());

    let mut guard = state.0.lock();
    let event = match (&*guard, &current) {
        (Some(prev), Some(now)) if prev == now => ClipboardEvent::None,
        (_, Some(_)) => ClipboardEvent::Copy,
        (Some(_), None) => ClipboardEvent::Clear,
        _ => ClipboardEvent::None,
    };

    *guard = current.clone();

    Ok(ClipboardPayload {
        kind: event,
        text: current,
    })
}

#[tauri::command]
fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    fn with_temp_config_dir<F: FnOnce(PathBuf)>(f: F) {
        let dir = tempdir().expect("tempdir should exist");
        env::set_var("CLIP_POP_MEDROA_CONFIG_DIR", dir.path());
        f(dir.path().to_path_buf());
        env::remove_var("CLIP_POP_MEDROA_CONFIG_DIR");
    }

    #[test]
    fn sanitize_config_clamps_display_time() {
        let mut cfg = AppConfig::default();
        cfg.display_time = 0;
        let sanitized = sanitize_config(cfg.clone());
        assert_eq!(sanitized.display_time, 3);

        cfg.display_time = 120;
        let sanitized = sanitize_config(cfg.clone());
        assert_eq!(sanitized.display_time, 60);

        cfg.display_time = 10;
        let sanitized = sanitize_config(cfg);
        assert_eq!(sanitized.display_time, 10);
    }

    #[test]
    fn locale_candidates_fallbacks_ordered() {
        let ja = locale_candidates("ja-JP");
        assert_eq!(ja, vec!["ja_jp", "ja", "en"]);

        let en = locale_candidates("en");
        assert_eq!(en, vec!["en"]);
    }

    #[test]
    fn read_config_creates_default_file() {
        with_temp_config_dir(|dir| {
            let cfg = read_config().expect("config should load");
            assert_eq!(cfg.display_time, AppConfig::default().display_time);

            let path = dir.join("config.yaml");
            let contents = fs::read_to_string(path).expect("config file should exist");
            let persisted: AppConfig = serde_yaml::from_str(&contents).expect("yaml should parse");
            assert_eq!(persisted.display_time, 3);
        });
    }

    #[test]
    fn write_config_sanitizes_and_persists() {
        with_temp_config_dir(|dir| {
            let mut cfg = AppConfig::default();
            cfg.display_time = 99;
            cfg.theme = Theme::Custom;
            cfg.corner = Corner::TopLeft;
            cfg.custom_images.copy = Some("/tmp/copy.png".into());

            write_config(&cfg).expect("write should work");

            let contents =
                fs::read_to_string(dir.join("config.yaml")).expect("config should exist");
            let persisted: AppConfig = serde_yaml::from_str(&contents).expect("yaml should parse");
            assert_eq!(persisted.display_time, 60, "display_time should be clamped");
            assert!(matches!(persisted.theme, Theme::Custom));
            assert!(matches!(persisted.corner, Corner::TopLeft));
            assert_eq!(
                persisted.custom_images.copy.as_deref(),
                Some("/tmp/copy.png")
            );
        });
    }
}

fn main() {
    tauri::Builder::default()
        .manage(ClipboardState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            exit_app,
            load_config,
            load_locale,
            poll_clipboard,
            save_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running Clip Pop Medroa");
}
