---
layout: default
title: 5. Tips and tricks
nav_order: 5
---

## 5. Tips and tricks

If the credential fields are not detected automatically you can focus one of the fields and press __Ctrl+Shift+U__ or __Ctrl+Shift+P__ to trigger redetecting the fields and filling-in the credentials. Also you can click on the browser icon and press the button _Redetect credential fields_.

If chromeIPass detects wrong credential fields choose them by yourself with the button _Choose own credential fields for this page_ which is available in every popup.

If chromeIPass always asks to unlock the database and this is annoying you, you can simply disable this feature in the [options of KeePassHttp](https://alan-null.github.io/keepasshttp/configuration.html#settings-in-keepasshttp-options).

__It's always a good idea to have a look into the options of KeePassHttp. Maybe your feature request or problem is still implemented and can be solved by changing the options.__
[Go to the illustrated readme for the KeePassHttp options](https://alan-null.github.io/keepasshttp/configuration.html#settings-in-keepasshttp-options)

#### Support multiple URLs for one username + password combination
This is natively supported by KeePass with the references feature. You can find an illustrated description in the [readme of KeePassHttp](https://github.com/alan-null/keepasshttp#support-multiple-urls-for-one-username--password).

#### Disable the system tray notifications for found entries
Open the [options of KeePassHttp](https://alan-null.github.io/keepasshttp/configuration.html#-show-a-notification-when-credentials-are-requested) and configure `Show a notification when credentials are requested` feature.

#### Change the sort order of entries chromeIPass is displaying
Open the [options of KeePassHttp](https://alan-null.github.io/keepasshttp/configuration.html#sorting) and configure `Sorting` section.
