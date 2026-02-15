//! PDF metadata stripping.

/// Detect if bytes are PDF (magic %PDF-)
pub fn is_pdf(input: &[u8]) -> bool {
    input.len() >= 5 && &input[0..5] == b"%PDF-"
}

#[cfg(feature = "pdf")]
/// Strip metadata (Info, Metadata) from PDF trailer. Returns cleaned bytes.
pub fn strip_pdf_metadata(input: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    use lopdf::Document;
    use std::io::Cursor;
    let mut doc = Document::load_from(Cursor::new(input))?;
    doc.trailer.remove(b"Info");
    doc.trailer.remove(b"Metadata");
    let mut out = Vec::new();
    doc.save_to(&mut out)?;
    Ok(out)
}

#[cfg(not(feature = "pdf"))]
/// Stub when pdf feature disabled (e.g. for WASM)
pub fn strip_pdf_metadata(_input: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    Err("PDF support not available in this build".into())
}
