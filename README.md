# pjax
pushState + ajax = pjax, a lightweight pure javascript pjax library

##### The Why
so your asking yourself, why another pjax library? simply put, IMHO, most other libraries are overcomplicated, usage is only one way and most importantly the line between the library and functionality is muddled.

##### documentation not yet complete, Examples to come next

options
==============

##### note: all onXX functions get passed the link and container i.e. onSuccess(a, ct)

key | default | description
----|---------|------------
`push` | true | use pushState to add a browser history entry upon navigation.
`replace` | false | use replaceState to update the current entry rather than adding a new one. If push is false this option is disregarded.
`cache` | false | specifies whether to cache page entries for faster reload when hitting the back or forward button.
`cacheTimeout` | 30000ms | when cache is enabled this is the time in milliseconds before the cached entry is discarded; this prevents stale pages. a zero value indicates you don't want to expire, which is crazy because each new partial load will just keep adding to memory until your browser blows up so if this is set to zero cache automatically gets set to false.
`maxCacheLength` | -1 | specifies the max number of cache entries to keep in memory. if this value is set to zero, then cache is set to false.
`headers` | null | javascript object {} with additional headers that may need to be passed, such as CSRF toekn for Submit..., key = propery name.. value = key's value ex. var h = {}; h.csrf = "CSRFTOKEN"; csrf would be key, "CSRF".
`method` | `"POST"` | used only for pjax Submit function so you can specify POST,PUT,DELETE...
`onUpdateCachedValues` | null | fires prior to making the next request i.e. if you want to set input values for currently input text you can do this here and the cached version will be updated, if a cached version exists.
`onBusy` | null | fires when request begins i.e. set loading image here
`onComplete` | null | fires just before html is added to container i.e. can stop loading image here
`onSuccess` | null | fires after http response was 200 and html content added to the container
`onFailure` | | fires after http response was not 200, this gets passed link, container and responseText

Examples coming soon
====================
NOTE: these are just some examples of usage, you may use it how you see fit.
```javascript
var partialOptions = { push:false };
window.PjaxPartial = window.PjaxPartial || Pjax.New(partialOptions);
```

Methods
=======

#####Pjax.New
Creates a new Pjax plugin instance
```javascript
Pjax.New(options)

options - is any options that you may wish to override from the defaults, use {} if none.
```

#####PjaxPlugin.Load ( PjaxPlugin is the plugin returned from Pjax.New )
Loads content from the href of the passed in anchor tag, and replaces the containers content
NOTE: ?pjax=1 is added to the url if no other query parameters exists to ensure the request 
is not cached as caching causes issues when hitting the browser back button for partial content.
```javascript
PjaxPlugin.Load(e, a, ct, oneTimeOptions)

e              - is the click event of the anchor tag, needed to preventDefault operations
a              - the anchor element containing the href
ct             - the container element whose content will be replaced
oneTimeOptions - this can contain any options that you may want to override including the 
                 default used when calling Pjax.New, but just for this request, in order to handle one off 
                 situations without the need to initialize another plugin instance.
```

#####PjaxPlugin.Submit ( PjaxPlugin is the plugin returned from Pjax.New )
Submits content to the href of the passed in anchor tag, and replaces the containers content
NOTE: push, replace and cache options are all ignored for submits so no need to update those options
```javascript
PjaxPlugin.Submit(e, a, ct, oneTimeOptions)

e              - is the click event of the anchor tag, needed to preventDefault operations
a              - the anchor element containing the href
ct             - the container element whose content will be replaced
oneTimeOptions - this can contain any options that you may want to override including the 
                 default used when calling Pjax.New, but just for this request, in order to handle one off 
                 situations without the need to initialize another plugin instance.
```

Contributing
============

There will be a development branch for each version of this package i.e. v1-development, please
make your pull requests against those branches.

If changes are breaking please create an issue, for discussion and create a pull request against
the highest development branch for example this package has a v1 and v1-development branch
however, there will also be a v2-development brach even though v2 doesn't exist yet.

License
=======
Distributed under MIT License, please see license file in code for more details.
