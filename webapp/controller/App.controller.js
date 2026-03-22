/**
 * =============================================================================
 *   FILE: App.controller.js
 *   PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 *   NAMESPACE: com.shopeasy.app.controller
 * =============================================================================
 *
 * [BEGINNER] WHAT IS THE APP CONTROLLER?
 * ─────────────────────────────────────
 * The App controller is the ROOT CONTROLLER — it controls the outermost view
 * (App.view.xml) which wraps ALL other views. Think of it as the "shell" or
 * "frame" around your application's content.
 *
 * The App.view.xml typically contains an sap.m.App or sap.m.Shell control,
 * and the Router places each page's view inside it via the "pages" aggregation.
 *
 * Visual structure:
 *
 *   ┌──────────────────────────────────────┐
 *   │  App.view.xml (App Controller)       │  ← This controller manages this
 *   │  ┌──────────────────────────────────┐│
 *   │  │  [Router places views here]      ││  ← Home, ProductList, etc.
 *   │  │                                  ││
 *   │  │  Currently displayed view:       ││
 *   │  │  Home.view.xml                   ││
 *   │  │                                  ││
 *   │  └──────────────────────────────────┘│
 *   └──────────────────────────────────────┘
 *
 * [BEGINNER] WHAT DOES THE APP CONTROLLER DO?
 * ─────────────────────────────────────────────
 * Since the App view is just a wrapper, its controller has minimal logic:
 *   • Sets the content density CSS class (compact/cozy) on the root view
 *   • Optionally tracks route changes for analytics
 *   • Handles global/cross-cutting concerns
 *
 * [INTERMEDIATE] WHY DOES APP.CONTROLLER EXIST IF IT DOES SO LITTLE?
 * ──────────────────────────────────────────────────────────────────────
 * Every XML view in UI5 has a controller (it's part of the MVC pattern).
 * Even if the controller is minimal, it must exist because:
 *   1. The view references it: controllerName="com.shopeasy.app.controller.App"
 *   2. It's the right place for root-level initialization
 *   3. It sets up the density class once, at the highest level
 *
 * [ADVANCED] In larger apps, the App controller might manage:
 *   - Global message handling (MessageManager)
 *   - Session timeout detection
 *   - Global keyboard shortcuts
 *   - Side navigation panel state
 *   - Flexible Column Layout master/detail coordination
 */
