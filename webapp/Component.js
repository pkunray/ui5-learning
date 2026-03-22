/**
 * =============================================================================
 *   FILE: Component.js
 *   PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 *   NAMESPACE: com.shopeasy.app
 * =============================================================================
 *
 * [BEGINNER] WHAT IS Component.js?
 * ─────────────────────────────────
 * Component.js is the ROOT COMPONENT of your UI5 application. It's the very
 * first JavaScript file that runs when your app starts. Think of it as the
 * "main()" function in C/Java, or the App.js in a React application.
 *
 * Its responsibilities:
 *   1. Initialize the app (set up models, router, etc.)
 *   2. Define metadata (point to manifest.json)
 *   3. Manage the app lifecycle (startup, shutdown)
 *   4. Serve as the central hub that all views/controllers can access
 *
 * [INTERMEDIATE] COMPONENT vs. APPLICATION
 * In UI5, an "application" is actually a "component" rendered inside a
 * "ComponentContainer". This architecture allows:
 *   - Multiple components to run on the same page (Fiori Launchpad)
 *   - Components to be embedded inside other components
 *   - Clean encapsulation — each component has its own models, routing, etc.
 *
 * [ADVANCED] REACT COMPARISON
 * If you know React, here's how the concepts map:
 *
 *   React                     UI5
 *   ─────                     ───
 *   App.js                 →  Component.js
 *   ReactDOM.render()      →  ComponentContainer.placeAt()
 *   React.createContext()  →  Component models (setModel)
 *   React Router           →  UI5 Router (sap.m.routing.Router)
 *   package.json           →  manifest.json
 *   useEffect(fn, [])      →  init() method
 *   componentWillUnmount   →  exit() method
 *   index.js               →  index.html + bootstrap script
 */

/**
 * [BEGINNER] sap.ui.define() — THE AMD MODULE SYSTEM
 * ════════════════════════════════════════════════════
 *
 * sap.ui.define() is HOW YOU CREATE MODULES in UI5. It follows the AMD
 * (Asynchronous Module Definition) pattern. If you've used RequireJS,
 * this will look familiar.
 *
 * The function takes THREE arguments:
 *
 *   1. MODULE NAME (optional, usually omitted):
 *      The name of this module. UI5 infers it from the file path,
 *      so you almost never need to specify it.
 *
 *   2. DEPENDENCY ARRAY (required):
 *      A list of module paths that this module needs. UI5 loads ALL of
 *      them BEFORE calling your factory function.
 *
 *      Think of it like import statements in ES6:
 *        import UIComponent from 'sap/ui/core/UIComponent';
 *        import JSONModel from 'sap/ui/model/json/JSONModel';
 *
 *      But in AMD style:
 *        ["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"]
 *
 *   3. FACTORY FUNCTION (required):
 *      A function that receives the loaded dependencies as parameters
 *      (in the SAME ORDER as the dependency array) and RETURNS whatever
 *      this module exports.
 *
 * [INTERMEDIATE] WHY AMD AND NOT ES6 MODULES?
 * UI5 was created before ES6 modules existed (2013). It uses AMD for
 * backward compatibility and because its module loader provides additional
 * features (version management, lazy loading, preloading). SAP is gradually
 * adding ES6 module support, but AMD remains the standard for now.
 *
 * [GOTCHA] PARAMETER ORDER MUST MATCH DEPENDENCY ORDER!
 * If your dependency array is ["A", "B", "C"], your factory parameters
 * MUST be (A, B, C) — in that exact order. Swapping them is a common
 * and hard-to-debug mistake.
 *
 * [BEST PRACTICE] Use forward slashes (/) in dependency paths, not dots.
 *   CORRECT: "sap/ui/core/UIComponent"
 *   WRONG:   "sap.ui.core.UIComponent"
 * The dot notation is legacy and doesn't work with async loading.
 *
 * [ANTI-PATTERN] Don't use jQuery.sap.require() — it's synchronous,
 * deprecated, and will be removed in future UI5 versions.
 */
