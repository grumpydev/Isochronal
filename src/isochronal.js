(function ($) {
    $.poll = function (settings) {
        settings = (typeof settings === "undefined") ? { } : settings;

        var options = $.extend({ }, $.poll.default_settings);

        $.extend(options, {
            running: false
        });

        $.extend(options, settings);

        // Can't access the response headers if we use jsonp
        // so pointless trying to read/set cache control
        // headers.
        if (options.dataType === 'jsonp') {
            options.cacheControl = false;
        }

        var getStartEndFromHeader = function (headerValue) {
            if (!headerValue) {
                return null;
            }

            var range = headerValue.split("-", 2);
            if (range.length !== 2) {
                return null;
            }

            var start = parseInt(range[0], 10);
            var end = parseInt(range[1], 10);

            if (isNaN(start) || isNaN(end) || start < 0 || end < 0 || end < start) {
                return null;
            }

            return {
                start: start,
                end: end
            };
        };

        var coerceTick = function (currentTick, headerValue) {
            var parsedHeader = getStartEndFromHeader(headerValue);

            if (!parsedHeader) {
                return currentTick;
            }

            if (currentTick < parsedHeader.start) {
                return parsedHeader.start;
            }

            if (currentTick > parsedHeader.end) {
                return parsedHeader.end;
            }

            return currentTick;
        };

        var periodical = (function () {
            var previousResponse = '';
            var hasChanged = false;
            var etag;
            var lastModified;

            var execute = function () {
                if (!options.running) {
                    return;
                }

                options.token = setTimeout(function () {
                    $.ajax($.extend({ }, options, {
                        beforeSend: function (jqXHR) {
                            if (options.cacheControl) {
                                if (etag) {
                                    jqXHR.setRequestHeader("If-None-Match", etag);
                                }

                                if (lastModified) {
                                    jqXHR.setRequestHeader("If-Modified-Since", lastModified);
                                }
                            }
                        },
                        success: function (data, textStatus, jqXHR) {
                            if (options.cacheControl) {
                                etag = jqXHR.getResponseHeader("ETag");
                                lastModified = jqXHR.getResponseHeader("LastModified");
                            }

                            if (!(hasChanged = options.comparison(previousResponse, data))) {
                                previousResponse = data;

                                if (options.success) {
                                    options.success(data, textStatus, jqXHR);
                                }

                                options.changed(data);
                            }
                        },
                        complete: function (jqXHR, textStatus) {
                            if (options.complete) {
                                options.complete(jqXHR, textStatus);
                            }

                            options.tick = options.tickModifier(hasChanged, jqXHR.status, textStatus, options.tick);

                            options.tick = coerceTick(options.tick, jqXHR.getResponseHeader("Isochronal-Timeout"));

                            execute();
                        }
                    }));
                }, options.tick);
            };

            var start = function () {
                if (!options.running) {
                    options.running = true;

                    execute();
                }

                return this;
            };

            var stop = function () {
                if (options.running) {
                    clearTimeout(options.token);

                    options.running = false;
                }

                return this;
            };

            return {
                start: start,
                stop: stop,
                settings: options
            };
        }());

        return options.autoStart ? periodical.start() : periodical;
    };

    $.poll.default_settings = {
        autoStart: true,
        cacheControl: true,
        comparison: function (x, y) { return x === y; },
        changed: function (data) { },
        tick: 2000,
        tickModifier: function (hasChanged, statusCode, statusText, currentTick) { return currentTick; }
    };
}(jQuery));

