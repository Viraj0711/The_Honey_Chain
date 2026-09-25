# Agent Execution Guidelines & Code Rules

## Implementation Constraints
* Enforce strict syntax-required indentations only.
* Implement software ECDSA secp256k1 cryptographic signing natively without adding bloated external dependencies.
* Maintain multi-model database separation (Model 1: Hardware, Model 2: Farmer Lab, Model 3: AI Final Report).
* Ensure Model 3 dynamic QR generation binds strictly to read-only Model 3 record URIs.
* Maintain offline-first sync logic with explicit 7-day retention expiration tasks for local memory management.
* Exclude all explanatory comments, boilerplate prose, and descriptive docstrings inside code files.
* Do NOT use emojis anywhere in source code, commit messages, or technical documentation files.
* Strictly enforce a NO SLOPS policy: generate zero unused imports, zero dead code, no redundant wrappers, and no conversational text inside source files.
