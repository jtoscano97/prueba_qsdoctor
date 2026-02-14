use redactguard_core::{sanitizer::*, auditor::*};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
pub struct Zone {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Deserialize)]
pub struct FindingJs {
    pub severity: String,
    pub message: String,
    pub x: Option<u32>,
    pub y: Option<u32>,
}

#[derive(Serialize, Deserialize)]
pub struct AuditResultJs {
    pub score: f64,
    pub findings: Vec<FindingJs>,
    pub heatmap: Vec<Vec<f64>>,
}

/// Sanitize image bytes with given zones. Returns PNG bytes.
#[wasm_bindgen]
pub fn sanitize_image(input: &[u8], zones_json: &str) -> Result<Vec<u8>, JsValue> {
    let zones: Vec<Zone> = serde_json::from_str(zones_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let redaction_zones: Vec<RedactionZone> = zones
        .into_iter()
        .map(|z| RedactionZone { x: z.x, y: z.y, width: z.width, height: z.height })
        .collect();
    ImageSanitizer::sanitize_bytes(input, &redaction_zones)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Audit image for reversibility. Returns JSON string.
#[wasm_bindgen]
pub fn audit_image(input: &[u8]) -> Result<String, JsValue> {
    let result = ReversibilityAnalyzer::analyze_bytes(input)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let findings: Vec<FindingJs> = result
        .findings
        .into_iter()
        .map(|f| FindingJs {
            severity: format!("{:?}", f.severity),
            message: f.message,
            x: f.x,
            y: f.y,
        })
        .collect();
    let js_result = AuditResultJs {
        score: result.score,
        findings,
        heatmap: result.heatmap,
    };
    serde_json::to_string(&js_result).map_err(|e| JsValue::from_str(&e.to_string()))
}
