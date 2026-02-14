//! Heuristic PII detection via regex patterns.
//! GDPR, HIPAA: DNI, IBAN, email, phone, SSN-like.

use regex::Regex;
use std::sync::LazyLock;

static RE_EMAIL: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}").unwrap()
});
static RE_PHONE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"[\+]?[(]?\d{2,4}[)]?[-\s\.]?\d{2,4}[-\s\.]?\d{2,4}[-\s\.]?\d{2,4}").unwrap()
});
static RE_IBAN: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b").unwrap()
});
static RE_DNI_ES: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\b\d{8}[A-HJ-NP-TV-Z]\b").unwrap()
});
static RE_SSN_US: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\b\d{3}-\d{2}-\d{4}\b").unwrap()
});

#[derive(Debug, Clone, serde::Serialize)]
pub struct PiiMatch {
    pub kind: String,
    pub start: usize,
    pub end: usize,
}

pub fn detect_pii(text: &str) -> Vec<PiiMatch> {
    let mut matches = Vec::new();
    for m in RE_EMAIL.find_iter(text) {
        matches.push(PiiMatch { kind: "email".into(), start: m.start(), end: m.end() });
    }
    for m in RE_PHONE.find_iter(text) {
        if m.as_str().chars().filter(|c| c.is_ascii_digit()).count() >= 9 {
            matches.push(PiiMatch { kind: "phone".into(), start: m.start(), end: m.end() });
        }
    }
    for m in RE_IBAN.find_iter(text) {
        matches.push(PiiMatch { kind: "iban".into(), start: m.start(), end: m.end() });
    }
    for m in RE_DNI_ES.find_iter(text) {
        matches.push(PiiMatch { kind: "dni_es".into(), start: m.start(), end: m.end() });
    }
    for m in RE_SSN_US.find_iter(text) {
        matches.push(PiiMatch { kind: "ssn_us".into(), start: m.start(), end: m.end() });
    }
    matches.sort_by_key(|m| m.start);
    matches
}
