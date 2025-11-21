---
layout: default
title: 7. Limitations and known problems
nav_order: 7
---

## 7. Limitations and known problems

### 7.1 Remember credentials

Google Chrome does not offer an API to communicate with the password manager. Therefor chromeIPass implements its own way of checking for changed credentials.

On the form in which a combination of username + password fields is detected, chromeIPass registers an event which will be called when the form is submitted.

This event checks whether the submitted username and password have changed and shows the remember dialog.

But there exist several problems which we currently cannot overcome and which lead to not recognize the changes:

1. If the password field is cleared by some JavaScript code which hashes the value for example, chromeIPass can no longer access the value of the password and therefore no remember dialog is shown.
2. If there are page internal submit events registered on the form which will be triggered before our submit-request (for example: ajax calls), our request is possibly not triggered and no remember dialog will be shown.

Another problem is that chromeIPass cannot clearly differentiate between a successful and failed login attempt.<br />
The remember dialog will also be shown for failed login attempts.

### 7.2 Auto detection of input fields

#### 7.2.1 Problem
The detection does only detect fields which are __visible__ when this function is called.<br />
It is only one time called automatically: After loading of the page finished.

New input fields which are created with JavaScript or with an AJAX-call cannot be detected, because they get visible __after__ the auto detection was called.

For example an overlay for signin or signup could possibly not auto detected by chromeIPass because either the input fields are created just-in-time or they are hidden to the user while auto detection is running.

#### 7.2.2 Solution
When it did not detect any username + password field combination you can click on the browser icon of chromeIPass and press the button "Redetect credential fields".

You can also focus the visible username field or password field and press __Ctrl+Shift+U__. This will start a redetection for the focused field, too.
