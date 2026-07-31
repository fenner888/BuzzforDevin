use nostr::{Event, EventBuilder, Kind};
use serde_json::Value;
use url::Url;

use crate::models::{ProfileBannerPositionInfo, ProfileInfo, ProfileLinkInfo};

const MAX_PROFILE_LINKS: usize = 8;
const MAX_PROFILE_LINK_LABEL_CHARS: usize = 40;
const MAX_PROFILE_URL_CHARS: usize = 2_048;

/// Kind 0 — NIP-01 profile metadata (full snapshot).
pub(crate) struct ProfileMetadata<'a> {
    pub(crate) display_name: Option<&'a str>,
    pub(crate) name: Option<&'a str>,
    pub(crate) picture: Option<&'a str>,
    pub(crate) about: Option<&'a str>,
    pub(crate) website: Option<&'a str>,
    pub(crate) nip05: Option<&'a str>,
    pub(crate) banner: Option<&'a str>,
    pub(crate) banner_position: Option<&'a ProfileBannerPositionInfo>,
    pub(crate) social_links: Option<&'a [ProfileLinkInfo]>,
}

pub(crate) fn build_profile(profile: ProfileMetadata<'_>) -> Result<EventBuilder, String> {
    let mut map = serde_json::Map::new();
    for (key, value) in [
        ("display_name", profile.display_name),
        ("name", profile.name),
        ("picture", profile.picture),
        ("about", profile.about),
        ("website", profile.website),
        ("nip05", profile.nip05),
        ("banner", profile.banner),
    ] {
        if let Some(value) = value {
            map.insert(key.into(), Value::String(value.into()));
        }
    }
    if let Some(links) = profile.social_links.filter(|links| !links.is_empty()) {
        map.insert(
            "links".into(),
            serde_json::to_value(links).map_err(|error| error.to_string())?,
        );
    }
    if let Some(position) = profile.banner_position {
        map.insert(
            "banner_position".into(),
            serde_json::to_value(position).map_err(|error| error.to_string())?,
        );
    }
    Ok(EventBuilder::new(
        Kind::Custom(0),
        Value::Object(map).to_string(),
    ))
}

pub fn normalize_profile_banner_position(
    position: ProfileBannerPositionInfo,
) -> Result<ProfileBannerPositionInfo, String> {
    if position.x > 100 || position.y > 100 {
        return Err("banner position must be between 0 and 100".to_string());
    }
    Ok(position)
}

pub fn profile_banner_position_from_value(value: &Value) -> Option<ProfileBannerPositionInfo> {
    serde_json::from_value::<ProfileBannerPositionInfo>(value.get("banner_position")?.clone())
        .ok()
        .and_then(|position| normalize_profile_banner_position(position).ok())
}

pub fn normalize_profile_website(website: &str) -> Result<String, String> {
    normalize_profile_url(website, "website", true)
}

pub fn normalize_profile_banner(banner: &str) -> Result<String, String> {
    normalize_profile_url(banner, "banner", true)
}

pub fn normalize_profile_links(
    links: Vec<ProfileLinkInfo>,
) -> Result<Vec<ProfileLinkInfo>, String> {
    if links.len() > MAX_PROFILE_LINKS {
        return Err(format!(
            "profile supports at most {MAX_PROFILE_LINKS} links"
        ));
    }

    let mut normalized = Vec::with_capacity(links.len());
    let mut predefined = std::collections::HashSet::new();
    for link in links {
        let kind = link.kind.trim().to_ascii_lowercase();
        if !matches!(kind.as_str(), "github" | "linkedin" | "x" | "custom") {
            return Err("profile link kind must be github, linkedin, x, or custom".to_string());
        }
        if kind != "custom" && !predefined.insert(kind.clone()) {
            return Err(format!("profile can contain only one {kind} link"));
        }

        let label = if kind == "custom" {
            let label = link.label.trim();
            if label.is_empty() || label.chars().count() > MAX_PROFILE_LINK_LABEL_CHARS {
                return Err(format!(
                    "custom link label must be 1-{MAX_PROFILE_LINK_LABEL_CHARS} characters"
                ));
            }
            label.to_string()
        } else {
            match kind.as_str() {
                "github" => "GitHub",
                "linkedin" => "LinkedIn",
                "x" => "X",
                _ => unreachable!(),
            }
            .to_string()
        };

        let url = normalize_profile_url(&link.url, "profile link", false)?;
        validate_social_host(&kind, &url)?;
        normalized.push(ProfileLinkInfo { kind, label, url });
    }
    Ok(normalized)
}

pub fn profile_links_from_value(value: &Value) -> Vec<ProfileLinkInfo> {
    let Some(items) = value.get("links").and_then(Value::as_array) else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| serde_json::from_value::<ProfileLinkInfo>(item.clone()).ok())
        .filter_map(|link| normalize_profile_links(vec![link]).ok()?.into_iter().next())
        .take(MAX_PROFILE_LINKS)
        .collect()
}

