/**
 * =============================================================================
 *   FILE: BaseController.js
 *   PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 *   NAMESPACE: com.shopeasy.app.controller
 * =============================================================================
 *
 * [BEGINNER] WHAT IS A BASE CONTROLLER?
 * ─────────────────────────────────────
 * A BaseController is a SHARED PARENT controller that all other controllers
 * in your app extend. Instead of each controller extending sap.ui.core.mvc.Controller
 * directly, they extend THIS controller, which itself extends the core Controller.
 *
 * The inheritance chain looks like this:
 *
 *   sap.ui.core.mvc.Controller   (UI5 framework class)
 *           ↑
 *   BaseController               (OUR shared parent — THIS FILE)
 *           ↑
 *   ┌───────┼───────┬──────────┬──────────┬───────────┐
 *   Home    App    ProductList  ProductDetail  Cart    Checkout
 *
 * [BEGINNER] WHY IS A BASE CONTROLLER IMPORTANT?
 * ─────────────────────────────────────────────────
 * Without a BaseController, you'd repeat the same helper methods in EVERY
 * controller. For example, every controller needs to:
 *   • Access the Router for navigation
 *   • Get models from the view
 *   • Get the i18n resource bundle for translated text
 *   • Navigate back to the previous page
 *
 * Instead of writing `this.getOwnerComponent().getRouter()` in every single
 * controller, you write it ONCE in BaseController as `getRouter()`, and all
 * child controllers can just call `this.getRouter()`.
 *
 * [BEGINNER] REAL-WORLD ANALOGY
 * Think of BaseController as a "toolkit" that every controller gets for free.
 * Just like every carpenter inherits a basic set of tools (hammer, saw, tape
 * measure), every controller inherits getRouter(), getModel(), navTo(), etc.
 *
 * [INTERMEDIATE] CONTROLLER INHERITANCE IN UI5
 * ─────────────────────────────────────────────
 * UI5 uses its own class system (not ES6 classes). Inheritance works via
 * the `.extend()` method:
 *
 *   // BaseController inherits from Controller:
 *   Controller.extend("com.shopeasy.app.controller.BaseController", { ... })
 *
 *   // Home inherits from BaseController:
 *   BaseController.extend("com.shopeasy.app.controller.Home", { ... })
 *
 * When Home calls `this.getRouter()`, JavaScript looks for `getRouter` on:
 *   1. The Home instance → not found
 *   2. The Home prototype → not found
 *   3. The BaseController prototype → FOUND! Uses this one.
 *
 * This is standard prototypal inheritance, which UI5's .extend() sets up
 * behind the scenes.
 *
 * [ADVANCED] ALTERNATIVE PATTERNS
 * ─────────────────────────────────
 * Some UI5 projects use a different approach: instead of a BaseController,
 * they create a utility module (like our cart.js) with standalone functions.
 * Both approaches work, but BaseController is preferred when the shared
 * methods need access to `this` (the controller instance), because utility
 * modules can't access the controller's view, owner component, or router
 * without receiving them as parameters.
 *
 * SAP's own reference apps (like the Shopping Cart demo app) use the
 * BaseController pattern, so it's considered an SAP best practice.
 *
 * [BEST PRACTICE] Every SAP Fiori / UI5 project should have a BaseController.
 * It's one of the first files you create when starting a new project.
 *
 * [ANTI-PATTERN] Don't put business logic in BaseController. It should only
 * contain generic UTILITY methods that ANY controller might need. Business
 * logic (like "calculate shipping cost") belongs in specific controllers
 * or dedicated helper modules (like cart.js).
 */