sap.ui.define([
    /**
     * [BEGINNER] DEPENDENCIES
     *
     * We extend our custom BaseController (not the core Controller directly).
     * This gives us access to all the helper methods we defined:
     * getRouter(), getModel(), navTo(), onNavBack(), etc.
     *
     * [INTERMEDIATE] Notice the path format:
     *   "com/shopeasy/app/controller/BaseController"
     *
     * This uses forward slashes (/) not dots (.) and matches the file system
     * path relative to the namespace root. UI5 resolves this to:
     *   webapp/controller/BaseController.js
     */
    "com/shopeasy/app/controller/BaseController"
], function (BaseController) {
    "use strict";

    /**
     * [BEGINNER] EXTENDING BaseController
     * ════════════════════════════════════
     *
     * Instead of Controller.extend(), we use BaseController.extend().
     * This means App.controller.js inherits from BaseController, which
     * inherits from Controller:
     *
     *   Controller → BaseController → App.controller
     *
     * App.controller gets ALL methods from both:
     *   • From Controller: onInit, onExit, getView, byId, etc.
     *   • From BaseController: getRouter, getModel, navTo, onNavBack, etc.
     *   • Its own methods: (defined below)
     */
    return BaseController.extend("com.shopeasy.app.controller.App", {

        /**
         * ================================================================
         * onInit() — Initialization Lifecycle Hook
         * ================================================================
         *
         * [BEGINNER] WHAT IS onInit()?
         * onInit is a LIFECYCLE HOOK — a method that UI5 calls automatically
         * at a specific point in the controller's life. You don't call it
         * yourself; UI5 calls it for you ONCE when the view is first created.
         *
         * [BEGINNER] UI5 CONTROLLER LIFECYCLE HOOKS:
         *   1. onInit()             — Called once when the view is created
         *   2. onBeforeRendering()  — Called before EVERY re-render
         *   3. onAfterRendering()   — Called after EVERY re-render
         *   4. onExit()             — Called once when the view is destroyed
         *
         * For most controllers, you'll only use onInit(). The rendering
         * hooks are for advanced scenarios (like direct DOM manipulation).
         *
         * [INTERMEDIATE] onInit() IN THE APP CONTROLLER
         * Since the App view is the ROOT view, its onInit() runs before
         * any other controller's onInit(). This makes it the perfect place
         * for app-wide setup that must happen before content views load.
         *
         * [GOTCHA] Don't confuse the controller's onInit() with the
         * Component's init(). They are different:
         *   • Component.init() — Runs when the COMPONENT starts (before any views)
         *   • Controller.onInit() — Runs when the controller's VIEW is created
         *
         * Execution order:
         *   1. Component.init()           ← Sets up models, router
         *   2. App.controller.onInit()    ← Root view is created first
         *   3. Home.controller.onInit()   ← Router loads the initial route view
         */
        onInit: function () {
            /**
             * [BEGINNER] APPLYING CONTENT DENSITY
             * ════════════════════════════════════
             *
             * Content density controls the spacing of UI5 controls:
             *   • "sapUiSizeCompact" — Tight spacing for desktop/mouse
             *   • "sapUiSizeCozy"    — Spacious for touch devices
             *
             * By adding this CSS class to the ROOT view, ALL child controls
             * within the App view automatically inherit the density.
             *
             * this.getView()
             *   → Gets App.view.xml (the root view)
             *
             * .addStyleClass(...)
             *   → Adds a CSS class to the view's root HTML element
             *   → All controls inside inherit this class for styling
             *
             * this.getContentDensityClass()
             *   → Returns "sapUiSizeCompact" or "sapUiSizeCozy"
             *   → Inherited from BaseController → delegates to Component
             *
             * [BEST PRACTICE] Apply density at the ROOT view level so it
             * cascades to all child views. Don't apply it in each individual
             * controller — that's redundant and error-prone.
             *
             * [GOTCHA] Some controls (like Dialogs and Popovers) are rendered
             * OUTSIDE the view's DOM tree (they're appended to <body>). They
             * won't inherit the density class from the view. You need to add
             * it explicitly:
             *   oDialog.addStyleClass(this.getContentDensityClass());
             */
            this.getView().addStyleClass(this.getContentDensityClass());

            /**
             * [INTERMEDIATE] ROUTE CHANGE TRACKING (Analytics)
             * ═════════════════════════════════════════════════
             *
             * We attach a handler to the Router's "routeMatched" event,
             * which fires EVERY TIME any route is matched (on every
             * navigation). This is useful for:
             *   • Analytics tracking (page views)
             *   • Global loading indicators
             *   • Access control checks
             *   • Logging / debugging navigation flow
             *
             * getRouter().attachRouteMatched(fnHandler)
             *   → Attaches a function that's called whenever ANY route matches
             *   → The event object contains the matched route name and parameters
             *
             * [ADVANCED] "routeMatched" vs "routePatternMatched"
             * ──────────────────────────────────────────────────
             * There are two similar events:
             *
             *   routeMatched (on the Router):
             *     Fires for EVERY navigation in the app.
             *     Good for global tracking (like analytics).
             *
             *   patternMatched (on a specific Route):
             *     Fires only when THAT SPECIFIC route is matched.
             *     Good for controller-specific logic (loading data).
             *
             * Example:
             *   router.attachRouteMatched(fn)           → ALL navigations
             *   router.getRoute("home").attachPatternMatched(fn) → Only "home"
             *
             * [BEST PRACTICE] Use routeMatched for cross-cutting concerns
             * (analytics, auth). Use patternMatched in specific controllers
             * for route-specific logic (loading data for that page).
             */
            this.getRouter().attachRouteMatched(this._onRouteMatched, this);
        },

        /**
         * ================================================================
         * _onRouteMatched(oEvent) — Route Change Handler (Private)
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called every time the user navigates to any page in the app.
         * Currently used for analytics tracking (console.log), but in
         * a production app this would send data to an analytics service.
         *
         * [BEGINNER] THE EVENT OBJECT:
         * The oEvent parameter contains information about the navigation:
         *
         *   oEvent.getParameter("name")
         *     → The route name, e.g., "home", "productList", "cart"
         *
         *   oEvent.getParameter("arguments")
         *     → Route parameters, e.g., { categoryId: "electronics" }
         *
         * [INTERMEDIATE] NAMING CONVENTION: UNDERSCORE PREFIX
         * ────────────────────────────────────────────────────
         * The leading underscore in `_onRouteMatched` signals that this
         * is a PRIVATE method. It's not meant to be called from outside
         * this controller or from the XML view.
         *
         * In UI5, there's no true "private" keyword, so the underscore
         * is a convention that tells other developers: "Hands off — this
         * is an internal implementation detail."
         *
         * [BEST PRACTICE] Prefix private/internal methods with underscore.
         * Keep event handlers that ARE referenced from XML views (like
         * onPress, onSearch) WITHOUT underscore. Methods attached in
         * JavaScript code (like this one) should have the underscore.
         *
         * [ADVANCED] In production, you'd replace console.log with a
         * real analytics service call:
         *
         *   // SAP Web Analytics:
         *   swa.trackCustomEvent("pageView", { page: sRouteName });
         *
         *   // Google Analytics:
         *   gtag('event', 'page_view', { page_path: '#/' + sRouteName });
         *
         *   // Custom backend:
         *   jQuery.ajax({ url: "/analytics", data: { route: sRouteName } });
         *
         * @private
         * @param {sap.ui.base.Event} oEvent - The routeMatched event
         */
        _onRouteMatched: function (oEvent) {
            // Extract the matched route name from the event
            var sRouteName = oEvent.getParameter("name");

            // [BEGINNER] console.log is JavaScript's built-in way to
            // output debug information to the browser's Developer Tools
            // console (F12 → Console tab). It's invaluable for debugging
            // but should be removed or replaced in production code.
            //
            // [ANTI-PATTERN] Leaving console.log statements in production
            // code is unprofessional and can expose internal details.
            // Use a proper logging framework (sap/base/Log) or remove
            // them during the build process.
            //
            // [INTERMEDIATE] UI5's logging alternative:
            //   sap.base.Log.info("Navigation: " + sRouteName);
            // This integrates with UI5's diagnostics tools and can be
            // filtered by log level.
            console.log("[ShopEasy Analytics] Page navigated:", sRouteName);
        }
    });
});
