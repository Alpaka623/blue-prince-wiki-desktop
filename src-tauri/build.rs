fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&[
                "load_findings",
                "save_findings",
                "upload_image",
                "load_settings",
                "save_settings",
                "get_app_data_dir",
            ])),
    )
    .expect("failed to run tauri-build");
}
