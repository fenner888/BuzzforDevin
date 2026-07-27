use std::process::Command;

use crate::managed_agents::{resolve_command, KnownAcpRuntime};

use super::should_skip_claude_executable;

pub(crate) fn configure_runtime_cli(command: &mut Command, runtime: Option<&KnownAcpRuntime>) {
    let Some(runtime) = runtime else {
        return;
    };
    if runtime.id != "claude" {
        return;
    }
    if let Some(cli_path) = runtime.underlying_cli.and_then(resolve_command) {
        // On Windows, `.cmd` and `.bat` files are batch shims — they cannot be
        // passed directly to `CreateProcess` and cause EINVAL when the Claude
        // adapter tries to spawn them (issue #2397). Skip setting
        // `CLAUDE_CODE_EXECUTABLE` for shim paths so the adapter falls back to
        // its own PATH lookup and finds the real binary instead.
        // Non-Windows: `.cmd`/`.bat` are valid executables and must be assigned.
        if should_skip_claude_executable(&cli_path, cfg!(windows)) {
            return;
        }
        command.env("CLAUDE_CODE_EXECUTABLE", cli_path);
    }
}

#[cfg(test)]
mod tests {
    use super::configure_runtime_cli;
    use crate::managed_agents::{known_acp_runtime, lock_path_mutex};

    #[test]
    fn claude_uses_the_probed_cli_executable() {
        let _guard = lock_path_mutex();
        let temp = tempfile::tempdir().expect("temp dir");
        let cli = temp
            .path()
            .join(format!("claude{}", std::env::consts::EXE_SUFFIX));
        std::fs::write(&cli, "").expect("write fake cli");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&cli, std::fs::Permissions::from_mode(0o755))
                .expect("make fake cli executable");
        }
        let original_path = std::env::var_os("PATH");
        std::env::set_var("PATH", temp.path());

        let mut command = std::process::Command::new("buzz-acp");
        configure_runtime_cli(&mut command, known_acp_runtime("claude-agent-acp"));

        if let Some(path) = original_path {
            std::env::set_var("PATH", path);
        } else {
            std::env::remove_var("PATH");
        }
        assert!(command.get_envs().any(|(key, value)| {
            key == "CLAUDE_CODE_EXECUTABLE" && value == Some(cli.as_os_str())
        }));
    }

    #[test]
    fn codex_does_not_set_a_claude_executable() {
        let mut command = std::process::Command::new("buzz-acp");
        configure_runtime_cli(&mut command, known_acp_runtime("codex-acp"));
        assert!(!command
            .get_envs()
            .any(|(key, _)| key == "CLAUDE_CODE_EXECUTABLE"));
    }
}
