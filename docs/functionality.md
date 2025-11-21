---
layout: default
title: 3. Functionality
nav_order: 3
---

## 3. Functionality

### 3.1 Access the credentials

If chromeIPass detected a combination of username + password fields it requests all credentials for the current page from KeePassHttp.<br />
The received credentials are accessible via multiple ways which are described in the following sections.

#### 3.1.1 Popup

The icon of chromeIPass gets a question mark.<br />
Clicking on the icon opens a popup on which you can choose the credentials which should be filled in.

If there are several username + password combinations on the page the credentials are filled into the focused combination (focus on username or password field) or into the first combination.

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-choose-credentials.png" alt="popup choose credentials" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-choose-credentials.png)


#### 3.1.2 Autocomplete

For all combinations of username + password fields the username field supports autocomplete for the received credentials.

By clicking on an entry of the list or when the username field loose the focus it checks whether the username belongs to one of the received credentials and fills-in the password field.

This feature is activated by default and can be disabled on the settings page of chromeIPass.

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-autocomplete.png" alt="autocomplete" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-autocomplete.png)

#### 3.1.3 Context-menu

On every textfield chromeIPass adds 3 entries to the context-menu.<br />
Even if the field was not detected as a username or password field by chromeIPass these entries are available.

If you click on _Fill User + Pass_ or _Fill Pass Only_ chromeIPass checks whether the focused field belongs to a detected combination of username + password field. If this check fails it starts a redetection for only the focused field.<br />
If you focus an unrecognized password field and select _Fill User + Pass_ it will automatically detect the username field and fills-in the credentials.

__Fill User + Pass__ of the context-menu will only work if chromeIPass received only one pair of credentials. Otherwise it shows you an error message and you should use the autocomplete or popup.

__Fill Pass Only__ does work either chromeIPass received only one pair of credentials or the associated username field contains a username which belongs to one pair of the received credentials.

__Show Password Generator Icons__ restarts the detection of _visible_ password fields on the page and adds the key-icon for the password generator to each of them.

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-context-menu.png" alt="context-menu" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-context-menu.png)

#### 3.1.4 Shortcuts

chromeIPass supports 2 page-wide shortcuts:

