use redactguard_core::sanitizer::{ImageSanitizer, RedactionZone};

#[test]
fn sanitize_creates_output() {
    let img = image::RgbaImage::from_fn(100, 100, |x, y| {
        image::Rgba([(x % 256) as u8, (y % 256) as u8, 200, 255])
    });
    let mut out = Vec::new();
    img.write_to(&mut std::io::Cursor::new(&mut out), image::ImageFormat::Png)
        .unwrap();
    let zones = vec![RedactionZone {
        x: 10,
        y: 10,
        width: 30,
        height: 20,
    }];
    let result = ImageSanitizer::sanitize_bytes(&out, &zones).unwrap();
    assert!(!result.is_empty());
    assert_ne!(&out, &result);
}

#[test]
fn sanitize_empty_zones() {
    let img = image::RgbaImage::from_fn(50, 50, |_, _| image::Rgba([255, 255, 255, 255]));
    let mut out = Vec::new();
    img.write_to(&mut std::io::Cursor::new(&mut out), image::ImageFormat::Png)
        .unwrap();
    let result = ImageSanitizer::sanitize_bytes(&out, &[]).unwrap();
    assert!(!result.is_empty());
}
