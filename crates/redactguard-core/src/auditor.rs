//! Zero-Trust Auditor — detect reversible redactions.
//! Entropy, variance, and optional FFT analysis.

use image::Luma;
use std::path::Path;

#[cfg(feature = "fft")]
use rustfft::{FftPlanner, num_complex::Complex};

/// Result of reversibility analysis
#[derive(Debug, Clone)]
pub struct AuditResult {
    pub score: f64,       // 0–100, 100 = critical
    pub findings: Vec<Finding>,
    pub heatmap: Vec<Vec<f64>>,  // Risk per 8x8 block for X-Ray view
}

#[derive(Debug, Clone)]
pub struct Finding {
    pub severity: Severity,
    pub message: String,
    pub x: Option<u32>,
    pub y: Option<u32>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Severity {
    Critical,
    High,
    Medium,
}

/// Analyzer for detecting reversible redactions (pixelation, blur, low-entropy zones)
pub struct ReversibilityAnalyzer;

impl ReversibilityAnalyzer {
    /// Analyze image from bytes. For WASM/browser.
    pub fn analyze_bytes(input: &[u8]) -> Result<AuditResult, Box<dyn std::error::Error>> {
        let dynamic = image::load_from_memory(input)?;
        let has_semi_transparent = check_semi_transparent(&dynamic);
        let img = dynamic.to_luma8();
        let (width, height) = img.dimensions();
        let mut findings = Vec::new();
        let mut max_low_entropy = 0.0f64;
        let mut heatmap: Vec<Vec<f64>> = vec![vec![0.0; (width / 8 + 1) as usize]; (height / 8 + 1) as usize];

        const BLOCK: u32 = 8;
        for (by, y) in (0..height).step_by(BLOCK as usize).enumerate() {
            for (bx, x) in (0..width).step_by(BLOCK as usize).enumerate() {
                let ent = block_entropy(&img, x, y, BLOCK);
                let var = block_variance(&img, x, y, BLOCK);
                let risk_ent = if ent < 2.0 && ent > 0.0 { 1.0 - ent / 2.0 } else { 0.0 };
                let risk_var = if var < 100.0 && var > 0.0 { 1.0 - var / 100.0 } else { 0.0 };
                let risk = risk_ent.max(risk_var);
                max_low_entropy = max_low_entropy.max(risk);
                if by < heatmap.len() && bx < heatmap[0].len() {
                    heatmap[by][bx] = risk * 100.0;
                }
            }
        }

        #[cfg(feature = "fft")]
        let fft_risk = fft_pixelation_risk(&img);
        #[cfg(feature = "fft")]
        let max_low_entropy = max_low_entropy.max(fft_risk);

        let score = (max_low_entropy * 100.0).min(100.0);
        if score > 50.0 {
            findings.push(Finding {
                severity: Severity::High,
                message: "Low entropy zones detected — possible reversible redaction (pixelation/blur)".into(),
                x: None,
                y: None,
            });
        }
        if score > 80.0 {
            findings.insert(0, Finding {
                severity: Severity::Critical,
                message: "Critical: High probability of reversible redaction. Use cryptographic sanitization.".into(),
                x: None,
                y: None,
            });
        }
        if has_semi_transparent {
            findings.push(Finding {
                severity: Severity::High,
                message: "Semi-transparent regions (alpha < 100%) detected — content may be visible underneath.".into(),
                x: None,
                y: None,
            });
        }

        Ok(AuditResult { score, findings, heatmap })
    }

    /// Analyze image from file path.
    pub fn analyze_image(path: &Path) -> Result<AuditResult, Box<dyn std::error::Error>> {
        let data = std::fs::read(path)?;
        Self::analyze_bytes(&data)
    }
}

fn check_semi_transparent(img: &image::DynamicImage) -> bool {
    let rgba = img.to_rgba8();
    let (w, h) = rgba.dimensions();
    for y in 0..h {
        for x in 0..w {
            let p = rgba.get_pixel(x, y);
            if p[3] > 0 && p[3] < 255 {
                return true;
            }
        }
    }
    false
}

#[cfg(feature = "fft")]
fn fft_pixelation_risk(img: &image::ImageBuffer<Luma<u8>, Vec<u8>>) -> f64 {
    let (w, h) = img.dimensions();
    let n = w as usize;
    if n < 32 {
        return 0.0;
    }
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(n);
    let mut buffer: Vec<Complex<f32>> = (0..n)
        .map(|i| Complex::new(img.get_pixel(i as u32, h / 2)[0] as f32 / 255.0, 0.0))
        .collect();
    fft.process(&mut buffer);
    let block_sizes = [8usize, 16, 32];
    let mut max_mag = 0.0f32;
    for &bs in &block_sizes {
        if n >= bs {
            let freq = n / bs;
            let mag = buffer[freq].norm() + buffer[n - freq].norm();
            max_mag = max_mag.max(mag);
        }
    }
    (max_mag / (n as f32).sqrt()).min(1.0) as f64
}

fn block_variance(img: &image::ImageBuffer<Luma<u8>, Vec<u8>>, x: u32, y: u32, block: u32) -> f64 {
    let (w, h) = img.dimensions();
    let mut sum = 0u64;
    let mut sum_sq = 0u64;
    let mut count = 0u32;
    for dy in 0..block {
        for dx in 0..block {
            let px = x + dx;
            let py = y + dy;
            if px < w && py < h {
                let v = img.get_pixel(px, py)[0] as u64;
                sum += v;
                sum_sq += v * v;
                count += 1;
            }
        }
    }
    if count == 0 {
        return 0.0;
    }
    let mean = sum as f64 / count as f64;
    (sum_sq as f64 / count as f64) - (mean * mean)
}

fn block_entropy(img: &image::ImageBuffer<Luma<u8>, Vec<u8>>, x: u32, y: u32, block: u32) -> f64 {
    let (w, h) = img.dimensions();
    let mut hist = [0u32; 256];
    let mut count = 0u32;

    for dy in 0..block {
        for dx in 0..block {
            let px = x + dx;
            let py = y + dy;
            if px < w && py < h {
                hist[img.get_pixel(px, py)[0] as usize] += 1;
                count += 1;
            }
        }
    }

    if count == 0 {
        return 0.0;
    }

    let mut ent = 0.0;
    for &f in hist.iter().filter(|&&f| f > 0) {
        let p = f as f64 / count as f64;
        ent -= p * p.log2();
    }
    ent
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_block_entropy_uniform() {
        let buf = vec![0u8; 64];
        let img = image::ImageBuffer::<Luma<u8>, _>::from_raw(8, 8, buf).unwrap();
        let ent = block_entropy(&img, 0, 0, 8);
        assert_eq!(ent, 0.0);
    }
}