sap.ui.define([
    /**
     * [BEGINNER] DEPENDENCIES
     *
     * We import the core Controller class to extend it, and two utility
     * modules for navigation:
     *
     * 1. sap/ui/core/mvc/Controller — The base MVC controller class.
     *    All UI5 controllers ultimately inherit from this.
     *
     * 2. sap/ui/core/routing/History — Provides access to the browser's
     *    navigation history within the UI5 routing framework. We use it
     *    in onNavBack() to check if there's a previous page to go back to.
     *
     * [INTERMEDIATE] Why sap/ui/core/routing/History instead of window.history?
     * UI5's History module tracks hash-based navigation (#/products/123),
     * which is the routing mechanism UI5 uses. window.history tracks full
     * page navigations, which may include non-UI5 pages (like the Fiori
     * Launchpad shell). Using UI5's History ensures we only navigate back
     * within our app's context.
     */
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
    "use strict";

    /**
     * [BEGINNER] CREATING THE BASE CONTROLLER CLASS
     * ═══════════════════════════════════════════════
     *
     * Controller.extend("com.shopeasy.app.controller.BaseController", { ... })
     *
     * This creates a new class named "com.shopeasy.app.controller.BaseController"
     * that extends the core Controller class. The fully qualified name follows
     * the pattern: <namespace>.controller.<ControllerName>
     *
     * [GOTCHA] The class name string MUST match the file path:
     *   "com.shopeasy.app.controller.BaseController"
     *    ↓ resolves to ↓
     *   webapp/controller/BaseController.js
     *
     * If there's a mismatch, other controllers that try to extend BaseController
     * will fail to find it, causing a mysterious "undefined is not a function"
     * error.
     *
     * [INTERMEDIATE] Unlike other controllers, BaseController does NOT have a
     * corresponding view file (no BaseController.view.xml). It's purely a
     * JavaScript class for inheritance — it's never instantiated directly by
     * a view. Only controllers that have matching views (Home, ProductList, etc.)
     * are instantiated by UI5 when those views are loaded.
     */
    return Controller.extend("com.shopeasy.app.controller.BaseController", {

        /**
         * ================================================================
         * getRouter()
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Returns the Router instance for the application. The Router
         * controls navigation between pages (views) based on URL hash
         * changes. You need the Router to:
         *   • Navigate to a different page: router.navTo("home")
         *   • Listen for route changes: router.getRoute("x").attachPatternMatched(fn)
         *   • Get the current route: router.getHashChanger().getHash()
         *
         * [BEGINNER] THE CHAIN EXPLAINED:
         *   this.getOwnerComponent().getRouter()
         *
         * Let's break this down:
         *
         *   this
         *     → The current controller instance (e.g., HomeController)
         *
         *   .getOwnerComponent()
         *     → Gets the Component.js instance that "owns" this controller.
         *       Every controller belongs to a component. The component is
         *       the central hub of the app (see Component.js).
         *
         *       [GOTCHA] getOwnerComponent() returns null if:
         *         - The controller isn't attached to a view yet (too early)
         *         - The view isn't part of a component (standalone view)
         *       This is rare but can happen in unit tests.
         *
         *   .getRouter()
         *     → Gets the Router that was created from the routing config
         *       in manifest.json. The Router was initialized in
         *       Component.js's init() method.
         *
         * [INTERMEDIATE] WHY NOT JUST USE sap.ui.core.UIComponent.getRouterFor(this)?
         * That's a static utility method that does the same thing internally.
         * Using getOwnerComponent().getRouter() is more explicit and doesn't
         * require importing UIComponent in every controller. Both approaches
         * are valid; we prefer the instance method for clarity.
         *
         * [BEST PRACTICE] Always access the router through this helper method
         * rather than caching it. The router instance doesn't change, but the
         * helper method makes your code self-documenting and easier to mock
         * in unit tests.
         *
         * @public
         * @returns {sap.m.routing.Router} The application's router instance
         */
        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        /**
         * ================================================================
         * getModel(sName)
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Returns a model from the view. Models are data containers that
         * views bind to for displaying data. Each model has a name (or
         * no name for the "default" model).
         *
         * [BEGINNER] EXAMPLES:
         *   this.getModel()         → Returns the DEFAULT (unnamed) model
         *                             This is the OData model for Products/Categories
         *
         *   this.getModel("cart")   → Returns the "cart" JSONModel
         *                             Contains shopping cart items
         *
         *   this.getModel("i18n")   → Returns the "i18n" ResourceModel
         *                             Contains translated text strings
         *
         *   this.getModel("device") → Returns the "device" JSONModel
         *                             Contains device information
         *
         * [BEGINNER] THE CHAIN:
         *   this.getView().getModel(sName)
         *
         *   this.getView()
         *     → Gets the XML view associated with this controller.
         *       Every controller has exactly ONE view (its "partner").
         *       Home.controller.js ↔ Home.view.xml
         *
         *   .getModel(sName)
         *     → Gets the model by name from the view. If the view doesn't
         *       have a model with that name directly, it looks UP the
         *       control tree (propagation): View → Component → Core.
         *
         * [INTERMEDIATE] MODEL PROPAGATION (How Models Flow Down)
         * ───────────────────────────────────────────────────────
         * When you set a model on the Component (in Component.js), it
         * automatically becomes available on all views and controls
         * within that component. This is called "propagation".
         *
         * The lookup order when calling getModel("cart") on a view:
         *   1. Does this VIEW have a model named "cart"? → No
         *   2. Does the view's PARENT control have it? → No
         *   3. Does the COMPONENT have it? → YES! (set in Component.js)
         *
         * This is similar to React's Context API — models set at a
         * higher level are accessible at all lower levels.
         *
         * [GOTCHA] If you set a model with the SAME name on the view
         * AND the component, the view-level model takes priority
         * (it shadows the component-level one). This is useful for
         * view-specific data but can cause confusion if unintentional.
         *
         * @public
         * @param {string} [sName] - The model name. Omit for the default model.
         * @returns {sap.ui.model.Model} The model instance, or undefined if not found
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * ================================================================
         * setModel(oModel, sName)
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Sets a model on the view. This makes the model available for
         * data binding within this view and its child controls.
         *
         * [BEGINNER] WHEN TO USE THIS:
         * Use setModel on the VIEW when you have data that's specific
         * to ONE view and shouldn't be shared with other views.
         *
         * Example: A "viewState" model for tracking UI state:
         *   this.setModel(new JSONModel({ isEditing: false }), "viewState");
         *
         * [INTERMEDIATE] VIEW-LEVEL vs COMPONENT-LEVEL MODELS
         * ────────────────────────────────────────────────────
         *   View-level:      this.setModel(model, "name")
         *     → Only available in THIS view
         *     → Good for: form data, UI state, local filters
         *
         *   Component-level: this.getOwnerComponent().setModel(model, "name")
         *     → Available in ALL views
         *     → Good for: cart, user session, app settings
         *
         * [BEST PRACTICE] Use view-level models for data that doesn't
         * need to survive navigation. When the user navigates away and
         * back, the view might be recreated (depending on routing config),
         * resetting view-level models. Component-level models persist
         * for the entire app lifecycle.
         *
         * @public
         * @param {sap.ui.model.Model} oModel - The model instance to set
         * @param {string} [sName] - The model name. Omit for the default model.
         * @returns {sap.ui.core.mvc.Controller} This controller (for chaining)
         */
        setModel: function (oModel, sName) {
            this.getView().setModel(oModel, sName);
            return this;
        },

        /**
         * ================================================================
         * getResourceBundle()
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Returns the i18n (internationalization) resource bundle, which
         * is a lookup table of translated text strings. You use it in
         * controller code to get translated messages.
         *
         * [BEGINNER] WHAT IS A RESOURCE BUNDLE?
         * A resource bundle reads from .properties files (like i18n.properties)
         * that contain key=value pairs of text:
         *
         *   // i18n.properties (English — default)
         *   addedToCart="{0}" has been added to your cart
         *   cartEmpty=Your cart is empty
         *
         *   // i18n_de.properties (German)
         *   addedToCart="{0}" wurde Ihrem Warenkorb hinzugefügt
         *   cartEmpty=Ihr Warenkorb ist leer
         *
         * [BEGINNER] HOW TO USE IT:
         *   var oBundle = this.getResourceBundle();
         *
         *   // Simple text (no placeholders):
         *   var sText = oBundle.getText("cartEmpty");
         *   // → "Your cart is empty"
         *
         *   // Text with placeholders ({0}, {1}, etc.):
         *   var sText = oBundle.getText("addedToCart", ["Wireless Mouse"]);
         *   // → "Wireless Mouse has been added to your cart"
         *
         * [INTERMEDIATE] The resource bundle is READ-ONLY. You can't add
         * or change translations at runtime. All translations must be in
         * the .properties files at build time.
         *
         * [GOTCHA] getText() with placeholders expects an ARRAY as the
         * second argument, even for a single placeholder:
         *   CORRECT: oBundle.getText("key", ["value"])
         *   WRONG:   oBundle.getText("key", "value")
         *
         * [BEST PRACTICE] Always use i18n for ANY user-visible text in
         * controller code. Even if you don't plan to translate your app,
         * it's much easier to manage text strings in one .properties file
         * than scattered across dozens of controllers.
         *
         * @public
         * @returns {sap.base.i18n.ResourceBundle} The i18n resource bundle
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * ================================================================
         * navTo(sRouteName, oParameters, bReplace)
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Navigates to a different page (route) in the application. This
         * is the primary way to move between views in a UI5 app.
         *
         * [BEGINNER] EXAMPLES:
         *   // Navigate to the home page:
         *   this.navTo("home");
         *
         *   // Navigate to a product list for a specific category:
         *   this.navTo("productList", { categoryId: "electronics" });
         *   // → URL becomes: #/products/electronics
         *
         *   // Navigate to product detail:
         *   this.navTo("productDetail", { productId: "P001" });
         *   // → URL becomes: #/product/P001
         *
         *   // Navigate and REPLACE the current history entry:
         *   this.navTo("home", {}, true);
         *   // → The user can't press Back to return to the current page
         *
         * [BEGINNER] PARAMETERS EXPLAINED:
         *   sRouteName: The name of the route (from manifest.json routing config)
         *     Must match one of: "home", "productList", "productDetail", "cart", "checkout"
         *
         *   oParameters: An object with values for route pattern placeholders
         *     Route pattern "products/{categoryId}" + params { categoryId: "electronics" }
         *     → URL: #/products/electronics
         *
         *   bReplace: If true, REPLACES the current URL in browser history
         *     instead of adding a new entry. This means the Back button
         *     won't return to the current page.
         *
         * [INTERMEDIATE] WHEN TO USE bReplace = true:
         *   • After a form submission (prevent re-submission on Back)
         *   • When redirecting from a "not found" page
         *   • When the current page is a transient state (loading screen)
         *   • After login/logout (prevent going back to login page)
         *
         * [ADVANCED] Under the hood, navTo() changes the URL hash, which
         * triggers the Router's route matching. The Router finds the matching
         * route, loads the target view, and renders it — all without a full
         * page reload. This is the Single Page Application (SPA) pattern.
         *
         * @public
         * @param {string} sRouteName - Name of the route to navigate to
         * @param {object} [oParameters] - Route parameters as key-value pairs
         * @param {boolean} [bReplace=false] - Replace current history entry
         */
        navTo: function (sRouteName, oParameters, bReplace) {
            this.getRouter().navTo(sRouteName, oParameters, bReplace);
        },

        /**
         * ================================================================
         * onNavBack()
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Navigates the user back to the previous page. If there IS no
         * previous page (e.g., the user opened the app via a direct URL
         * or bookmark), it falls back to the home page.
         *
         * [BEGINNER] WHY NOT JUST USE window.history.back()?
         * Because the user might have arrived at your app from an
         * external website or by directly typing the URL. In that case,
         * window.history.back() would leave your app entirely and go
         * to the previous website — not what you want!
         *
         * Our approach:
         *   1. Check if there's a previous page IN OUR APP
         *   2. If yes → go back (like pressing the browser Back button)
         *   3. If no  → go to the home page (safe fallback)
         *
         * [BEGINNER] THE FLOW:
         *
         *   User opens app directly at #/product/P001
         *     → History has NO previous hash
         *     → We navigate to Home page (fallback)
         *
         *   User navigates Home → ProductList → ProductDetail
         *     → History HAS previous hash (#/products/electronics)
         *     → We use window.history.go(-1) to go back to ProductList
         *
         * [INTERMEDIATE] History.getInstance() vs window.history:
         *   • History.getInstance() — UI5's history tracker. It knows about
         *     hash-based navigation (#/...) within your UI5 app.
         *   • window.history — The browser's native history. It includes
         *     ALL pages, not just your app.
         *
         *   We check UI5's History to see if there's a "previous hash"
         *   (a previous route within our app). If yes, we use
         *   window.history.go(-1) to actually perform the navigation.
         *   If no, we navigate to home.
         *
         * [GOTCHA] window.history.go(-1) is asynchronous — the page doesn't
         * change instantly. Don't execute code after it that depends on
         * the new page being loaded.
         *
         * [BEST PRACTICE] Always provide a fallback route in onNavBack().
         * Never leave the user stranded on a page with no way to navigate.
         * The home page is the safest fallback for most apps.
         *
         * @public
         */
        onNavBack: function () {
            // Get UI5's history instance to check for previous hash-based navigation
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                // There IS a previous page within our app.
                // Use the browser's native back navigation to return to it.
                // This preserves scroll position and form state of the
                // previous page (unlike navTo which creates a fresh navigation).
                window.history.go(-1);
            } else {
                // There is NO previous page (user came here directly).
                // Navigate to home as a safe fallback.
                // bReplace = true ensures this navigation REPLACES the current
                // history entry, so pressing Back again won't return here
                // (which would create an infinite loop: page → home → page → home...).
                this.navTo("home", {}, true);
            }
        },

        /**
         * ================================================================
         * getContentDensityClass()
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Returns the CSS class name for the appropriate content density
         * based on the user's device. Content density controls the spacing
         * and sizing of all UI5 controls:
         *
         *   • "sapUiSizeCompact" — Tight spacing for desktop (mouse/keyboard)
         *   • "sapUiSizeCozy"    — Spacious layout for touch devices
         *
         * [BEGINNER] HOW IT'S USED:
         * Typically called in a controller's onInit() to apply density
         * to the view:
         *
         *   onInit: function () {
         *     this.getView().addStyleClass(this.getContentDensityClass());
         *   }
         *
         * [INTERMEDIATE] WHY IS THIS ON THE COMPONENT, NOT THE CONTROLLER?
         * ─────────────────────────────────────────────────────────────────
         * The content density is determined ONCE (in Component.js based on
         * the device) and stored on the component. This method delegates
         * to the component's getContentDensityClass() method.
         *
         * This avoids each controller independently checking the device
         * type and potentially getting different results (though unlikely).
         * Single source of truth = fewer bugs.
         *
         * [ADVANCED] In Fiori Launchpad, the density class is set by the
         * launchpad shell, and individual apps should NOT set their own.
         * To handle both standalone and launchpad scenarios, production
         * apps check if a density class is already set on the body element
         * before applying one. Our simplified approach always applies one.
         *
         * @public
         * @returns {string} "sapUiSizeCompact" or "sapUiSizeCozy"
         */
        getContentDensityClass: function () {
            return this.getOwnerComponent().getContentDensityClass();
        }
    });

    /**
     * [ADVANCED] SUMMARY: THE COMPLETE BaseController API
     * ════════════════════════════════════════════════════
     *
     * Method                    | Returns                | Use When
     * ─────────────────────────|───────────────────────|──────────────────────
     * getRouter()              | Router instance        | Navigating or listening to routes
     * getModel(name)           | Model instance         | Reading data from any model
     * setModel(model, name)    | this (for chaining)    | Setting view-specific models
     * getResourceBundle()      | ResourceBundle         | Getting translated text in JS code
     * navTo(route, params)     | void                   | Navigating to a specific route
     * onNavBack()              | void                   | Handling back navigation
     * getContentDensityClass() | CSS class string       | Applying content density to views
     *
     * Every controller in the app has access to ALL of these methods via
     * inheritance. This eliminates boilerplate and ensures consistency
     * across the entire application.
     */
});
