---
layout: default
title: 8. Security
nav_order: 8
---

## 8. Security

- every communication with KeePass and KeePassHttp is encrypted with the symmetric version of AES in CBC-mode.
- the messages are encrypted with a key of the length of 256bit.
- since [**v3.2.0**](/changelog/#v3200), all encrypted messages are additionally authenticated using **HMAC-SHA256** (Encrypt-then-MAC), preventing tampering and padding-oracle attacks.
- by default the communication happens via `http://localhost` on port 19455 on which KeePassHttp is listening. Since [**v3.1.0**](/changelog/#v3100), HTTPS is also supported and can be enabled in the extension settings via the **Scheme** selector (see [4. Configuration and settings](/configuration)).

The system is only in the moment of connecting a database to chromeIPass vulnerable. At this point KeePassHttp has to transmit the key to chromeIPass which will store it in the secured space of the extension. If someone records this traffic it could be possible to extract the key from it.

Any further communication is encrypted with this key and no longer vulnerable!