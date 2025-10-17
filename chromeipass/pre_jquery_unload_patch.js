(function () {
	try {
		var orig = EventTarget.prototype.addEventListener;
		if (orig && !EventTarget.prototype.__cipUnloadPatched) {
			EventTarget.prototype.addEventListener = function (type, listener, options) {
				if (type === 'unload') {
					// Skip registering; jQuery 1.11 uses this for legacy leak prevention.
					return;
				}
				return orig.call(this, type, listener, options);
			};
			EventTarget.prototype.__cipUnloadPatched = true;
		}
	} catch (e) {
		// Silent
	}
})();
