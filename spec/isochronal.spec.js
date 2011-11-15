describe("isochronal", function ( ) {
    it("should set the timer if auto start is on", function ( ) {
        spyOn(window, "setTimeout");
        $.poll({ url: "testing", autoStart: true, cacheControl: false });
        expect(window.setTimeout).toHaveBeenCalled();
    });

    it("should not set the timer if auto start is off", function ( ) {
        spyOn(window, "setTimeout");
        $.poll({ url: "testing", autoStart: false, cacheControl: false });
        expect(window.setTimeout).not.toHaveBeenCalled();
    });

    it("should not create a new timer if already running when start is called", function ( ) {
        spyOn(window, "setTimeout");
        var token = $.poll({ url: "testing", autoStart: true, cacheControl: false });
        window.setTimeout.reset();
        token.start();
        expect(window.setTimeout).not.toHaveBeenCalled();
    });

    it("should create a new timer if not already running when start is called", function ( ) {
        spyOn(window, "setTimeout");
        var token = $.poll({ url: "testing", autoStart: false, cacheControl: false });
        window.setTimeout.reset();
        token.start();
        expect(window.setTimeout).toHaveBeenCalled();
    });

    it("should clear the timeout if running when stop is called", function ( ) {
        spyOn(window, "setTimeout");
        spyOn(window, "clearTimeout");
        var token = $.poll({ url: "testing", autoStart: true, cacheControl: false });
        token.stop();
        expect(window.clearTimeout).toHaveBeenCalled();
    });

    it("should not clear the timeout if not running when stop is called", function ( ) {
        spyOn(window, "setTimeout");
        spyOn(window, "clearTimeout");
        var token = $.poll({ url: "testing", autoStart: false, cacheControl: false });
        token.stop();
        expect(window.clearTimeout).not.toHaveBeenCalled();
    });

    it("should be able to start again once stopped", function ( ) {
        spyOn(window, "setTimeout");
        spyOn(window, "clearTimeout");
        var token = $.poll({ url: "testing", autoStart: true, cacheControl: false });
        token.stop();
        window.setTimeout.reset();
        token.start();
        expect(window.setTimeout).toHaveBeenCalled();
    });

    it("should set tick timeout if passed in via options", function ( ) {
        spyOn(window, "setTimeout");
        $.poll({ url: "testing", autoStart: true, tick: 500, cacheControl: false });
        expect(window.setTimeout.mostRecentCall.args[1]).toEqual(500);
    });

    it("should execute ajax request", function ( ) {
        spyOn($, "ajax");
        $.poll({ url: "testing", autoStart: true, cacheControl: false });
        waitsFor(function() {
            return $.ajax.callCount > 0;
        });
        runs(function() {
            expect($.ajax.mostRecentCall.args[0]["url"]).toEqual("testing");
        });
    });

    it("should execute user success function if supplied", function ( ) {
        spyOn($, "ajax").andCallFake(function(options) {
            options.success();
        });
        var called = false;
        $.poll({ url: "testing", autoStart: true, success: function ( ) { called = true; }, cacheControl: false });
        waitsFor(function() {
            return $.ajax.callCount > 0;
        });
        runs(function() {
            expect(called).toEqual(true);
        });
    });

    it("should execute comparison function if supplied", function ( ) {
        spyOn($, "ajax").andCallFake(function(options) {
            options.success();
        });
        var called = false;
        $.poll({ url: "testing", autoStart: true, comparison: function ( ) { called = true; return false; }, cacheControl: false });
        waitsFor(function() {
            return $.ajax.callCount > 0;
        });
        runs(function() {
            expect(called).toEqual(true);
        });
    });

    it("should not execute changed function if data is the same", function ( ) {
        spyOn($, "ajax").andCallFake(function(options) {
            options.success();
        });
        var called = false;
        $.poll({
            url: "testing",
            autoStart: true,
            comparison: function ( ) { return true; },
            changed: function ( ) { called = true; },
            cacheControl: false
        });
        waitsFor(function() {
            return $.ajax.callCount > 0;
        });
        runs(function() {
            expect(called).toEqual(false);
        });
    });

    it("should execute changed function if data has changed", function ( ) {
        spyOn($, "ajax").andCallFake(function(options) {
            options.success();
        });
        var called = false;
        $.poll({
            url: "testing",
            autoStart: true,
            comparison: function ( ) { return false; },
            changed: function ( ) { called = true; },
            cacheControl: false
        });
        waitsFor(function() {
            return $.ajax.callCount > 0;
        });
        runs(function() {
            expect(called).toEqual(true);
        });
    });

    it("should schedule another poll when previous one returns", function ( ) {
        spyOn(window, "setTimeout").andCallFake(function ( func, timeout ) {
            if (window.setTimeout.callCount === 1)
                func();
        });
        spyOn($, "ajax").andCallFake(function(options) {
            options.success();
            options.complete({ status: 200 }, "success");
        });
        $.poll({ url: "testing", autoStart: true, async: false, cacheControl: false });
        waitsFor(function() {
            return $.ajax.callCount > 0;
        });
        runs(function() {
            expect(window.setTimeout.callCount).toEqual(2);
        });
    });

    it("should call tick decay function when setting the timeout again", function ( ) {
        spyOn($, "ajax").andCallFake(function(options) {
            options.success();
            options.complete({ status: 200 }, "success");
        });
        var called = false;
        $.poll({
            url: "testing",
            autoStart: true,
            comparison: function ( ) { return false; },
            tickModifier: function ( ) { called = true; },
            cacheControl: false
        });
        waitsFor(function() {
            return $.ajax.callCount > 0;
        });
        runs(function() {
            expect(called).toEqual(true);
        });
    });

    it("should use value from the decay function to determine next timer tick", function ( ) {
        spyOn($, "ajax").andCallFake(function(options) {
            options.success();
            options.complete({ status: 200 }, "success");
        });
        spyOn(window, "setTimeout").andCallFake(function ( func, timeout ) {
            if (window.setTimeout.callCount === 1)
                func();
        });
        $.poll({
            url: "testing",
            autoStart: true,
            comparison: function ( ) { return false; },
            tickModifier: function ( ) { return 1234; },
            cacheControl: false
        });
        waitsFor(function() {
            return $.ajax.callCount > 0;
        });
        runs(function() {
            expect(window.setTimeout.mostRecentCall.args[1]).toEqual(1234);
        });
    });

    it("should pass in changed, http status, text status and current tick to decay function", function ( ) {
        spyOn($, "ajax").andCallFake(function(options) {
            options.success();
            options.complete({ status: 200 }, "success");
        });
        spyOn(window, "setTimeout").andCallFake(function ( func, timeout ) {
            if (window.setTimeout.callCount === 1)
                func();
        });
        var result;
        $.poll({
            url: "testing",
            autoStart: true,
            tick: 9876,
            comparison: function ( ) { return false; },
            tickModifier: function ( hasChanged, statusCode, statusText, currentTick ) {
                result = {
                    hasChanged: hasChanged,
                    statusCode: statusCode,
                    statusText: statusText,
                    currentTick: currentTick
                };

                return currentTick;
            },
            cacheControl: false
        });
        waitsFor(function() {
            return $.ajax.callCount > 0;
        });
        runs(function() {
            expect(result.hasChanged).toEqual(false);
            expect(result.statusCode).toEqual(200);
            expect(result.statusText).toEqual('success');
            expect(result.currentTick).toEqual(9876);
        });
    })
});