/// Convert a kind-0 NIP-01 profile metadata event into the desktop model.
pub fn profile_info_from_event(event: &Event) -> Result<ProfileInfo, String> {
    let value: Value = serde_json::from_str(&event.content)
        .map_err(|error| format!("kind:0 content is not valid JSON: {error}"))?;
    let display_name = value
        .get("display_name")
        .and_then(Value::as_str)
        .or_else(|| value.get("name").and_then(Value::as_str))
        .map(str::to_string);
    let string_field = |name| value.get(name).and_then(Value::as_str).map(str::to_string);

    Ok(ProfileInfo {
        pubkey: event.pubkey.to_hex(),
        display_name,
        avatar_url: string_field("picture"),
        about: string_field("about"),
        website: string_field("website"),
        banner_url: string_field("banner"),
        banner_position: profile_banner_position_from_value(&value),
        social_links: profile_links_from_value(&value),
        nip05_handle: string_field("nip05"),
        owner_pubkey: crate::nostr_convert::profile_valid_oa_owner_pubkey(event),
        has_profile_event: true,
    })
}

fn normalize_profile_url(value: &str, field: &str, allow_http: bool) -> Result<String, String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Ok(String::new());
    }
    if trimmed.chars().count() > MAX_PROFILE_URL_CHARS {
        return Err(format!("{field} URL is too long"));
    }
    let candidate = if trimmed.contains("://") {
        trimmed.to_string()
    } else {
        format!("https://{trimmed}")
    };
    let parsed = Url::parse(&candidate).map_err(|_| format!("{field} must be a valid URL"))?;
    let valid_scheme = parsed.scheme() == "https" || (allow_http && parsed.scheme() == "http");
    if !valid_scheme || parsed.host_str().is_none() {
        let scheme = if allow_http { "http or https" } else { "https" };
        return Err(format!("{field} must use {scheme}"));
    }
    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err(format!("{field} must not contain embedded credentials"));
    }
    Ok(parsed.to_string())
}

fn validate_social_host(kind: &str, url: &str) -> Result<(), String> {
    if kind == "custom" {
        return Ok(());
    }
    let host = Url::parse(url)
        .ok()
        .and_then(|parsed| parsed.host_str().map(str::to_ascii_lowercase))
        .unwrap_or_default();
    let valid = match kind {
        "github" => matches!(host.as_str(), "github.com" | "www.github.com"),
        "linkedin" => matches!(host.as_str(), "linkedin.com" | "www.linkedin.com"),
        "x" => matches!(
            host.as_str(),
            "x.com" | "www.x.com" | "twitter.com" | "www.twitter.com"
        ),
        _ => false,
    };
    valid
        .then_some(())
        .ok_or_else(|| format!("{kind} link must use the official {kind} domain"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_and_validates_profile_links() {
        let links = normalize_profile_links(vec![ProfileLinkInfo {
            kind: "github".to_string(),
            label: "ignored".to_string(),
            url: "github.com/fenner888".to_string(),
        }])
        .unwrap();
        assert_eq!(links[0].label, "GitHub");
        assert_eq!(links[0].url, "https://github.com/fenner888");
        assert!(normalize_profile_links(vec![ProfileLinkInfo {
            kind: "github".to_string(),
            label: "GitHub".to_string(),
            url: "https://example.com/fenner888".to_string(),
        }])
        .is_err());
    }

    #[test]
    fn banner_uses_web_image_url_rules() {
        assert_eq!(
            normalize_profile_banner("images.example/banner.png").unwrap(),
            "https://images.example/banner.png"
        );
        assert!(normalize_profile_banner("data:image/png;base64,nope").is_err());
    }

    #[test]
    fn validates_and_round_trips_banner_position() {
        let position = ProfileBannerPositionInfo { x: 18, y: 82 };
        assert_eq!(
            normalize_profile_banner_position(position).unwrap(),
            position
        );
        assert!(
            normalize_profile_banner_position(ProfileBannerPositionInfo { x: 101, y: 50 }).is_err()
        );

        let value = serde_json::json!({ "banner_position": { "x": 18, "y": 82 } });
        assert_eq!(profile_banner_position_from_value(&value), Some(position));

        let event = build_profile(ProfileMetadata {
            display_name: Some("Alice"),
            name: None,
            picture: None,
            about: None,
            website: None,
            nip05: None,
            banner: Some("https://images.example/banner.png"),
            banner_position: Some(&position),
            social_links: None,
        })
        .unwrap()
        .sign_with_keys(&nostr::Keys::generate())
        .unwrap();
        let content: Value = serde_json::from_str(&event.content).unwrap();
        assert_eq!(profile_banner_position_from_value(&content), Some(position));
    }
}
