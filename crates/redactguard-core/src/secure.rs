//! Secure memory handling: overwrite on drop to reduce exposure.

/// Overwrite bytes with zeros before use. Best-effort; compiler may optimize away.
#[inline(never)]
pub fn secure_zero(bytes: &mut [u8]) {
    bytes.fill(0);
}

/// Wrapper that zeros memory on drop.
pub struct SecureVec {
    inner: Vec<u8>,
}

impl SecureVec {
    pub fn new(v: Vec<u8>) -> Self {
        Self { inner: v }
    }
    pub fn as_slice(&self) -> &[u8] {
        &self.inner
    }
}

impl Drop for SecureVec {
    fn drop(&mut self) {
        secure_zero(&mut self.inner);
    }
}
