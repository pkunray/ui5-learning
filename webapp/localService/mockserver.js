/**
 * ========================================================================
 * Mock Server Module
 * ========================================================================
 *
 * WHAT IS A MOCK SERVER?
 * ----------------------
 * A Mock Server simulates a real backend OData service entirely in the
 * browser. It intercepts XMLHttpRequests (XHR) that your app makes and
 * responds with local JSON data — no actual server needed.
 *
 * Think of it like a "fake API" that runs in your browser tab. When your
 * app calls GET /sap/opu/odata/sap/SHOP_SRV/Products, the MockServer
 * catches that request before it ever leaves the browser and returns
 * the contents of Products.json instead.
 *
 * WHY IS IT CRUCIAL FOR FRONTEND DEVELOPMENT?
 * --------------------------------------------
 * 1. INDEPENDENCE: Frontend developers can work without waiting for the
 *    backend team to finish their APIs. You define the data contract
 *    (metadata.xml) and start building the UI immediately.
 *
 * 2. SPEED: No network latency — responses are instant. This makes
 *    development and debugging much faster.
 *
 * 3. OFFLINE WORK: You can develop your app on a plane, a train, or
 *    anywhere without network access.
 *
 * 4. CONSISTENT DATA: Tests always run against the same data set,
 *    eliminating flaky tests caused by changing backend data.
 *
 * 5. EDGE CASES: Easily test empty states, error scenarios, and boundary
 *    conditions by modifying the mock data files.
 *
 * HOW IT WORKS UNDER THE HOOD
 * ----------------------------
 * 1. MockServer reads metadata.xml to understand the OData schema
 *    (entity types, associations, entity sets).
 *
 * 2. It loads JSON files from the mockdata folder. File names must
 *    match the EntitySet names (e.g., Products.json, Categories.json).
 *
 * 3. It monkey-patches (overrides) the browser's XMLHttpRequest so
 *    that any request whose URL starts with the rootUri is intercepted.
 *
 * 4. When an intercepted request comes in, MockServer parses the OData
 *    URL (e.g., /Products?$filter=Price gt 50&$top=10) and applies
 *    the query options ($filter, $orderby, $top, $skip, $expand, etc.)
 *    against the in-memory JSON data.
 *
 * 5. It returns a proper OData-formatted response with correct HTTP
 *    status codes, headers, and payload structure.
 *
 * WHEN TO USE vs. NOT USE
 * -----------------------
 * USE MockServer when:
 *   - Developing locally without backend access
 *   - Running automated tests (QUnit, OPA5)
 *   - Prototyping new features before the backend exists
 *   - Demos and presentations
 *
 * DON'T USE MockServer when:
 *   - Testing integration with the real backend
 *   - Performance testing (mock has no real network latency)
 *   - Testing backend business logic (mock doesn't validate data)
 *
 * MODULE PATTERN
 * --------------
 * This module exports two functions:
 *   - init():    Creates and starts the MockServer
 *   - destroy(): Stops the MockServer and cleans up
 *
 * Typically called from a test HTML page or a local "mock" entry point.
 * In production builds, this module is excluded entirely.
 * ========================================================================
 */
sap.ui.define([
    "sap/ui/core/util/MockServer",
    "sap/base/Log"
], function (MockServer, Log) {
    "use strict";

    // Module-scoped variable to hold the MockServer instance.
    // Keeping it here lets destroy() access the same instance that init() created.
    var oMockServer;

    return {

        /**
         * Initializes the Mock Server.
         *
         * This function:
         *   1. Creates a MockServer instance pointed at our OData service URL
         *   2. Tells it where to find the metadata.xml and mock data files
         *   3. Starts intercepting HTTP requests
         *
         * @public
         */
        init: function () {
            // The rootUri MUST match the uri in manifest.json > dataSources.
            var sRootUri = "/sap/opu/odata/sap/SHOP_SRV/";

            oMockServer = new MockServer({
                rootUri: sRootUri
            });

            MockServer.config({
                autoRespond: true,
                autoRespondAfter: 100
            });

            // simulate() loads metadata.xml (the OData schema) and then
            // auto-loads JSON files from the mockdata folder whose names
            // match EntitySet names (Products.json, Categories.json).
            // We use absolute paths from the web root — ui5 serve maps
            // the webapp/ folder to "/".
            oMockServer.simulate("/localService/metadata.xml", {
                sMockdataBaseUrl: "/localService/mockdata",
                bGenerateMissingMockData: false
            });

            oMockServer.start();
            Log.info("ShopEasy MockServer: Running at " + sRootUri);
        },

        /**
         * Stops and destroys the Mock Server.
         *
         * This restores the original XMLHttpRequest behavior so that
         * requests go to the real network again. Always call this when
         * tearing down tests to avoid leaking interceptors.
         *
         * @public
         */
        destroy: function () {
            if (oMockServer) {
                oMockServer.stop();
                oMockServer.destroy();
                oMockServer = null;
                Log.info("ShopEasy MockServer: Stopped and destroyed");
            }
        }
    };
});
