# Script to convert jQuery and jQuery UI references in files

# jquery.min.js
# - replace jQuery with cIPJQ (case-sensitive)

# jquery-ui.min.js
# - replaced jQuery with cIPJQ (match case)
# - replaced ui- with cip-ui-
# - replace .data("cip-ui- with .data("ui-

# jquery-ui.min.css
# - removed all classes with "icon"
# - replaced .ui- with .cip.ui-
# - replaced url(images with url(chrome-extension://__MSG_@@extension_id__/images

# file paths
$js_jQuery_UI = "jquery-ui.min.js"
$js_jQuery = "jquery.min.js"
$css_jQuery_UI = "jquery-ui.min.css"

# Process jquery-ui.min.js
(Get-Content "raw/$js_jQuery_UI") |
ForEach-Object {
    $_ -creplace 'jQuery', 'cIPJQ' `
        -creplace 'ui-', 'cip-ui-' `
        -creplace '\.data\("cip-ui-', '.data("ui-'
} | Set-Content "dist/$js_jQuery_UI"

# Process jquery.js
(Get-Content "raw/$js_jQuery") |
ForEach-Object {
    $_ -creplace 'jQuery', 'cIPJQ'
} | Set-Content "dist/$js_jQuery"

# Process jquery-ui.min.css
$cssRaw = Get-Content "raw/$css_jQuery_UI" -Raw
$cssRaw = [regex]::Replace($cssRaw, '(?<=^|})[^{}*]*icon[^{}]*\{[^{}]*\}', '')
$cssRaw = $cssRaw `
    -creplace '\.ui-', '.cip-ui-' `
    -creplace 'url\(images', 'url(chrome-extension://__MSG_@@extension_id__/images'
$cssRaw | Set-Content "dist/$css_jQuery_UI"