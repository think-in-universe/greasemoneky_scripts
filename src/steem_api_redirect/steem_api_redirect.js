// ==UserScript==
// @name         Redirect Steem API
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  redirect Steem API to another API server
// @author       you
// @match        https://*.busy.org/*
// @match        https://*.steempeak.com/*
// @match        https://*.steemconnect.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

    // 修改 API Server
    var SELECTED_SERVER = "steemd.minnowsupportproject.org"; // "anyx.io"; // "api.steem.house"


    var ORIGINAL_SERVER = "api.steemit.com";
    var STEEMCONNECT_SERVER = "steemconnect.com";

    (function() {
        var interceptors = [];

        function interceptor(fetch, ...args) {
            var reversedInterceptors = interceptors.reduce((array, interceptor) => [interceptor].concat(array), []);
            var promise = Promise.resolve(args);

            // Register request interceptors
            reversedInterceptors.forEach(({ request, requestError }) => {
                if (request || requestError) {
                    promise = promise.then(args => request(...args), requestError);
                }
            });

            // Register fetch call
            promise = promise.then(args => fetch(...args));

            // Register response interceptors
            reversedInterceptors.forEach(({ response, responseError }) => {
                if (response || responseError) {
                    promise = promise.then(response, responseError);
                }
            });

            return promise;
        }

        var fetchIntercept = function attach(env) {
            fetch = (function (fetch) {
                return function (...args) {
                    return interceptor(fetch, ...args);
                };
            })(fetch);

            return {
                register: function (interceptor) {
                    interceptors.push(interceptor);
                    return () => {
                        var index = interceptors.indexOf(interceptor);
                        if (index >= 0) {
                            interceptors.splice(index, 1);
                        }
                    };
                },
                clear: function () {
                    interceptors = [];
                }
            };
        }();

        // intercept FETCH
        var unregister = fetchIntercept.register({
            request: function (url, config) {
                if (url.indexOf(ORIGINAL_SERVER) != -1) {
                    console.log('redirecting url...', url);
                    url = url.replace(ORIGINAL_SERVER, SELECTED_SERVER);
                }
                return [url, config];
            },

            requestError: function (error) {
                // Called when an error occured during another 'request' interceptor call
                return Promise.reject(error);
            },

            response: function (response) {
                // Modify the reponse object
                return response;
            },

            responseError: function (error) {
                // Handle an fetch error
                return Promise.reject(error);
            }
        });
    })();

    // intercept XHR
    (function() {
        var origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function() {
            if (arguments[1].indexOf(ORIGINAL_SERVER) != -1) {
                console.log('redirecting url...', arguments[1]);
                arguments[1] = arguments[1].replace(ORIGINAL_SERVER, SELECTED_SERVER);
            }
            origOpen.apply(this, arguments);
        };
    })();

})();
