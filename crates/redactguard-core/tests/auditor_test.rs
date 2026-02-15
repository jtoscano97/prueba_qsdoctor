use redactguard_core::auditor::ReversibilityAnalyzer;

#[test]
fn audit_uniform_image_low_score() {
    let img = image::RgbaImage::from_fn(64, 64, |_, _| image::Rgba([128, 128, 128, 255]));
    let mut out = Vec::new();
    img.write_to(&mut std::io::Cursor::new(&mut out), image::ImageFormat::Png)
        .unwrap();
    let result = ReversibilityAnalyzer::analyze_bytes(&out).unwrap();
    assert!(result.score < 100.0);
}

#[test]
fn audit_semi_transparent_detects() {
    let mut img = image::RgbaImage::from_fn(32, 32, |_, _| image::Rgba([255, 255, 255, 255]));
    img.put_pixel(10, 10, image::Rgba([0, 0, 0, 128]));
    let mut out = Vec::new();
    img.write_to(&mut std::io::Cursor::new(&mut out), image::ImageFormat::Png)
        .unwrap();
    let result = ReversibilityAnalyzer::analyze_bytes(&out).unwrap();
    let has_opacity_finding = result
        .findings
        .iter()
        .any(|f| f.message.contains("Semi-transparent") || f.message.contains("alpha"));
    assert!(has_opacity_finding);
}
