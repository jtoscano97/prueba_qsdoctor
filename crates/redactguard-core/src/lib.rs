//! RedactGuard Core — Ironclad Sanitization Engine
//!
//! Cryptographic data destruction. What we hide, ceases to exist.

pub mod sanitizer;
pub mod auditor;

pub use sanitizer::ImageSanitizer;
pub use auditor::ReversibilityAnalyzer;
