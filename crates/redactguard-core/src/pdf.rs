//! PDF utilities. Full lopdf integration deferred (requires Rust 1.88).

/// Detect if bytes are PDF (magic %PDF-)
pub fn is_pdf(input: &[u8]) -> bool {
    input.len() >= 5 && &input[0..5] == b"%PDF-"
}
