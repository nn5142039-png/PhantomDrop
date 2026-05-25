# PhantomDrop

Secure Zero-Knowledge Self-Destructing Secret Sharing Platform

PhantomDrop is a privacy-focused encrypted secret sharing system that enables users to securely transmit sensitive information using client-side cryptography and burn-after-reading delivery mechanics.

The platform follows a strict Zero-Knowledge Architecture, ensuring that servers never receive plaintext secrets or user passwords.

---

# Features

- Zero-Knowledge Architecture
- AES-256-GCM Encryption
- PBKDF2 Key Derivation (600,000 iterations)
- Self-Destructing Notes
- Burn-After-Reading Links
- Secure Random Salt & IV Generation
- Client-Side Cryptography
- UUID-Based Secret Routing
- Time-To-Live (TTL) Expiration
- Authentication Tag Integrity Validation
- Memory Sanitization for Derived Keys

---

# Tech Stack

## Frontend
- React.js
- Web Crypto API
- Tailwind CSS

## Backend
- Node.js
- Express.js

## Cryptography
- AES-256-GCM
- PBKDF2
- SHA-256

---

# Zero-Knowledge Security Model

PhantomDrop is designed so that:

- The server never sees plaintext data
- The server never receives the user's password
- Encryption and decryption happen entirely inside the browser
- Only encrypted ciphertext is transmitted to backend storage

This ensures complete client-side trust isolation.

---

# Architecture Overview

## Phase 1 — Client-Side Encryption

When the user clicks **Encrypt & Deploy**:

1. Generate:
   - 16-byte Salt
   - 12-byte Initialization Vector (IV)

2. Derive Key:
   - PBKDF2
   - SHA-256
   - 600,000 iterations
   - Output: 256-bit symmetric key

3. Encrypt:
   - AES-256-GCM encryption
   - Authentication tag automatically generated

4. Memory Purge:
   - Key buffer sanitized using `.fill(0)`

5. Upload:
   - Ciphertext
   - Salt
   - IV
   - TTL metadata

Only encrypted data is transmitted.

---

## Phase 2 — Server Storage Lifecycle

Backend receives encrypted payload and:

1. Generates UUIDv4 Note ID
2. Stores encrypted payload temporarily
3. Starts TTL expiration timer
4. Automatically destroys expired secrets

---

## Phase 3 — Retrieval & Decryption

When recipient opens the secret link:

1. Browser fetches encrypted payload
2. Server instantly deletes stored record
3. User enters passphrase
4. Browser re-derives encryption key
5. AES-256-GCM decrypts ciphertext
6. Secret is displayed only after auth tag validation

Subsequent access attempts return:

```http
404 Not Found
```

---

# Security Principles

## AES-256-GCM
Provides:
- Confidentiality
- Integrity Verification
- Tamper Detection

## PBKDF2 Hardening
600,000 SHA-256 iterations significantly increase brute-force resistance.

## Burn-After-Reading
Secrets are destroyed immediately after successful retrieval.

## Ephemeral Storage
Notes automatically expire after configured TTL duration.

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/phantomdrop.git
cd phantomdrop
```

## Install Dependencies

```bash
npm install
```

## Run Application

```bash
node index.js
```

---

# Example Workflow

1. User writes secret message
2. User sets password and TTL
3. Browser encrypts locally
4. Encrypted payload stored temporarily
5. Share generated URL
6. Recipient opens URL
7. Secret decrypts locally
8. Secret permanently destroyed

---

# API Routes

## Create Secret

```http
POST /api/secret
```

## Fetch Secret

```http
GET /api/secret/:id
```

---

# Future Improvements

- End-to-End File Sharing
- QR Code Secret Sharing
- WebSocket Expiration Sync
- Redis Distributed Expiry
- Rate Limiting
- Tor Hidden Service Support
- Multi-Factor Secret Unlocking
- Clipboard Auto-Clear


---

# Disclaimer

PhantomDrop is designed for educational and privacy-focused communication purposes. Users remain responsible for managing strong passwords and secure operational practices.


---

# Author

Developed by **Nitin Yadav**  
