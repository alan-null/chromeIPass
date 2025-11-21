---
layout: default
title: Changelog
nav_order: 100
toc_title: "Versions:"
---

# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]
{: .d-inline-block }
Coming soon
{: .label .label-yellow }

### Added
- _No changes yet._


## [v3.0.1.0]
{: .d-inline-block }
Latest
{: .label .label-green }

### Changed

- updated the URL following the initial release to the Chrome Store ([#16](https://github.com/alan-null/chromeIPass/issues/16))

### Removed

- removed unnecessary metadata ([#20](https://github.com/alan-null/chromeIPass/issues/20))

## [v3.0.0.0]

### Added
- Add workflow for release automation ([#13](https://github.com/alan-null/chromeIPass/issues/13))

### Fixed
- Permissions policy violation: unload is not allowed in this document ([#3](https://github.com/alan-null/chromeIPass/issues/3))
- Error at parameter 'tabId': Value must be at least 0 ([#5](https://github.com/alan-null/chromeIPass/issues/5))
- Block messages from non-main frames ([#6](https://github.com/alan-null/chromeIPass/issues/6))
- Fix the update check logic ([#11](https://github.com/alan-null/chromeIPass/issues/11))
- Options - update about page ([#16](https://github.com/alan-null/chromeIPass/issues/16))
- Inconsistency in settings format and issues with settings persistence ([#17](https://github.com/alan-null/chromeIPass/issues/17))

### Changed
- Migrate to Manifest V3 ([#2](https://github.com/alan-null/chromeIPass/issues/2))
  - Uncaught (in promise) Error: Could not establish connection. Received unexpected response. ([#7](https://github.com/alan-null/chromeIPass/issues/7))
  - Events/actions invoked twice ([#9](https://github.com/alan-null/chromeIPass/issues/9))
  - 'Copy to clipboard' button doesn't work ([#10](https://github.com/alan-null/chromeIPass/issues/10))
  - Popup Issues - association/connection status issues ([#18](https://github.com/alan-null/chromeIPass/issues/18))
  - Asynchronous status refresh after clicking the Reload button ([#19](https://github.com/alan-null/chromeIPass/issues/19))
  - Move onShowAlert to content script ([#12](https://github.com/alan-null/chromeIPass/issues/12))
- jQuery - update/remove dependency ([#4](https://github.com/alan-null/chromeIPass/issues/4))
- Formatting & cleanup ([#1](https://github.com/alan-null/chromeIPass/issues/1))

### Notes

This is the initial release of the revamped **chromeIPass** (Manifest V3), originally developed by Perry Nguyen and Lukas Schulze.


## [v2.8.1]

### Notes
- Legacy release of **chromeIPass** by Perry Nguyen.

<!-- versions -->

[unreleased]: https://github.com/alan-null/chromeIPass/compare/v3.0.1...HEAD
[v3.0.1.0]: https://github.com/alan-null/chromeIPass/compare/v3.0.0...v3.0.1
[v3.0.0.0]: https://github.com/alan-null/chromeIPass/compare/v2.8.1...v3.0.0
[v1.8.4.2]: https://github.com/alan-null/keepasshttp/compare/v1.8.4.2...v1.8.4.2
[v2.8.1]: https://github.com/pfn/passifox/releases/tag/chromeipass-2.8.1