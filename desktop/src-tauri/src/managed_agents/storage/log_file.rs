use std::fs::{self, File, OpenOptions};
use std::path::Path;

/// Maximum log file size before rotation (10 MB).
const MAX_LOG_FILE_SIZE: u64 = 10 * 1024 * 1024;

/// If `path` exceeds [`MAX_LOG_FILE_SIZE`], rotate it to `<path>.1`.
fn maybe_rotate_log(path: &Path) {
    let size = match fs::metadata(path) {
        Ok(metadata) => metadata.len(),
        Err(_) => return,
    };
    if size <= MAX_LOG_FILE_SIZE {
        return;
    }
    let mut rotated = path.as_os_str().to_owned();
    rotated.push(".1");
    let _ = fs::rename(path, &rotated);
}

pub(crate) fn open_log_file(path: &Path) -> Result<File, String> {
    maybe_rotate_log(path);
    let mut options = OpenOptions::new();
    options.create(true).append(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt as _;
        options.mode(0o600);
    }

    let file = options
        .open(path)
        .map_err(|error| format!("failed to open log file {}: {error}", path.display()))?;

    // `mode()` applies only when the file is created. Tighten logs written by
    // older builds as soon as they are reopened so upgrades do not leave agent
    // activity readable by other local accounts.
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt as _;
        file.set_permissions(fs::Permissions::from_mode(0o600))
            .map_err(|error| {
                format!(
                    "failed to secure log file permissions for {}: {error}",
                    path.display()
                )
            })?;
    }

    Ok(file)
}
