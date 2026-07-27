//! Build-scoped release identity for the shared agent workspace and CLI link.

/// Upstream Buzz's release Nest directory name.
const NEST_DIR_PROD: &str = ".buzz";

/// Nest directory name for dev builds. Dev builds intentionally remain shared
/// across distributions so their existing development workflow is unchanged.
pub(super) const NEST_DIR_DEV: &str = ".buzz-dev";

pub(super) fn release_nest_dir(configured: Option<&'static str>) -> &'static str {
    configured.unwrap_or(NEST_DIR_PROD)
}

pub(super) fn configured_release_nest_dir() -> &'static str {
    release_nest_dir(option_env!("BUZZ_DESKTOP_BUILD_NEST_DIR"))
}

/// Whether this build uses upstream Buzz's release Nest namespace.
///
/// Downstream distributions with an isolated build-time Nest must not fall
/// back to or import upstream `~/.buzz` or legacy `~/.sprout` state.
pub fn uses_upstream_nest_namespace() -> bool {
    configured_release_nest_dir() == NEST_DIR_PROD
}

pub(super) fn release_cli_link_name(configured: Option<&'static str>) -> &'static str {
    configured.unwrap_or("buzz")
}

/// Returns the `~/.local/bin` link name for the bundled CLI.
///
/// Dev builds use `buzz-dev`; release builds use their validated build-time
/// identity, falling back to upstream Buzz's `buzz` name.
pub fn cli_link_name(is_dev: bool) -> &'static str {
    if is_dev {
        "buzz-dev"
    } else {
        release_cli_link_name(option_env!("BUZZ_DESKTOP_BUILD_CLI_LINK_NAME"))
    }
}
