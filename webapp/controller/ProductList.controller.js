/**
 * =============================================================================
 *   FILE: ProductList.controller.js
 *   PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 *   NAMESPACE: com.shopeasy.app.controller
 * =============================================================================
 *
 * [BEGINNER] WHAT IS THE PRODUCT LIST CONTROLLER?
 * ─────────────────────────────────────────────────
 * This controller manages the page that shows a LIST of products filtered
 * by category. When a user clicks "Electronics" on the Home page, they
 * arrive here and see all electronic products.
 *
 * [BEGINNER] KEY CONCEPTS INTRODUCED IN THIS CONTROLLER:
 *   1. ROUTE PATTERN MATCHING — Reacting to URL changes with parameters
 *   2. FILTERING — Narrowing down a list based on criteria
 *   3. SORTING — Ordering a list by a property
 *   4. SEARCH — Finding items by text
 *   5. LIST BINDING MANIPULATION — Programmatically changing what a list shows
 *
 * [BEGINNER] URL → ROUTE → CONTROLLER FLOW:
 *   1. User navigates to: #/products/electronics
 *   2. Router matches pattern: "products/{categoryId}"
 *   3. Router extracts: categoryId = "electronics"
 *   4. Router activates the "productList" target → loads ProductList.view.xml
 *   5. Route fires "patternMatched" event
 *   6. _onRouteMatched handler receives categoryId = "electronics"
 *   7. Controller filters the product list to show only electronics
 *
 * [INTERMEDIATE] This controller demonstrates the most common patterns for
 * working with lists in UI5. Lists (sap.m.List, sap.m.Table) are bound to
 * model data via "aggregation binding", and you manipulate what they display
 * by modifying the binding's filters and sorters — NOT by modifying the
 * model data directly.
 *
 * [ADVANCED] CLIENT-SIDE vs SERVER-SIDE FILTERING
 * ────────────────────────────────────────────────
 * UI5 supports both approaches:
 *
 *   CLIENT-SIDE: Data is loaded from the server, then filtered in the browser.
 *     → binding.filter(aFilters, FilterType.Application)
 *     → Fast, no additional network requests
 *     → Only works if ALL data is already loaded
 *     → Good for small datasets (< 1000 items) or JSONModel
 *
 *   SERVER-SIDE: Filters are sent to the OData service as $filter query params.
 *     → binding.filter(aFilters, FilterType.Control)
 *     → Slower (network round-trip), but handles huge datasets
 *     → The server does the heavy lifting
 *     → Required when data is too large to load entirely
 *
 * For our learning app, we use client-side filtering since the mock data
 * is small. In production with real OData, you'd typically use server-side.
 */