sap.ui.define([
    "sap/ui/core/UIComponent",     // The base class for UI5 components
    "sap/ui/model/json/JSONModel", // For creating local JSON data models
    "sap/ui/Device",               // Utility for detecting device info (phone, tablet, desktop)
    "sap/ui/thirdparty/jquery"     // jQuery module for explicit AJAX usage
], function (UIComponent, JSONModel, Device, jQuery) {
    "use strict";
    /**
     * [BEGINNER] "use strict"
     * ───────────────────────
     * This enables JavaScript strict mode, which:
     *   - Catches common coding mistakes (undeclared variables, etc.)
     *   - Prevents use of some problematic features
     *   - Makes code more optimizable by the JS engine
     *
     * [BEST PRACTICE] ALWAYS include "use strict" at the top of every
     * factory function. It's your first line of defense against bugs.
     */

    /**
     * [BEGINNER] UIComponent.extend() — CREATING YOUR COMPONENT CLASS
     * ════════════════════════════════════════════════════════════════
     *
     * UIComponent.extend("com.shopeasy.app.Component", { ... })
     *
     * This creates a NEW CLASS that EXTENDS (inherits from) UIComponent.
     * It's similar to:
     *   class Component extends UIComponent { ... }  // ES6 syntax
     *
     * The first argument "com.shopeasy.app.Component" is the FULLY QUALIFIED
     * CLASS NAME. It MUST match:
     *   - Your namespace + ".Component"
     *   - The file must be at: <namespace-root>/Component.js
     *
     * The second argument is an object containing your class definition:
     *   - metadata: Configuration/metadata for the class
     *   - init: Constructor-like initialization method
     *   - exit: Destructor-like cleanup method
     *   - Any other custom methods you need
     *
     * [INTERMEDIATE] UI5 CLASS SYSTEM
     * UI5 has its own class system (predating ES6 classes) that provides:
     *   - Classical inheritance (extend)
     *   - Metadata (properties, aggregations, events)
     *   - Automatic getters/setters
     *   - Lifecycle management
     *
     * You CANNOT use ES6 "class" syntax for UI5 classes that extend
     * UI5 base classes. The .extend() pattern is required because UI5's
     * metadata system depends on it.
     *
     * [GOTCHA] The return value of UIComponent.extend() is the class itself
     * (not an instance). We return it from the factory function so other
     * modules can import and use it. The UI5 runtime instantiates it
     * automatically when the component is loaded via ComponentContainer.
     */
    return UIComponent.extend("com.shopeasy.app.Component", {

        /**
         * [BEGINNER] METADATA — Describing Your Component
         * ════════════════════════════════════════════════
         *
         * The metadata object tells UI5 about your component's configuration.
         * The most important property here is "manifest".
         *
         * manifest: "json"
         * ─────────────────
         * This single line is INCREDIBLY important. It tells UI5:
         *   "Read my manifest.json file and use it for ALL configuration."
         *
         * When you set manifest: "json", UI5 automatically:
         *   1. Loads manifest.json from the same folder as Component.js
         *   2. Creates all models defined in sap.ui5.models
         *   3. Sets up routing as defined in sap.ui5.routing
         *   4. Loads the rootView defined in sap.ui5.rootView
         *   5. Loads CSS from sap.ui5.resources
         *   6. Preloads library dependencies from sap.ui5.dependencies
         *
         * Without this, you'd have to do ALL of that manually in init().
         *
         * [INTERMEDIATE] BEFORE manifest.json (Legacy Approach)
         * In older UI5 apps, you might see metadata defined inline:
         *
         *   metadata: {
         *     rootView: { viewName: "...", type: "XML" },
         *     routing: { ... },
         *     config: { ... }
         *   }
         *
         * This still works but is DEPRECATED. Always use manifest: "json".
         *
         * [ADVANCED] You can also use manifest: "json" alongside inline
         * metadata properties. Inline properties override manifest.json values.
         * But this is confusing and NOT recommended — keep everything in
         * manifest.json for a single source of truth.
         */
        metadata: {
            manifest: "json"
        },

        /**
         * [BEGINNER] init() — THE COMPONENT LIFECYCLE: INITIALIZATION
         * ════════════════════════════════════════════════════════════
         *
         * init() is called ONCE when the component is first created.
         * Think of it as the constructor or the React componentDidMount /
         * useEffect(fn, []) equivalent.
         *
         * This is where you set up everything your app needs to start:
         *   - Call the parent's init (REQUIRED — do this FIRST)
         *   - Initialize the router
         *   - Create and set up additional models
         *   - Set up event handlers
         *   - Any other one-time setup
         *
         * [INTERMEDIATE] UI5 COMPONENT LIFECYCLE METHODS
         * A UIComponent goes through these lifecycle stages:
         *
         *   1. constructor()  — Creates the object (rarely overridden)
         *   2. init()         — Initializes the component (THIS method)
         *                       Called AFTER the constructor
         *                       Models from manifest.json are already created
         *   3. createContent() — Creates the root view (auto from manifest)
         *   4. onBeforeRendering() — Before the view renders (if applicable)
         *   5. onAfterRendering()  — After the view renders (if applicable)
         *   6. exit()         — Cleanup when component is destroyed
         *
         * [GOTCHA] init() is NOT the constructor. The constructor runs first,
         * then init(). You should almost never override the constructor in UI5.
         * Always use init() for your setup code.
         *
         * [GOTCHA] Unlike React's useEffect, init() runs BEFORE the first
         * render. The view hasn't been created yet when init() executes.
         * If you need to access DOM elements, use onAfterRendering().
         *
         * [BEST PRACTICE] ALWAYS call the parent's init() as the FIRST line
         * in your init(). Forgetting this is a common mistake that causes
         * mysterious failures — the parent sets up critical infrastructure
         * (model creation from manifest, event bus, etc.) that your code
         * depends on.
         *
         * [ANTI-PATTERN] Don't do heavy operations in init() that block the
         * UI thread. If you need to fetch large amounts of data, use
         * asynchronous calls and show a busy indicator.
         */
        init: function () {
            /**
             * [BEGINNER] CALLING THE PARENT'S init()
             *
             * UIComponent.prototype.init.apply(this, arguments);
             *
             * This calls the init() method of the PARENT class (UIComponent).
             * It's equivalent to super.init() in ES6 class syntax, or
             * super().__init__() in Python.
             *
             * Breaking it down:
             *   UIComponent.prototype  → Access the parent class's methods
             *   .init                  → Specifically the init method
             *   .apply(this, arguments) → Call it with:
             *     - 'this': The current component instance (context)
             *     - 'arguments': Any arguments passed to our init
             *
             * [INTERMEDIATE] WHY .apply() AND NOT JUST .call()?
             * .apply(this, arguments) passes ALL arguments as an array.
             * .call(this, arg1, arg2) requires listing arguments individually.
             * Using .apply(this, arguments) is safer because it forwards
             * ALL arguments, even if the parent adds new ones in future versions.
             *
             * [GOTCHA] If you forget this line, the following will break:
             *   - Models defined in manifest.json won't be created
             *   - Routing won't be initialized
             *   - The root view won't be loaded
             *   - The component will appear to "do nothing"
             */
            UIComponent.prototype.init.apply(this, arguments);

            /**
             * [BEGINNER] INITIALIZING THE ROUTER
             *
             * The Router handles navigation between pages (views) in your app.
             * We need to initialize it so it starts listening for URL changes.
             *
             * this.getRouter() — Gets the Router instance that was automatically
             *   created by UI5 based on the routing configuration in manifest.json.
             *
             * .initialize() — Tells the router to start working:
             *   1. Read the current URL hash
             *   2. Match it against the defined routes
             *   3. Load and display the matching target view
             *
             * [GOTCHA] If you forget to call initialize(), the router exists
             * but does nothing. Your app will show the root view (App.view.xml)
             * with an empty pages aggregation — a blank screen!
             *
             * [INTERMEDIATE] The router fires events you can listen to:
             *   - routeMatched: Fired when ANY route is matched
             *   - bypassed: Fired when NO route matches the URL
             *
             * Controllers listen for their specific route using:
             *   this.getRouter().getRoute("routeName").attachPatternMatched(fn);
             */
            this.getRouter().initialize();

            /**
             * [BEGINNER] LOADING SHOP DATA INTO A JSONModel
             * ══════════════════════════════════════════════
             *
             * Instead of connecting to a real OData backend, we load our
             * mock data (Products.json and Categories.json) directly into
             * a JSONModel. This is how you develop a UI5 frontend before
             * the backend is ready.
             *
             * The JSONModel replaces the OData model defined in manifest.json
             * as the default (unnamed) model. Views binding to paths like
             * {/Products} and {/Categories} will read from this model.
             *
             * loadData() fetches a JSON file via AJAX and merges it into
             * the model. We call it twice to load both data sets.
             */
            var oDataModel = new JSONModel({ Products: [], Categories: [] });
            this.setModel(oDataModel);

            // Load products and categories in parallel using jQuery.ajax.
            // setProperty() updates just one path without overwriting
            // the rest of the model, and automatically refreshes any
            // UI controls bound to that path.
            jQuery.ajax({
                url: "localService/mockdata/Products.json",
                dataType: "json",
                success: function (aData) {
                    oDataModel.setProperty("/Products", aData);
                }
            });
            jQuery.ajax({
                url: "localService/mockdata/Categories.json",
                dataType: "json",
                success: function (aData) {
                    oDataModel.setProperty("/Categories", aData);
                }
            });

            /**
             * [BEGINNER] CREATING THE CART MODEL
             * ══════════════════════════════════
             *
             * While the "cart" model is defined in manifest.json (and UI5 creates
             * it automatically from the manifest), we can also create/override
             * models here in init(). This example shows the programmatic approach,
             * which is useful when you need dynamic initial data or complex setup.
             *
             * Note: Since we defined the cart model in manifest.json with initial
             * data, UI5 has already created it. This code REPLACES it with a fresh
             * instance to demonstrate the programmatic approach.
             *
             * new JSONModel({...}) creates a new client-side data model with the
             * given initial data. This is similar to:
             *   const [cart, setCart] = useState({ items: [], totalPrice: 0 })
             * in React.
             *
             * The data structure:
             *   - items: []       → Array to hold cart items (products user adds)
             *   - totalPrice: 0   → Calculated total of all items
             *   - itemCount: 0    → Number of unique items in the cart
             *   - currency: "USD" → Display currency
             *
             * [INTERMEDIATE] JSONModel INTERNALS
             * JSONModel stores data as a plain JavaScript object internally.
             * When you call setProperty("/items", newArray), it:
             *   1. Updates the internal object
             *   2. Notifies all bound controls that the data changed
             *   3. Controls re-render with the new data
             *
             * This is UI5's version of "reactive state management" — similar
             * to Redux or MobX in the React world.
             */
            var oCartModel = new JSONModel({
                items: [],
                totalPrice: 0,
                itemCount: 0,
                currency: "USD"
            });

            /**
             * [BEGINNER] SETTING A MODEL ON THE COMPONENT
             *
             * this.setModel(oCartModel, "cart");
             *
             * This makes the cart model AVAILABLE to the ENTIRE application.
             * Any view or controller can access it.
             *
             * Parameters:
             *   - oCartModel: The model instance to set
             *   - "cart": The model name (used in data binding: {cart>/items})
             *
             * [INTERMEDIATE] MODEL PROPAGATION
             * When you set a model on the Component, it automatically "propagates"
             * (flows down) to ALL views and controls within the component, similar
             * to React's Context API. You don't need to pass it manually.
             *
             * You can set a model at different levels:
             *   this.setModel(model, "name");                    → Available everywhere (component level)
             *   this.getView().setModel(model, "name");          → Available in one view only
             *   oControl.setModel(model, "name");                → Available to one control and its children
             *
             * [BEST PRACTICE] Set app-wide models (like cart, user settings)
             * on the COMPONENT level so they're accessible everywhere.
             * Set view-specific models on the VIEW level to limit their scope.
             */
            this.setModel(oCartModel, "cart");

            /**
             * [BEGINNER] CREATING THE DEVICE MODEL
             * ════════════════════════════════════
             *
             * The Device model provides information about the user's device:
             *   - Is it a phone, tablet, or desktop?
             *   - Does it support touch?
             *   - What's the screen size?
             *   - What operating system/browser is it running?
             *
             * We create a JSONModel from sap.ui.Device (imported at the top)
             * and set it as a model named "device".
             *
             * In views, you can then use it for conditional rendering:
             *   visible="{= !${device>/system/phone}}"
             *     → Hide this control on phones
             *
             *   visible="{= ${device>/system/desktop}}"
             *     → Show this control only on desktop
             *
             * [INTERMEDIATE] BindingMode.OneWay
             * We set the default binding mode to OneWay because device
             * properties are READ-ONLY — they describe the hardware/browser
             * and cannot be changed by the app. Setting it to TwoWay would
             * be meaningless (and wasteful).
             *
             * [ADVANCED] sap.ui.Device is a static object that's evaluated
             * ONCE when UI5 loads. It does NOT update if the user resizes
             * their browser window. For responsive behavior, use CSS media
             * queries or UI5's responsive controls (SplitApp, FlexBox, etc.)
             * instead of checking Device properties at runtime.
             */
            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");

            /**
             * [INTERMEDIATE] SETTING CONTENT DENSITY CLASS
             * ═════════════════════════════════════════════
             *
             * This applies the appropriate CSS density class based on the
             * device type. "Compact" mode has tighter spacing for desktop
             * (mouse usage), while "Cozy" has larger touch targets for
             * mobile devices.
             *
             * We store it on the component so views can access it via:
             *   this.getOwnerComponent().getContentDensityClass()
             */
            this._sContentDensityClass = Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact";
        },

        /**
         * [BEGINNER] getContentDensityClass() — HELPER METHOD
         * ════════════════════════════════════════════════════
         *
         * This is a custom helper method (not a lifecycle method) that
         * returns the appropriate CSS class for content density.
         *
         * Controllers can call this to apply density to their views:
         *   this.getView().addStyleClass(
         *     this.getOwnerComponent().getContentDensityClass()
         *   );
         *
         * [BEST PRACTICE] Define utility methods like this on the Component
         * so they're accessible from any controller via getOwnerComponent().
         *
         * @returns {string} The CSS class name: "sapUiSizeCompact" or "sapUiSizeCozy"
         */
        getContentDensityClass: function () {
            return this._sContentDensityClass;
        },

        /**
         * [BEGINNER] exit() — THE COMPONENT LIFECYCLE: CLEANUP
         * ════════════════════════════════════════════════════
         *
         * exit() is called ONCE when the component is being DESTROYED.
         * It's the mirror of init() — where init() sets things up,
         * exit() tears them down.
         *
         * Think of it as React's componentWillUnmount or the cleanup
         * function returned from useEffect.
         *
         * Use exit() to:
         *   - Remove global event listeners
         *   - Clear timers/intervals
         *   - Close WebSocket connections
         *   - Release external resources
         *   - Clean up any global state
         *
         * [INTERMEDIATE] WHEN DOES exit() GET CALLED?
         * In a standalone app, exit() is called when:
         *   - The user navigates away from your app (in Fiori Launchpad)
         *   - The browser tab/window is closed (not guaranteed!)
         *   - The component is explicitly destroyed via .destroy()
         *
         * [GOTCHA] You do NOT need to destroy models set with setModel()
         * or controls created via XML views — UI5 handles that automatically.
         * Only clean up things YOU created manually that UI5 doesn't know about.
         *
         * [ADVANCED] In Fiori Launchpad, components are often destroyed and
         * recreated as users navigate between apps. This means init() and
         * exit() can be called MULTIPLE TIMES during a session. Make sure
         * your code handles this correctly (don't assume init() runs only once
         * across the entire browser session).
         *
         * [BEST PRACTICE] Always call the parent's exit() when overriding:
         *   UIComponent.prototype.exit.apply(this, arguments);
         */
        exit: function () {
            UIComponent.prototype.exit.apply(this, arguments);
        }
    });

    /**
     * [BEGINNER] WHAT DOES return UIComponent.extend(...) DO?
     * ═══════════════════════════════════════════════════════
     *
     * The "return" statement at the beginning of the extend() call means
     * that the factory function (the third argument to sap.ui.define())
     * returns the new Component CLASS.
     *
     * This makes the class available to other modules that depend on
     * this one. When another module writes:
     *   sap.ui.define(["com/shopeasy/app/Component"], function(Component) {
     *     // Component is the class returned above
     *     var oApp = new Component();
     *   });
     *
     * However, you typically NEVER manually instantiate a Component.
     * The ComponentContainer (from index.html) does it for you.
     */

    /**
     * [ADVANCED] THE COMPLETE COMPONENT LOADING SEQUENCE
     * ═══════════════════════════════════════════════════
     *
     * Here's the FULL sequence of what happens when your component loads:
     *
     *  1. ComponentContainer calls Component.create({ name: "com.shopeasy.app" })
     *  2. UI5 loads ./Component.js (this file)
     *  3. sap.ui.define() resolves all dependencies:
     *       a. sap/ui/core/UIComponent (already loaded — it's core)
     *       b. sap/ui/model/json/JSONModel (loaded from UI5 library)
     *       c. sap/ui/Device (loaded from UI5 library)
     *  4. Factory function executes, creating the Component class
     *  5. UI5 instantiates the Component (new Component())
     *  6. Component constructor runs (inherited from UIComponent)
     *  7. metadata.manifest = "json" triggers manifest.json loading
     *  8. manifest.json is loaded and parsed
     *  9. From manifest.json, UI5 automatically:
     *       a. Creates the OData model (default "")
     *       b. Creates the i18n ResourceModel
     *       c. Creates the cart JSONModel (from manifest data)
     *       d. Sets up the Router with routes and targets
     *       e. Loads CSS from resources.css
     * 10. init() is called (YOUR code runs here)
     *       a. Parent init is called (finalizes manifest processing)
     *       b. Router is initialized (starts matching URLs)
     *       c. Cart model is recreated (overrides manifest version)
     *       d. Device model is created and set
     * 11. createContent() is called (inherited behavior)
     *       a. Loads rootView: com.shopeasy.app.view.App (App.view.xml)
     *       b. App.view.xml is parsed and controls are created
     * 12. Router matches current URL hash to a route
     * 13. Matched route's target view is loaded and placed in App view
     * 14. The component is fully initialized and visible!
     *
     * Total time: typically 500ms - 2 seconds
     */
});
