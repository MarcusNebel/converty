#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[tauri::command]
fn convert_video(input: String, output: String) -> Result<String, String> {
    Ok(format!("Converted {} -> {}", input, output))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![convert_video])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
