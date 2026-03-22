/**
 * =============================================================================
 *   FILE: Home.controller.js
 *   PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 *   NAMESPACE: com.shopeasy.app.controller
 * =============================================================================
 *
 * [BEGINNER] WHAT IS THE HOME CONTROLLER?
 * ─────────────────────────────────────────
 * The Home controller manages the landing page of the ShopEasy app. This is
 * the first screen users see when they open the app (matched by the route
 * with an empty pattern "").
 *
 * The Home page typically displays:
 *   • A welcome banner or hero section
 *   • Product categories (Electronics, Clothing, etc.) as tiles or cards
 *   • Featured/promoted products
 *   • Quick links to cart, profile, etc.
 *
 * [BEGINNER] CONTROLLER ↔ VIEW RELATIONSHIP
 * ─────────────────────────────────────────────
 * This controller is paired with Home.view.xml:
 *   • Home.view.xml   — WHAT the user sees (layout, controls)
 *   • Home.controller.js — WHAT HAPPENS when the user interacts
 *
 * The view references this controller via:
 *   <mvc:View controllerName="com.shopeasy.app.controller.Home" ...>
 *
 * Event handlers in the view map to methods here:
 *   <StandardTile press=".onCategoryPress" .../>
 *     → Calls this.onCategoryPress(oEvent) in this controller
 *
 * [INTERMEDIATE] The Home controller is intentionally simple. Most of its
 * data comes from the default OData model (categories, featured products)
 * which is bound declaratively in the XML view. The controller only needs
 * to handle user interactions (like clicking a category tile).
 */
