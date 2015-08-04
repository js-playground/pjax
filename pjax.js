var Pjax = window.Pjax || (function(window, document) {

  var popstateEnabled = false,
      ids = [],
      cache = {},
      cacheTimeouts = {},
      currentId = null;

  function New(options) {
    return new PjaxPlugin(options);
  }

  function _uniqueId() {
    return (new Date).getTime() + Math.random();
  }

  function _evalInnerHtmlJavascript(elem) {

    var code,
        js, 
        i,
        script,
        scripts = elem.querySelectorAll('script'),
        len = scripts.length;

    for (i = 0; i < len; i++) {

      script = scripts[i];
      code = script.innerHTML;
      js = document.createElement('script');

      if (script.src !== '') {
        js.src = script.src;
      } else {
        js.text = code;
      }
      
      script.parentNode.replaceChild(js, script);
    }
  }

  function _removeCache(id) {

    if(cacheTimeouts.hasOwnProperty(id)) {
      clearTimeout(cacheTimeouts[id]);
      delete cacheTimeouts[id];
    }

    if(cache.hasOwnProperty(id)) {
      delete cache[id];
    }

    var i = ids.indexOf(id);
    if(i != -1) {
      ids.splice(i, 1);
    }    
  }

  function _popState(ctx, e) {

    if(e.state == null) {
      currentId = null;
      location.reload();
      return false
    }

    var state = JSON.parse(e.state),
        prevCurrent = currentId;

    currentId = state.id;

    var content = cache[state.id];

    if(content == undefined) {
      location.reload();
      return false
    }

    var ct = document.querySelector("[pjax-ct-id=\"" + prevCurrent + "\"]");

    if(ct == undefined) {
      location.reload();
      return false;
    }

    ct.innerHTML = content;
    ct.setAttribute("pjax-ct-id", state.id);
    _evalInnerHtmlJavascript(ct);
  }

  function _extend(a, b) {

    var options = {},
        key;

    for(key in a) {
      if(a.hasOwnProperty(key)) {
        options[key] = a[key];
      }
    }

    for (key in b) {
      if (b.hasOwnProperty(key)) {
        options[key] = b[key];
      }
    }

    if(options.cacheTimeout === 0 || options.maxCacheLength === 0) {
      options.cache = false;
    }

    return options;
  }

  function _init(ctx) {

    ctx.pushStateSupported = window.history && window.history.pushState && window.history.replaceState &&
                             // pushState isn't reliable on iOS until 5.
                             !navigator.userAgent.match(/((iPod|iPhone|iPad).+\bOS\s+[1-4]\D|WebApps\/.+CFNetwork)/);

    // only one popstate handler that reads from a global cache for all plugins
    if(!popstateEnabled){

      popstateEnabled = true;

      window.addEventListener("popstate", function(e) {
        if(currentId !== null){
          _popState(this, e);
        }
      });
    }
  }

  function PjaxPlugin(options) {
    this.options = _extend(this.options, options);
    _init(this);
  }

  // Triggering element, container and xhr are passed to all onXX methods
  PjaxPlugin.prototype.options = {
    push: true,                 // use pushState to add a browser history entry upon navigation
    replace: false,             // use replaceState to update the current entry rather than adding a new one. If push is false this option is disregarded.
    onUpdateCachedValues: null, // fires when your code should update prior to making the next request i.e. if you want to set input values for currently,
                                // input text and update the current cache before proceeding.
    onBusy: null,               // fires when request begins, set loading image here
    onComplete: null,           // fires just before html is added to container, stop loading image here?
    onSuccess: null,            // fires after content loaded and http response was 200
    onFailure: null,            // fires after content loaded and http response was not 200, this gets passed link, container and responseText
    cache: false,               // specifies whether to cache page entries for faster reload when hitting the back button or forward
    cacheTimeout: 30000,        // when cache is enabled this is the time in milliseconds before the cached entry is discarded; this prevents stale pages. 
                                // a zero value indicates you don't want to expire, which is crazy because each new partial load will just keep adding to memory
                                // until your browser blows up so if this is set to zero cache automatically gets set to false.
    maxCacheLength: -1,         // if maxCacheLength is set to zero, then cache is set to false.
    method: "POST",             // used only for non "GET" aka Load requests
    headers: null,              // javascript object {} additional headers that may need to be passed, such as CSRF token for Submit..., key = propery name.. value = key's value
    autoReplaceHTML: true       // Determines if innerHTML is replaced. If set to false, push, replace and cache are ignored    
  };

  PjaxPlugin.prototype.isPushStateSupported = function() {
    return this.pushStateSupported;
  };

  PjaxPlugin.prototype.Load = function(e, url, el, ct, onetimeOptions) {

    if((this.options.push || this.options.replace) && !this.isPushStateSupported) {
      return true;
    }

    if(e != null) {
      e.preventDefault();
    }

    var options = onetimeOptions == null ? this.options : _extend(this.options, onetimeOptions),
        state = { id: _uniqueId() },
        getUrl = url.indexOf("?") == -1 ? url + "?pjax=1" : url, // must add query param to prevent browser caching, because of hitting back this prevents browser from loading just ajax loaded content
        xhr = new XMLHttpRequest();

    // if trying to load the same page and it exists in cache
    // update cache with current content update timeout to new value and return
    if(options.autoReplaceHTML && cacheTimeouts.hasOwnProperty(currentId)) {

      if(options.onUpdateCachedValues != null) {
        options.onUpdateCachedValues(currentId);
        clearTimeout(cacheTimeouts[currentId]);
        cache[currentId] = ct.innerHTML;
        cacheTimeouts[currentId] = setTimeout(function(){ _removeCache(currentId); }, options.cacheTimeout);
      }

      if(window.location.href == url) {
        return false;
      }
    }

    // if this is the first page load and we want to push and not replace
    // so we can hit back all the way to the initial page load and even have 
    // it able to be loaded from cache
    if(currentId === null && options.cache && options.push && !options.replace && options.autoReplaceHTML) {
      // can't reuse same state object or setIntervals won't function correctly
      newState = { id: state.id };
      currentId = newState.id;
      window.history.replaceState(JSON.stringify(newState), ct.title || document.title, window.location.href)
      ct.setAttribute("pjax-ct-id", newState.id);
      ids.push(newState.id);
      cache[newState.id] = ct.innerHTML;
      cacheTimeouts[newState.id] = setTimeout(function(){ _removeCache(newState.id); }, options.cacheTimeout);
      state.id = _uniqueId();
    }

    if(options.onBusy != null) {
      options.onBusy(el, ct);
    }

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {

        // success or failure doesn't matter, must still call
        if(options.onComplete != null) {
          options.onComplete(el, ct, xhr);
        }

        if(xhr.status === 200) {

          if (options.autoReplaceHTML) { 
            ct.innerHTML = xhr.responseText;

            if(options.cache && options.push) {

              if(options.replace && cacheTimeouts.hasOwnProperty(currentId)) {
                clearTimeout(cacheTimeouts[currentId]);
                cache[currentId] = ct.innerHTML;
                cacheTimeouts[currentId] = setTimeout(function(){ _removeCache(currentId); }, options.cacheTimeout);

              } else {
                currentId = state.id;
                ct.setAttribute("pjax-ct-id", state.id);

                if(options.maxCacheLength > 0 && ids.length === options.maxCacheLength) {
                  _removeCache(ids[0]);
                }

                ids.push(newState.id);
                cache[state.id] = ct.innerHTML;
                cacheTimeouts[state.id] = setTimeout(function(){ _removeCache(state.id); }, options.cacheTimeout);
              }
            }

            _evalInnerHtmlJavascript(ct);

            if(options.push) {
              if(options.replace){
                window.history.replaceState(JSON.stringify(state), ct.title || document.title, url)
              } else {
                window.history.pushState(JSON.stringify(state), ct.title || document.title, url)
              }

              document.title = ct.title || document.title;
            }
        }

          if(options.onSuccess) {
            options.onSuccess(el, ct, xhr);
          }

        } else {
          if(options.onFailure) {
            options.onFailure(el, ct, xhr);
            return
          }
           
          if (options.autoReplaceHTML) { 
            ct.innerHTML = xhr.responseText;
            _evalInnerHtmlJavascript(ct);
          }

        }
      }
    };

    xhr.open('GET', getUrl, true);
    xhr.setRequestHeader('X-Pjax', 'true')

    if(options.headers != null) {

      for(key in options.headers) {
        
        if(options.headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, options.headers[key]);
        }
      }
    }

    xhr.send();
  };

  // push, replace and cache are ignored in Submit as there should never be a need any of them
  PjaxPlugin.prototype.Submit = function(e, url, el, ct, form, onetimeOptions) {

    if(e != null) {
      e.preventDefault();
    }

    var options = onetimeOptions == null ? this.options : _extend(this.options, onetimeOptions),
        isForm = form.tagName == "FORM" ? true : false,
        data = isForm ? new FormData(form) : null,
        // url = a.href,
        xhr = new XMLHttpRequest();

    if(options.onBusy != null) {
      options.onBusy(el, ct);
    }
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {

        // success or failure doesn't matter, must still call
        if(options.onComplete != null) {
          options.onComplete(el, ct, xhr);
        }

        if(xhr.status === 200) {
          
          if (options.autoReplaceHTML) { 
            ct.innerHTML = xhr.responseText;
            _evalInnerHtmlJavascript(ct);
          }

          if(options.onSuccess) {
            options.onSuccess(el, ct, xhr);
          }

        } else {

          if(options.onFailure) {
            options.onFailure(el, ct, xhr);
            return
          } 

          if (options.autoReplaceHTML) { 
            ct.innerHTML = xhr.responseText;
            _evalInnerHtmlJavascript(ct);
          }
        }
      }
    };

    xhr.open(options.method, url, true);
    xhr.setRequestHeader('X-Pjax', 'true')

    if(options.headers != null) {

      for(key in options.headers) {

        if(options.headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, options.headers[key]);
        }
      }
    }

    xhr.send(data);
  };

  return self = {
    New: New
  };

})(window, document);