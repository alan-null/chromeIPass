---
layout: default
title: 9. Security
nav_order: 9
---

## 9. Security

- every communication with KeePass and KeePassHttp is encrypted with the symmetric version of AES in CBC-mode.
- the messages are crypted with a key of the length of 256bit.
- the communication happens via `http://localhost` on port 19455 on which KeePassHttp is listening.

The system is only in the moment of connecting a database to chromeIPass vulnerable. At this point KeePassHttp has to transmit the key to chromeIPass which will store it in the secured space of the extension. If someone records this traffic it could be possible to extract the key from it.

Any further communication is encrypted with this key and no longer vulnerable!