//! RedactGuard CLI — binary for audit and sanitize

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use redactguard_core::{auditor::ReversibilityAnalyzer, sanitizer::{ImageSanitizer, RedactionZone}};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "redactguard")]
#[command(about = "Zero-Trust Data Sanitization — CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Analyze file for reversible redaction vulnerabilities
    Audit {
        path: PathBuf,
        #[arg(short, long)]
        json: bool,
    },
    /// Sanitize file with irreversible redaction
    Sanitize {
        input: PathBuf,
        output: PathBuf,
        /// Zones as x,y,w,h (semicolon-separated: 10,20,100,30;50,60,80,40)
        #[arg(short, long)]
        zones: Option<String>,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Commands::Audit { path, json } => {
            let data = std::fs::read(&path).context("Failed to read file")?;
            let result = ReversibilityAnalyzer::analyze_bytes(&data)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
            if json {
                let out = serde_json::json!({
                    "score": result.score,
                    "findings": result.findings.iter().map(|f| serde_json::json!({
                        "severity": format!("{:?}", f.severity),
                        "message": f.message
                    })).collect::<Vec<_>>()
                });
                println!("{}", serde_json::to_string_pretty(&out)?);
            } else {
                println!("Score: {:.0}/100 (Reversibility risk)", result.score);
                for f in &result.findings {
                    println!("  - {}", f.message);
                }
            if result.findings.is_empty() && result.score < 50.0 {
                println!("✓ No critical vulnerabilities detected.");
            }
            }
        }
        Commands::Sanitize { input, output, zones } => {
            let data = std::fs::read(&input).context("Failed to read input")?;
            let zones_parsed: Vec<RedactionZone> = zones
                .as_deref()
                .unwrap_or("")
                .split(';')
                .filter_map(|s| {
                    let parts: Vec<u32> = s.split(',').filter_map(|p| p.trim().parse().ok()).collect();
                    if parts.len() == 4 {
                        Some(RedactionZone { x: parts[0], y: parts[1], width: parts[2], height: parts[3] })
                    } else {
                        None
                    }
                })
                .collect();
            let out = ImageSanitizer::sanitize_bytes(&data, &zones_parsed)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
            std::fs::write(&output, &out).context("Failed to write output")?;
            println!("✓ Sanitized: {} -> {}", input.display(), output.display());
        }
    }
    Ok(())
}
