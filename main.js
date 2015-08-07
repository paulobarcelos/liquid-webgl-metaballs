chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main/index.html',
    { frame: "none", width: 500, height: 309, left: -1680, top: 1000});
});

