use redactguard_core::detect_pii;

#[test]
fn detect_email() {
    let m = detect_pii("Contact: john.doe@example.com for info");
    assert!(!m.is_empty());
    assert!(m.iter().any(|x| x.kind == "email"));
}

#[test]
fn detect_phone() {
    let m = detect_pii("Call +34 612 345 678");
    assert!(!m.is_empty());
    assert!(m.iter().any(|x| x.kind == "phone"));
}

#[test]
fn detect_dni() {
    let m = detect_pii("DNI: 12345678Z");
    assert!(!m.is_empty());
    assert!(m.iter().any(|x| x.kind == "dni_es"));
}

#[test]
fn detect_ssn() {
    let m = detect_pii("SSN 123-45-6789");
    assert!(!m.is_empty());
    assert!(m.iter().any(|x| x.kind == "ssn_us"));
}

#[test]
fn no_false_positive_on_clean() {
    let m = detect_pii("Hello world, no PII here.");
    assert!(m.is_empty());
}
