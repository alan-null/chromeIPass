---
layout: default
title: 4. Configuration and settings
nav_order: 4
---

## 4. Configuration and settings

You don't need to configure chromeIPass.<br />
If chromeIPass does not have an authenticated connection to KeePassHttp it displays a red cross in the browser icon and requests you to establish a new connection.<br />
[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-connect.png" alt="popup-connect" width="200px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-connect.png)

For further configurations you can open the settings which are accessible via the settings button in the popups, the context-menu of the browser icon (entry is called _Options_) or the tab _chrome://extensions_ on the chromeIPass-entry there is also a link called _Options_.

### 4.1 Settings: General

On the _General Settings_ you can enable and disable key features like autocomplete, password generator or auto fill for HTTP Auth requests.

The changes are saved immediately.

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-settings-general.png" alt="settings general" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-settings-general.png)

### 4.2 Settings: Connected Databases

On the tab _Connected Databases_ chromeIPass shows you which databases are currently paired with KeePassHttp. You can also define a special icon for every database and see when it was last accessed.

The displayed icon depends on the database which is currently activated and unlocked in KeePass.

Removing an entry from chromeIPass __does not__ remove the key from KeePassHttp! But KeePassHttp is no longer able to send credentials to or receive data from chromeIPass for the currently activated database in KeePass.

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-settings-connected-databases.png" alt="settings general" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-settings-connected-databases.png)


### 4.3 Settings: Specified credential fields

In [section 3.4](functionality#34-choose-own-credential-fields-for-a-page) the function of _Choose own credential fields for this page_ is described.<br />
All credential fields which are defined with this function are listed on this tab.<br />
You can only remove them because it's not useful to define the fields manually.

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-settings-specified-credential-fields.png" alt="settings general" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-settings-specified-credential-fields.png)

### 4.4 Settings: Advanced (connection)

{: .warning }
Only change these settings if you know what you are doing.

These settings are hidden by default behind the **Show these settings anyway** button on the General tab.

- **Scheme** – Choose between `http` (default) and `https` for the connection to KeePassHttp. HTTPS support requires [KeePassHttp v2.2.0.0](https://alan-null.github.io/keepasshttp/changelog/#v2200) or higher.
- **Hostname** – The hostname on which KeePassHttp is listening. Change this if KeePass runs on a remote machine. Default: `localhost`.
- **Port** – The port on which KeePassHttp is listening. Change this if the default port is already in use. The same port must be configured in KeePassHttp. Default: `19455`.
- **Test** – Verify that chromeIPass can reach KeePassHttp with the current scheme, hostname, and port.
- **Suppress warnings and errors via alert** – Disables JavaScript alert dialogs for errors and warnings.
- **Respect maxlength attribute on inputs** – Limits filled-in values to the `maxlength` set on input fields by the website.

### 4.5 Settings: Experimental

This tab contains opt-in features that are still being tested. All experimental features are **disabled by default** and may change or be removed in future versions.

{: .note }
Enable these to help test new behaviour and report any issues on [GitHub](https://github.com/alan-null/chromeIPass/issues).

#### 🔲 Detect dynamically loaded login forms (SPA support)

Some websites — particularly Single Page Applications (SPAs) such as certain banking sites — inject their login form into an initially empty page *after* the page has already loaded. In this case chromeIPass finishes its normal initialisation before the fields exist in the DOM and therefore cannot detect them.

When this option is enabled, chromeIPass installs a `MutationObserver` that watches for newly added input fields. As soon as matching fields appear, credential detection is triggered automatically. The observer disconnects itself as soon as fields are successfully detected, or after 30 seconds — whichever comes first.

