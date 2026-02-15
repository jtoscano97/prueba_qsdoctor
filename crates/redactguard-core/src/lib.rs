//! RedactGuard Core — Ironclad Sanitization Engine
//!
//! Cryptographic data destruction. What we hide, ceases to exist.

pub mod sanitizer;
pub mod auditor;
pub mod pii;
pub mod secure;
pub mod pdf;

pub use sanitizer::ImageSanitizer;
pub use auditor::ReversibilityAnalyzer;
pub use pii::{detect_pii, PiiMatch};
