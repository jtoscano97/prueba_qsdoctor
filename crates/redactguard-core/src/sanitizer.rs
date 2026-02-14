//! Bit-level destruction: replace pixels with cryptographic noise.
//! Zero interpolation. Zero correlation with original.

use image::{DynamicImage, GenericImage, GenericImageView, ImageFormat};
use rand_chacha::ChaCha20Rng;
use rand::{RngCore, SeedableRng};
use std::io::Cursor;
use std::path::Path;

/// Zone to sanitize (x, y, width, height) in pixels
#[derive(Debug, Clone)]
pub struct RedactionZone {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

/// Engine for irreversible pixel destruction using CSPRNG
pub struct ImageSanitizer;

impl ImageSanitizer {
    /// Sanitize zones by replacing pixels with cryptographic noise.
    /// Guarantees no mathematical correlation with original content.
    pub fn sanitize_zones(
        img: &mut DynamicImage,
        zones: &[RedactionZone],
        seed: Option<[u8; 32]>,
    ) {
        let (width, height) = img.dimensions();
        let mut rng = match seed {
            Some(s) => ChaCha20Rng::from_seed(s),
            None => ChaCha20Rng::from_entropy(),
        };

        for zone in zones {
            let x_end = (zone.x + zone.width).min(width);
            let y_end = (zone.y + zone.height).min(height);

            for y in zone.y..y_end {
                for x in zone.x..x_end {
                    let mut pixel = img.get_pixel(x, y);
                    // Replace with cryptographic noise (not interpolation)
                    pixel[0] = rng.next_u32() as u8;
                    pixel[1] = rng.next_u32() as u8;
                    pixel[2] = rng.next_u32() as u8;
                    pixel[3] = 255; // Full opacity
                    img.put_pixel(x, y, pixel);
                }
            }
        }
    }

    /// Load image from path, sanitize, and save. In-memory processing.
    pub fn process_file(
        input_path: &Path,
        output_path: &Path,
        zones: &[RedactionZone],
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut img = image::open(input_path)?;
        Self::sanitize_zones(&mut img, zones, None);
        img.save(output_path)?;
        Ok(())
    }

    /// Sanitize image from bytes, return sanitized bytes. For WASM/browser.
    pub fn sanitize_bytes(input: &[u8], zones: &[RedactionZone]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let mut img = image::load_from_memory(input)?;
        Self::sanitize_zones(&mut img, zones, None);
        let mut output = Vec::new();
        img.write_to(&mut Cursor::new(&mut output), ImageFormat::Png)?;
        Ok(output)
    }
}
