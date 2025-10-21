# libs_converter / jQuery converter



PowerShell script to rewrite bundled [jQuery][jquery] / [jQuery UI][jqueryUI] assets for the extension with:
- Global namespace collision avoidance (jQuery -> cIPJQ).
- Prefixed UI class / data attribute namespace.
- CSS asset URL rewriting for packaged images.
- Removal of unused icon styles.

## Files processed
Input folder: **📂raw**

Output folder: **📂dist**

Required source filenames placed in **raw/**:
- `jquery.min.js`
- `jquery-ui.min.js`
- `jquery-ui.min.css`

Outputs with identical names are written to **dist/**.

(No folders are created automatically—ensure **raw/** and **dist/** exist.)

## Usage

From this directory (`scripts/libs_converter`):
1. Ensure PowerShell 5+ (or Core) environment.
1. Place unmodified original files into **raw/**.
1. Run:
   ```
   pwsh ".\jQuery converter.ps1"
   ```
1. Collect transformed assets from **dist/**

## Idempotence
Running again on already converted files (if mistakenly copied back into **raw/**) will double-apply changes (e.g., `cIPJQ` unaffected, but `.cip-ui-` would get another `cip-`). Always keep pristine originals in **raw/**.

## Limitations / Notes
- Simple textual replacements; assumes minified standard distributions.
- Regex for icon removal is conservative; adjust if additional pruning needed.
- Placeholder `__MSG_@@extension_id__` is resolved by Chrome at runtime.


[jquery]: https://jquery.com/download/
[jqueryUI]: https://jqueryui.com/download/#!version=1.14.1&components=111111011111101000111101110000000000000000000000