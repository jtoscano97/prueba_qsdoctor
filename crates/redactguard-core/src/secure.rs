//! Secure memory handling: overwrite on drop (DoD 5220.22-M style).

/// Overwrite bytes with zeros. Volatile to reduce optimizer removal.
#[inline(never)]
pub fn secure_zero(bytes: &mut [u8]) {
    use std::ptr::write_volatile;
    let len = bytes.len();
    let ptr = bytes.as_mut_ptr();
    for i in 0..len {
        unsafe { write_volatile(ptr.add(i), 0u8) };
    }
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