sap.ui.define([
    "com/shopeasy/app/controller/BaseController",
    "com/shopeasy/app/model/formatter",
    /**
     * [BEGINNER] sap/ui/model/Filter — The Filter Class
     * Filters restrict which items from a model are shown in a list.
     * You create Filter objects and apply them to a list's binding.
     *
     * Think of it like a WHERE clause in SQL:
     *   SQL:  SELECT * FROM Products WHERE CategoryId = 'electronics'
     *   UI5:  new Filter("CategoryId", FilterOperator.EQ, "electronics")
     */
    "sap/ui/model/Filter",
    /**
     * [BEGINNER] sap/ui/model/FilterOperator — Filter Comparison Types
     * Defines HOW to compare values. It's an enum with operators like:
     *   EQ       — Equals (==)
     *   NE       — Not Equals (!=)
     *   GT       — Greater Than (>)
     *   GE       — Greater Than or Equal (>=)
     *   LT       — Less Than (<)
     *   LE       — Less Than or Equal (<=)
     *   Contains — String contains substring (LIKE '%x%')
     *   StartsWith — String starts with (LIKE 'x%')
     *   EndsWith — String ends with (LIKE '%x')
     *   BT       — Between two values (value >= x AND value <= y)
     */
    "sap/ui/model/FilterOperator",
    /**
     * [BEGINNER] sap/ui/model/Sorter — The Sorter Class
     * Sorts list items by a property. You create Sorter objects and
     * apply them to a list's binding.
     *
     *   new Sorter("Name", false)  → Sort by Name, ascending (A→Z)
     *   new Sorter("Price", true)  → Sort by Price, descending (high→low)
     */
    "sap/ui/model/Sorter",
    "sap/m/MessageToast"
], function (BaseController, formatter, Filter, FilterOperator, Sorter, MessageToast) {
    "use strict";

    return BaseController.extend("com.shopeasy.app.controller.ProductList", {

        /**
         * [BEGINNER] FORMATTER ATTACHMENT
         * ════════════════════════════════
         *
         * By assigning the imported `formatter` module to `this.formatter`,
         * we make all formatter functions available in the XML view.
         *
         * In the XML view, you reference them with a dot prefix:
         *   <ObjectNumber number="{path: 'Price', formatter: '.formatter.formatPrice'}" />
         *
         * The dot means "look on the controller instance", so:
         *   ".formatter.formatPrice" → this.formatter.formatPrice
         *
         * [GOTCHA] The property name MUST be "formatter" (lowercase f).
         * If you name it "Formatter" or "myFormatter", the view references
         * won't work because they look for ".formatter.functionName".
         *
         * [BEST PRACTICE] Attach the formatter in the controller definition
         * (not in onInit), so it's available even before onInit runs.
         * Some views might try to resolve formatter references during
         * view creation, which happens before onInit.
         */
        formatter: formatter,

        /**
         * [INTERMEDIATE] PRIVATE STATE
         *
         * We store the current category filter and search filter separately
         * so we can combine them. When the user searches within a category,
         * we need BOTH filters active simultaneously:
         *   "Show products WHERE CategoryId = 'electronics' AND Name CONTAINS 'mouse'"
         *
         * [ADVANCED] Storing filter state on the controller instance (via
         * `this._sCategoryId` etc.) is a common pattern, but be aware that
         * controller instances can be reused across navigations in some
         * routing configurations. Always reset/update state in
         * _onRouteMatched to avoid stale state from a previous navigation.
         */

        /**
         * ================================================================
         * onInit() — Controller Initialization
         * ================================================================
         *
         * [BEGINNER] Sets up the route pattern matching for this controller.
         * When the URL matches "products/{categoryId}", the _onRouteMatched
         * method will be called.
         *
         * [BEGINNER] THE PATTERN MATCHING SETUP:
         *
         *   this.getRouter()
         *     → Gets the Router (inherited from BaseController)
         *
         *   .getRoute("productList")
         *     → Gets the Route object named "productList" from the router.
         *       This was defined in manifest.json:
         *       { name: "productList", pattern: "products/{categoryId}" }
         *
         *   .attachPatternMatched(this._onRouteMatched, this)
         *     → Registers _onRouteMatched to be called whenever the
         *       "productList" route's pattern is matched.
         *     → The second argument `this` sets the context for the
         *       callback (so `this` inside _onRouteMatched refers to
         *       the controller).
         *
         * [GOTCHA] attachPatternMatched vs attachMatched:
         *   • attachPatternMatched — Fires only when THIS SPECIFIC route
         *     is matched. This is what you want 99% of the time.
         *   • attachMatched — Also fires when a CHILD route is matched.
         *     Relevant for nested routes (not used in our simple app).
         *
         * [BEST PRACTICE] Always set up route attachment in onInit().
         * Don't do it in the constructor or elsewhere — onInit ensures
         * the view and component are fully ready.
         */
        onInit: function () {
            this.getRouter()
                .getRoute("productList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * ================================================================
         * _onRouteMatched(oEvent) — Handle Route Navigation
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called every time the user navigates to a productList URL.
         * Extracts the categoryId from the URL and filters the product
         * list to show only products in that category.
         *
         * [BEGINNER] HOW ROUTE ARGUMENTS WORK:
         *
         * When the URL is: #/products/electronics
         * And the pattern is: "products/{categoryId}"
         *
         * The Router extracts: { categoryId: "electronics" }
         * And stores them as "arguments" in the event.
         *
         *   oEvent.getParameter("arguments")
         *     → { categoryId: "electronics" }
         *
         *   oEvent.getParameter("arguments").categoryId
         *     → "electronics"
         *
         * [INTERMEDIATE] WHY USE _onRouteMatched INSTEAD OF onInit?
         * ─────────────────────────────────────────────────────────
         * onInit runs ONCE when the view is created. But the user can
         * navigate to different categories without the view being
         * recreated:
         *
         *   #/products/electronics → onInit + _onRouteMatched
         *   #/products/clothing    → _onRouteMatched only (view reused!)
         *   #/products/books       → _onRouteMatched only
         *
         * The view instance persists, and only _onRouteMatched is called
         * on subsequent navigations. So data loading and filtering MUST
         * be in _onRouteMatched, not in onInit.
         *
         * [GOTCHA] If you put data loading in onInit(), the product list
         * will always show the FIRST category you navigated to, even
         * when you switch categories. This is a very common beginner
         * mistake.
         *
         * @private
         * @param {sap.ui.base.Event} oEvent - The patternMatched event
         */
        _onRouteMatched: function (oEvent) {
            // Extract the categoryId from the route arguments
            var sCategoryId = oEvent.getParameter("arguments").categoryId;

            // Store the current category ID for use in _applyFilters
            this._sCategoryId = sCategoryId;

            // Reset the search query when navigating to a new category
            // (so old search results don't persist across category changes)
            this._sSearchQuery = "";

            // Apply the category filter to the product list
            this._applyFilters();

            /**
             * [INTERMEDIATE] SETTING THE PAGE TITLE
             * ═════════════════════════════════════
             *
             * We could set the page title to the category name. Since we
             * have the categoryId but not the category name directly,
             * we'd normally read it from the OData model:
             *
             *   var oModel = this.getModel();
             *   oModel.read("/Categories('" + sCategoryId + "')", {
             *     success: function (oData) {
             *       this.byId("productListPage").setTitle(oData.Name);
             *     }.bind(this)
             *   });
             *
             * For simplicity, we use the categoryId directly as the title.
             * In production, always use the human-readable category name.
             *
             * [BEGINNER] this.byId("productListPage")
             * Gets a control from the view by its ID. The "productListPage"
             * must match an id="productListPage" attribute in the XML view.
             *
             * [GOTCHA] this.byId() adds the view's ID prefix automatically.
             * If the view ID is "productList" and you call this.byId("page"),
             * it looks for a control with runtime ID "productList--page".
             * Don't use sap.ui.getCore().byId() — it doesn't add the prefix
             * and requires the full runtime ID.
             */
        },

        /**
         * ================================================================
         * onSearch(oEvent) — Search Field Handler
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user types in the search bar and submits
         * (presses Enter or clicks the search icon). Filters the product
         * list to show only products whose Name contains the search text.
         *
         * [BEGINNER] SEARCH FLOW:
         *   1. User types "mouse" in the search field
         *   2. User presses Enter or clicks the search icon
         *   3. SearchField control fires the "search" event
         *   4. This handler is called with the event
         *   5. We read the search query from the event
         *   6. We create a Filter: Name contains "mouse"
         *   7. We apply it to the product list
         *   8. The list updates to show only matching products
         *
         * [BEGINNER] THE EVENT PARAMETER "query":
         * The SearchField's "search" event has a parameter called "query"
         * which contains the text the user typed:
         *
         *   oEvent.getParameter("query")  → "mouse"
         *
         * [INTERMEDIATE] SEARCH IMPLEMENTATION OPTIONS:
         *   1. Live search (filter as you type): Use "liveChange" event
         *      → Better UX but more expensive (filters on every keystroke)
         *   2. Submit search (filter on Enter): Use "search" event
         *      → Less responsive but more efficient
         *
         * For our app, we use "search" (submit-based) for simplicity.
         *
         * [GOTCHA] When the user CLEARS the search field, the "search"
         * event fires with query = "" (empty string). Make sure your
         * filter logic handles empty queries correctly (show all items).
         *
         * @public
         * @param {sap.ui.base.Event} oEvent - The search event from SearchField
         */
        onSearch: function (oEvent) {
            // Read the search query from the event
            // getParameter("query") works for the "search" event of SearchField
            var sQuery = oEvent.getParameter("query") || "";

            // Store the search query for combining with category filter
            this._sSearchQuery = sQuery;

            // Apply combined filters (search + category)
            this._applyFilters();
        },

        /**
         * ================================================================
         * onSortChange(oEvent) — Sort Selection Handler
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user selects a different sort option (e.g.,
         * from a Select dropdown or ViewSettingsDialog). Sorts the
         * product list by the selected property.
         *
         * [BEGINNER] WHAT IS SORTING IN UI5?
         * Sorting changes the ORDER of items in a list without filtering
         * any out. You create a Sorter object and apply it to the list's
         * binding:
         *
         *   new Sorter("Price", false)  → Sort by Price, ascending (low → high)
         *   new Sorter("Price", true)   → Sort by Price, descending (high → low)
         *   new Sorter("Name", false)   → Sort by Name, A → Z
         *   new Sorter("Rating", true)  → Sort by Rating, highest first
         *
         * [BEGINNER] HOW TO GET THE SORT KEY:
         * The implementation depends on which control triggers the sort.
         * Common approaches:
         *
         *   A) From a sap.m.Select dropdown:
         *      var sKey = oEvent.getParameter("selectedItem").getKey();
         *      // Key might be "Name", "Price", "Rating"
         *
         *   B) From a ViewSettingsDialog:
         *      var sSortItem = oEvent.getParameter("sortItem").getKey();
         *      var bDescending = oEvent.getParameter("sortDescending");
         *
         * [INTERMEDIATE] SORTING AND BINDING
         * ──────────────────────────────────
         * The Sorter is applied to the list's aggregation binding:
         *
         *   var oBinding = oList.getBinding("items");
         *   oBinding.sort(new Sorter("Price", true));
         *
         * This tells UI5: "Re-arrange the list items by Price, descending."
         * The model data is NOT changed — only the display order.
         *
         * [ADVANCED] Multiple sorters can be applied simultaneously
         * by passing an array:
         *   oBinding.sort([
         *     new Sorter("Category", false),  // Primary sort
         *     new Sorter("Name", false)        // Secondary sort (within same category)
         *   ]);
         *
         * @public
         * @param {sap.ui.base.Event} oEvent - The change/confirm event
         */
        onSortChange: function (oEvent) {
            // Get the selected sort key from the event source
            // This assumes a Select control with items having keys like "Name", "Price"
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

            // Determine sort direction — sort Price descending (high to low),
            // everything else ascending (A to Z, low to high)
            var bDescending = (sSelectedKey === "Price");

            // Create a Sorter with the selected property and direction
            var oSorter = new Sorter(sSelectedKey, bDescending);

            /**
             * [BEGINNER] APPLYING THE SORTER TO THE LIST
             * ═══════════════════════════════════════════
             *
             * this.byId("productList")
             *   → Gets the sap.m.List control from the view by its ID
             *
             * .getBinding("items")
             *   → Gets the BINDING object for the "items" aggregation.
             *     The "items" aggregation is what connects the list control
             *     to the model data. In the view it looks like:
             *       <List id="productList" items="{/Products}">
             *
             *     The binding object is the "bridge" between the model and
             *     the control. It manages which model entries are displayed,
             *     in what order, and with what filters applied.
             *
             * .sort(oSorter)
             *   → Applies the sorter to the binding. The list immediately
             *     re-renders with items in the new order.
             *     Passing an empty array [] would REMOVE all sorting.
             *
             * [GOTCHA] The binding's sort() method takes either a single
             * Sorter object or an ARRAY of Sorter objects. Passing null or
             * undefined might cause errors — use an empty array [] to clear.
             *
             * [INTERMEDIATE] SORT STABILITY:
             * If two items have the same sort value (e.g., same price),
             * their relative order is preserved from the original data.
             * This is called "stable sorting" and is guaranteed by UI5.
             */
            var oList = this.byId("productList");
            var oBinding = oList.getBinding("items");
            oBinding.sort(oSorter);
        },

        onOpenViewSettings: function () {
            MessageToast.show("View settings dialog coming soon");
        },

        /**
         * ================================================================
         * onProductPress(oEvent) — Product Item Press Handler
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user clicks/taps on a product in the list.
         * Gets the ProductId from the pressed item and navigates to the
         * Product Detail page.
         *
         * [BEGINNER] THIS IS THE SAME PATTERN AS onCategoryPress:
         *   1. Get the pressed control: oEvent.getSource()
         *   2. Get its binding context: .getBindingContext()
         *   3. Read a property: .getProperty("ProductId")
         *   4. Navigate with the property as a route parameter
         *
         * This "get context → read property → navigate" pattern is THE
         * most common pattern in UI5 controllers. You'll write it dozens
         * of times in any real project.
         *
         * [INTERMEDIATE] For list items, there's a subtle difference:
         * The "press" event on a StandardListItem comes from the list item
         * itself. But for ObjectListItem with "type: 'Navigation'", the
         * "press" event also fires. Use the "itemPress" event on the List
         * control itself as an alternative:
         *
         *   <List itemPress=".onProductPress" ...>
         *     → oEvent.getParameter("listItem") gives the pressed item
         *
         * vs.
         *
         *   <StandardListItem press=".onProductPress" ...>
         *     → oEvent.getSource() gives the pressed item
         *
         * [GOTCHA] Make sure to use the correct method to get the pressed
         * item depending on which control/event you're listening to.
         *
         * @public
         * @param {sap.ui.base.Event} oEvent - The press event from the list item
         */
        onProductPress: function (oEvent) {
            var oSource = oEvent.getSource();
            var oContext = oSource.getBindingContext();

            if (!oContext) {
                return;
            }

            var sProductId = oContext.getProperty("ProductId");

            // Navigate to the productDetail route
            // The URL will become: #/product/{productId}
            this.navTo("productDetail", {
                productId: sProductId
            });
        },

        /**
         * ================================================================
         * onNavBack() — Override Back Navigation
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Overrides the BaseController's onNavBack() to navigate
         * specifically to the home page instead of using browser history.
         *
         * [INTERMEDIATE] WHY OVERRIDE?
         * The BaseController's onNavBack() uses browser history, which
         * might navigate to unexpected pages. For the ProductList, we
         * ALWAYS want "Back" to go to Home, regardless of how the user
         * got here (direct URL, bookmark, or normal navigation).
         *
         * [BEST PRACTICE] Override onNavBack() in controllers where you
         * have a clear, predictable "parent" page. Use the inherited
         * version when the history-based approach is acceptable.
         *
         * @public
         */
        onNavBack: function () {
            this.navTo("home");
        },

        /**
         * ================================================================
         * onFilterProducts(oEvent) — Advanced Multi-Criteria Filtering
         * ================================================================
         *
         * [ADVANCED] PURPOSE:
         * Handles filtering from a FilterBar or ViewSettingsDialog with
         * multiple filter criteria. This is a more complex version of
         * onSearch that supports filtering by multiple properties
         * simultaneously.
         *
         * [ADVANCED] EXAMPLE SCENARIO:
         * A FilterBar might have:
         *   • Price range: min $10, max $100
         *   • Rating: >= 4 stars
         *   • Availability: "In Stock" only
         *
         * Each criterion creates a separate Filter, and they're combined
         * with AND logic: show products that match ALL criteria.
         *
         * [INTERMEDIATE] COMBINING FILTERS WITH AND/OR:
         *
         *   AND logic (all must match):
         *     new Filter({
         *       filters: [filter1, filter2, filter3],
         *       and: true  ← AND
         *     })
         *     → Show items where filter1 AND filter2 AND filter3 are true
         *
         *   OR logic (any must match):
         *     new Filter({
         *       filters: [filter1, filter2, filter3],
         *       and: false  ← OR (default)
         *     })
         *     → Show items where filter1 OR filter2 OR filter3 is true
         *
         * [ADVANCED] You can NEST these for complex logic:
         *   (CategoryId = 'electronics' OR CategoryId = 'accessories')
         *   AND (Price > 10)
         *   AND (Rating >= 4)
         *
         *   var oCategoryFilter = new Filter({
         *     filters: [
         *       new Filter("CategoryId", FilterOperator.EQ, "electronics"),
         *       new Filter("CategoryId", FilterOperator.EQ, "accessories")
         *     ],
         *     and: false  // OR between categories
         *   });
         *
         *   var oFinalFilter = new Filter({
         *     filters: [
         *       oCategoryFilter,
         *       new Filter("Price", FilterOperator.GT, 10),
         *       new Filter("Rating", FilterOperator.GE, 4)
         *     ],
         *     and: true  // AND between all criteria
         *   });
         *
         * @public
         * @param {sap.ui.base.Event} oEvent - The filter event from FilterBar
         */
        onFilterProducts: function (oEvent) {
            // This is a placeholder for advanced filtering scenarios.
            // A real implementation would read filter values from the
            // FilterBar control and pass them to _applyFilters.
            this._applyFilters();
        },

        /**
         * ================================================================
         * _applyFilters() — Internal: Combine and Apply All Active Filters
         * ================================================================
         *
         * [INTERMEDIATE] PURPOSE:
         * Combines the current category filter and search filter into a
         * single compound filter and applies it to the product list
         * binding. This is called by both _onRouteMatched (category change)
         * and onSearch (search text change).
         *
         * [BEGINNER] WHY COMBINE FILTERS?
         * When the user is viewing "Electronics" and searches for "mouse",
         * we need TWO filters active at the same time:
         *   1. CategoryId = "electronics"  (from the route)
         *   2. Name contains "mouse"       (from the search)
         *
         * Both must be true (AND logic) for a product to show up.
         *
         * [INTERMEDIATE] THE FILTER HIERARCHY:
         *
         *   Final filter (AND):
         *     ├── Category filter: CategoryId EQ "electronics"
         *     └── Search filter: Name Contains "mouse"
         *
         * [ADVANCED] Filter.filter() vs binding.filter()
         * ──────────────────────────────────────────────
         * Don't confuse these:
         *   • Filter (capital F) — The Filter CLASS used to create filter objects
         *   • binding.filter()  — The METHOD on list bindings that applies filters
         *
         * The binding.filter() method accepts:
         *   • A single Filter object
         *   • An array of Filter objects (combined with AND by default)
         *   • A FilterType parameter (Application or Control)
         *
         * [GOTCHA] When applying filters, passing an EMPTY ARRAY [] to
         * binding.filter([]) removes ALL filters and shows everything.
         * This is how you "reset" filters. Passing null might cause errors.
         *
         * @private
         */
        _applyFilters: function () {
            var aFilters = [];

            // Add category filter if we have a categoryId
            // (we always should, since the route requires it)
            if (this._sCategoryId) {
                aFilters.push(
                    new Filter("CategoryId", FilterOperator.EQ, this._sCategoryId)
                );
            }

            // Add search filter if the user has entered a search query
            if (this._sSearchQuery) {
                /**
                 * [BEGINNER] FilterOperator.Contains
                 * ═══════════════════════════════════
                 *
                 * Contains checks if the property VALUE includes the search
                 * text ANYWHERE within it (case-insensitive in most cases):
                 *
                 *   new Filter("Name", FilterOperator.Contains, "mouse")
                 *
                 *   "Wireless Mouse"    → ✓ MATCH (contains "mouse")
                 *   "Mouse Pad"         → ✓ MATCH (contains "mouse")
                 *   "USB Keyboard"      → ✗ NO MATCH
                 *
                 * [GOTCHA] Case sensitivity depends on the data source:
                 *   • JSONModel: Contains is case-SENSITIVE by default
                 *   • OData: Depends on the backend (SAP ABAP is usually
                 *     case-insensitive for Contains/substringof)
                 *
                 * To force case-insensitive on JSONModel, use:
                 *   new Filter({
                 *     path: "Name",
                 *     operator: FilterOperator.Contains,
                 *     value1: "mouse",
                 *     caseSensitive: false
                 *   })
                 */
                aFilters.push(
                    new Filter("Name", FilterOperator.Contains, this._sSearchQuery)
                );
            }

            // Get the list's binding and apply the filters
            var oList = this.byId("productList");
            var oBinding = oList.getBinding("items");

            if (oBinding) {
                /**
                 * [INTERMEDIATE] APPLYING THE FILTER ARRAY
                 *
                 * When we pass an array of Filter objects to binding.filter(),
                 * they are combined with AND logic by default:
                 *
                 *   oBinding.filter([filterA, filterB])
                 *   → Show items where filterA AND filterB are true
                 *
                 * If we need OR logic, we'd wrap them in a compound Filter:
                 *   oBinding.filter(new Filter({
                 *     filters: [filterA, filterB],
                 *     and: false  // OR
                 *   }))
                 *
                 * Passing an empty array removes all filters:
                 *   oBinding.filter([])
                 *   → Show ALL items (no filtering)
                 */
                oBinding.filter(aFilters);
            }
        }

        /**
         * [ADVANCED] SUMMARY: FILTER AND SORTER LIFECYCLE
         * ════════════════════════════════════════════════
         *
         * Filters and sorters exist on the BINDING, not on the model or
         * the control. Their lifecycle:
         *
         *   1. User navigates to the page → _onRouteMatched → filter by category
         *   2. User types in search       → onSearch → add search filter
         *   3. User selects sort option   → onSortChange → apply sorter
         *   4. User navigates away        → (filters/sorters persist on binding)
         *   5. User navigates back        → _onRouteMatched → filters are RESET
         *
         * [GOTCHA] Filters persist on the binding even when the view is
         * not visible. If you navigate away and back, _onRouteMatched
         * must re-apply the correct filters. Otherwise, the list might
         * show data from the PREVIOUS category.
         *
         * [BEST PRACTICE] Always reset filters/sorters in _onRouteMatched
         * to start fresh on each navigation. Don't assume the binding is
         * in a clean state.
         */
    });
});