sap.ui.define([
    "com/shopeasy/app/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("com.shopeasy.app.controller.Home", {

        /**
         * ================================================================
         * onInit() — Home Page Initialization
         * ================================================================
         *
         * [BEGINNER] Called once when the Home view is first created.
         * This is where you'd set up any home-specific models or
         * configurations.
         *
         * [BEGINNER] FOR THIS SIMPLE HOME PAGE:
         * We don't have much setup to do because:
         *   1. Product categories come from the OData model (already set
         *      up in Component.js and bound in the XML view)
         *   2. The i18n model is already available for translated text
         *   3. Navigation is handled by inherited BaseController methods
         *
         * [INTERMEDIATE] In a more complex app, you might use onInit() to:
         *   • Create a local view model for home-specific UI state:
         *       this.setModel(new JSONModel({ isPromoVisible: true }), "homeView");
         *   • Set up personalization (user preferences for layout)
         *   • Load featured products asynchronously
         *   • Attach to the home route for refresh-on-navigate behavior
         *
         * [BEST PRACTICE] Even if onInit() is empty or minimal, it's good
         * to include it with a comment explaining that the controller
         * intentionally has no init logic. This signals to other developers
         * that it's not an oversight.
         */
        onInit: function () {
            // Currently no home-specific initialization needed.
            // Categories and featured products are bound declaratively
            // from the OData model in Home.view.xml.
        },

        /**
         * ================================================================
         * onCategoryPress(oEvent) — Category Tile/Card Press Handler
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user taps/clicks on a category tile on the home
         * page. It reads the category ID from the pressed item and
         * navigates to the Product List page filtered by that category.
         *
         * [BEGINNER] THE EVENT OBJECT (oEvent)
         * ─────────────────────────────────────
         * Every UI5 event handler receives an Event object as its first
         * parameter. This object contains information about WHAT happened
         * and WHICH control triggered it.
         *
         * Key methods on the Event object:
         *
         *   oEvent.getSource()
         *     → Returns the CONTROL that fired the event (e.g., the
         *       StandardTile or Card that was pressed)
         *
         *   oEvent.getParameter("paramName")
         *     → Returns event-specific parameters. Different events have
         *       different parameters. For "press" events, there usually
         *       aren't extra params, but for "selectionChange" there's
         *       a "selectedItem" parameter, etc.
         *
         *   oEvent.getId()
         *     → Returns the event name (e.g., "press", "change")
         *
         * [BEGINNER] BINDING CONTEXT — THE KEY CONCEPT
         * ─────────────────────────────────────────────
         * When UI5 renders a list/tiles from a model (e.g., items="{/Categories}"),
         * each rendered item gets a "binding context" — a pointer to its
         * specific data in the model.
         *
         * For example, if the Categories model has:
         *   [
         *     { CategoryId: "electronics", Name: "Electronics" },
         *     { CategoryId: "clothing",    Name: "Clothing" },
         *     { CategoryId: "books",       Name: "Books" }
         *   ]
         *
         * Then the 3 rendered tiles have binding contexts:
         *   Tile 1: /Categories(0)  → points to Electronics
         *   Tile 2: /Categories(1)  → points to Clothing
         *   Tile 3: /Categories(2)  → points to Books
         *
         * When the user presses Tile 2, we can get its context and read
         * the CategoryId to know they selected "clothing".
         *
         * [BEGINNER] STEP-BY-STEP WHAT HAPPENS:
         *   1. User clicks the "Electronics" tile
         *   2. UI5 fires the "press" event on that tile
         *   3. UI5 calls this.onCategoryPress(oEvent)
         *   4. We get the tile control via oEvent.getSource()
         *   5. We get the tile's binding context via .getBindingContext()
         *   6. We read the CategoryId from the context
         *   7. We navigate to the productList route with that categoryId
         *   8. The URL becomes: #/products/electronics
         *   9. ProductList.controller.js picks up from there
         *
         * [INTERMEDIATE] getBindingContext() vs getBindingContext("modelName")
         * ───────────────────────────────────────────────────────────────────
         *   getBindingContext()         → Context for the DEFAULT (unnamed) model
         *   getBindingContext("cart")   → Context for the "cart" model
         *
         * Since our categories come from the default OData model, we use
         * getBindingContext() with no argument.
         *
         * [GOTCHA] getBindingContext() can return NULL if:
         *   • The control isn't bound to any model data
         *   • The data hasn't loaded yet (async OData request pending)
         *   • The model name is wrong
         *
         * Always check for null before calling .getProperty() on it!
         *
         * [ADVANCED] getProperty("CategoryId") reads from the OData entity.
         * For OData models, property names must EXACTLY match the metadata
         * (case-sensitive!). If the OData service defines "CategoryId" but
         * you write "categoryId" (lowercase c), you'll get undefined.
         *
         * @public
         * @param {sap.ui.base.Event} oEvent - The press event from the tile/card
         */
        onCategorySelect: function (oEvent) {
            var sKey = oEvent.getParameter("key");
            if (sKey) {
                this.navTo("productList", {
                    categoryId: sKey
                });
            }
        },

        /**
         * [BEGINNER] "Continue Shopping" from hero message
         * If no tab key is provided (button press), navigate to the first
         * available category so users always land on a valid product list.
         */
        onContinueShopping: function () {
            var aCategories = this.getModel().getProperty("/Categories") || [];
            var sCategoryId = aCategories.length > 0 ? aCategories[0].CategoryId : "CAT001";
            this.navTo("productList", {
                categoryId: sCategoryId
            });
        },

        onCategoryPress: function (oEvent) {
            // Step 1: Get the control that was pressed
            var oSource = oEvent.getSource();

            // Step 2: Get the binding context — this tells us WHICH category
            // in the model this tile represents
            var oContext = oSource.getBindingContext();

            // Step 3: Safety check — make sure we have a valid context
            // [BEST PRACTICE] Always validate binding contexts before
            // reading properties. A null context would cause a crash.
            if (!oContext) {
                return;
            }

            // Step 4: Read the CategoryId from the binding context
            // The property name must match the OData entity property exactly.
            var sCategoryId = oContext.getProperty("CategoryId");

            // Step 5: Navigate to the productList route, passing the categoryId
            // as a route parameter. The Router will change the URL hash to
            // #/products/{categoryId} and load the ProductList view.
            this.navTo("productList", {
                categoryId: sCategoryId
            });
        }

        /**
         * [INTERMEDIATE] EVENT HANDLER NAMING CONVENTIONS
         * ════════════════════════════════════════════════
         *
         * UI5 (and SAP Fiori guidelines) use these naming conventions for
         * event handlers:
         *
         *   on<Event>      — Public handlers referenced from XML views
         *                    Examples: onPress, onSearch, onCategoryPress
         *
         *   _on<Event>     — Private handlers attached in JavaScript code
         *                    Examples: _onRouteMatched, _onBindingChange
         *
         *   handle<Event>  — Alternative to "on" prefix (less common in UI5)
         *                    Examples: handleSearch, handleDelete
         *
         * [BEST PRACTICE] Use the "on" prefix for consistency with SAP
         * examples and documentation. Reserve "handle" for disambiguation
         * when both naming could exist (rare in practice).
         */
    });
});
