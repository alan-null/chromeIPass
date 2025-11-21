---
layout: default
title: 8. Troubleshooting
nav_order: 8
---

## 8. Troubleshooting

__First:__ Did you read the section [5. Tips and tricks](tips-and-tricks)?

__Second:__ Did you checked your [KeePassHttp options](https://alan-null.github.io/keepasshttp/configuration.html#settings-in-keepasshttp-options)? Maybe you only have to change the options...

If you [open an issue](https://github.com/alan-null/chromeIPass/issues/) always give us at least the following information:

1. chromeIPass version
2. Google Chrome version
2. KeePassHttp version
3. KeePass version
4. Pages on which the error occur

### 8.1 Wrong credentials are filled-in

1. Search in KeePass for the URL of the page on which the wrong credentials are filled-in.
2. Check the found entries for the credentials and confirm that the entries are up-to-date.

If this does not solve your problem, please [open an issue](https://github.com/alan-null/chromeIPass/issues/).

### 8.2 chromeIPass stopped working

#### 8.2.1 First check the running versions of your software

1. Check if you are using the [latest version of chromeIPass](https://chromewebstore.google.com/detail/chromeipass/bocdfmfhfcobbagfcbimemeclglilcbk).
2. Check if your browser Google chrome is up-to-date
3. Check if your versions of [KeePassXC](https://keepassxc.org/) OR ([KeePassHttp](https://github.com/alan-null/keepasshttp) + [KeePass](http://www.keepass.info)) are up-to-date

#### 8.2.2 Check the background page console for error messages
1. Open a tab with URL _chrome://extensions_ and activate the _Developer mode_ to be able to generate the background page:<br />
[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-extensions-developer-mode.png" alt="extensions developer mode" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-extensions-developer-mode.png)

2. In the opened window choose the tab _Console_:<br />
[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-console-background.png" alt="background page console" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-console-background.png)

#### 8.2.3 Check the inline page console for error messages

In the page on which chromeIPass stopped working please press _F12_ or do a right-click and choose _Inspect Element_ from the context-menu. Now choose the tab _Console_ to open the console for the inline scripts:

[<img src="https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-console-inline.png" alt="inline page console" width="300px" />](https://raw.github.com/alan-null/chromeIPass/master/documentation/images/cip-console-inline.png)