__Ctrl+Shift+U__ is the shortcut for __Fill User + Pass__ of the context-menu which is described in [3.1.3](#313-context-menu).

__Ctrl+Shift+P__ is the shortcut for __Fill Pass Only__ of the context-menu which is also described in [3.1.3](#313-context-menu).


### 3.2 Password generator

chromeIPass offers a password generator which receives the password from KeePass itself.<br />
This function has to be enabled on the settings-page of chromeIPass.

This feature is only available with the KeePassHttp v1.4 or higher.

If it is enabled every password field contains a key icon on the right side. Click on it to open the password generator:<br />
[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-password-generator.png" alt="password-generator" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-password-generator.png)

If the key-icon does not appear, right-click on the input-field and select _chromeIPass > Show Password Generator icons_ in the context-menu.

Once opened the generated password is stored in the field till you reload or submit the page or till you press the generate button. Even if you close the dialog and click on another key-icon the displayed password does not change.

Does a page contain more than one password field and you opened the dialog on the first password field, the option to fill-in the next field is enabled. If the two password fields are successive on the page, this option is also checked. Otherwise it is unchecked.

If the password field has a limited length for inputted text chromeIPass will detect it and automatically cut the generated password. It will inform you about this change and copy the cutted password to your clipboard.

__Because chromeIPass has some [limitations](limitations) to remember credentials the password should always be copied to your clipboard.__


#### 3.2.1 How is the password generated?

chromeIPass sends a request to KeePass which generates a password with the settings of the built-in profile for auto-generated passwords.<br />
To change the length and composition of generated passwords, please open the KeePass Password Generation Options.<br />
Go to Keepass > Tools > Generate Password... and this dialog opens:<br />
[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/keepass-password-generation-options.png" alt="keepass-password-generation-options" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/keepass-password-generation-options.png)

1. Select the built-in profile _(Automatically generated passwords for new entries)_ and change the composition of the generated passwords.
2. Now click the _save_ button
3. A second dialog appears. Click on the down-arrow on the right side and select again the name of the built-in profile _(Automatically generated passwords for new entries)_.
4. Press OK and your changes are saved to the profile.


### 3.3 Detection of credential fields

1. After the page was loaded chromeIPass starts to search for all __visible__ input fields.
2. For every found input field of the type _password_ it checks whether the previous input field is a normal textfield.
    - if there is no previous field or the previous field is a password field --> don't add this fields as a detected username + password field combination.
    - if the previous field is a textfield --> add both fields as combination of username + password field.

The auto detection of credential fields is called only one time, after loading of the page finished.

There are known limitations when the auto detection cannot detect a username + password combination. Please go to [Limitations and known problems > Auto detection of input fields](limitations#72-auto-detection-of-input-fields) to read more about it.

When it did not detect a username + password field combination you can click on the browser icon of chromeIPass and press the button "Redetect credential fields".

You can also use the shortcuts or context-menu as described in [3.1.3](#313-context-menu) to start the redetection for the focused field.


### 3.4 Choose own credential fields for a page

Sometimes there are other input fields between the username field and the password field.<br />
In this cases chromeIPass cannot detect the correct combination of username + password fields.

But you can define the combination by yourself for every page.<br />
Just click on the browser-icon of chromeIPass and press "Choose own credential fields for this page":<br />
[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-normal.png" alt="popup-normal" width="200px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-normal.png)

First there are all normal textfields highlighted. Click on the field you want to use as username field or skip this step if no username field is required.

Now choose a password field and in the last step confirm your selection.

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-choose-credential-fields.png" alt="popup-normal" width="200px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-choose-credential-fields.png)

You can also choose additional fields, the so-called _String Fields_. Their functionality is described in [section 3.7](#37-fill-in-additional-values-via-string-fields).

The next time you open this page chromeIPass will use the defined combination of username + password field and does no longer auto detect combinations.

Certainly you can focus another field and use the context-menu ([3.1.3](#313-context-menu)) or shortcuts ([3.1.4](#314-shortcuts)) to start the detection for the focused field.


### 3.5 Remember passwords

Because Google Chrome does not offer an API for their built-in password manager chromeIPass implements it own way of detecting new or updated credentials.

If chromeIPass finds a combination of username + password fields it tries to get the corresponding form for them.<br />
For this form it registers a submit event which is called when the form is send.

__There are known limitations for this workflow which are described in [Limitations and known problems](limitations#7-limitations-and-known-problems).__

If chromeIPass detects unsaved credentials the browser icon of chromeIPass starts blinking red.<br />
The icon will remain blinking till you click on it or you ignore it for 2 further page visits (loading other sites).

If you click on it, it remains completely red till you add, update or dismiss the detected changes.<br />
It shows you the corresponding URL and username and the database in which the changes will be saved.

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-remember.png" alt="popup-normal" width="200px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-remember.png)

If you have multiple credentials for a page and want to update one entry you can press _Update_.<br />
Now a list of all available entries appears on which you can select the outdated entry. If the username matchs with one username of the available credentials this entry will be marked bold:

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-remember-update.png" alt="popup-normal" width="200px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-popup-remember-update.png)

New entries are stored in a separate group in KeePass which will be added by KeePassHttp.

### 3.6 Auto fill-in for HTTP Auth requests

KeePassHttp returns the found credentials sorted by best matching URL to chromeIPass.<br />
chromeIPass can try to automatically login with the first provided credentials on HTTP Auth requests.<br />
If this login attempt fails the login dialog is shown as normal.

The dialog of an HTTP Auth request is shown in the following screenshot:

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/http-auth-request.png" alt="http auth request" width="200px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/http-auth-request.png)

This feature is activated by default and can be disabled in settings.

### 3.7 Fill-in additional values via String Fields

You can fill-in additional information by defining string fields.

1. Choose your own credential fields for the page like explained in [section 3.4](#34-choose-own-credential-fields-for-a-page). You can also skip both, username and password.
2. Now you can choose additional fields which are named _String Fields_. You can even choose dropdown elements.
The order you choose these string fields is important for the fill-in method!
3. Activate the _String Fields_ setting in KeePassHttp like explained in the [KeePassHttp-documentation (setting no. 11)](https://alan-null.github.io/keepasshttp/configuration.html#settings-in-keepasshttp-options).
The alphanumeric ordered entries are mapped with the order you chose the String Fields.

Dropdown elements are filled in by the visible value. If you open a dropdown element you can see all available values. This visible value has to match with one String Field value from KeePass.