/**
 * =============================================================================
 *   FILE: ProductDetail.controller.js
 *   PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 *   NAMESPACE: com.shopeasy.app.controller
 * =============================================================================
 *
 * [BEGINNER] WHAT IS THE PRODUCT DETAIL CONTROLLER?
 * ──────────────────────────────────────────────────
 * This controller manages the page that shows detailed information about
 * a SINGLE product. The user arrives here after clicking a product in the
 * Product List page.
 *
 * The detail page typically displays:
 *   • Product image(s)
 *   • Name, description, price
 *   • Availability / stock status
 *   • Rating and reviews
 *   • Quantity selector
 *   • "Add to Cart" button
 *
 * [BEGINNER] KEY CONCEPTS INTRODUCED:
 *   1. ELEMENT BINDING (bindElement) — Binding a VIEW to a SINGLE entity
 *   2. OData entity paths — How to address a single product: /Products('P001')
 *   3. Binding events — Handling data loading, success, and failure
 *   4. Cross-model operations — Reading from OData, writing to cart JSONModel
 *   5. MessageToast — Lightweight success/info notifications
 *
 * [INTERMEDIATE] LIST BINDING vs ELEMENT BINDING
 * ──────────────────────────────────────────────
 * In ProductList, we used LIST BINDING (items="{/Products}") to show
 * multiple products. Here, we use ELEMENT BINDING to show ONE product:
 *
 *   List binding:    items="{/Products}"
 *     → Creates one list item PER entity in the collection
 *     → Each item gets its own binding context automatically
 *
 *   Element binding: this.getView().bindElement("/Products('P001')")
 *     → Binds the ENTIRE VIEW to one specific entity
 *     → All controls in the view can access that entity's properties
 *     → {Name}, {Price}, {Description} all come from the bound product
 *
 * [ADVANCED] ELEMENT BINDING AND OData REQUESTS
 * ──────────────────────────────────────────────
 * When you call bindElement on an OData path like "/Products('P001')",
 * the OData model checks if it already has that entity in its local
 * cache. If not, it sends a GET request to the server:
 *
 *   GET /sap/opu/odata/sap/SHOP_SRV/Products('P001')
 *
 * This request returns all properties of that one product. The model
 * caches the response, and the view's bindings resolve from the cache.
 *
 * If the entity was already loaded (e.g., from a previous list request),
 * no additional server request is needed — the model serves it from cache.
 */
sap.ui.define([
    "com/shopeasy/app/controller/BaseController",
    "com/shopeasy/app/model/formatter",
    /**
     * [BEGINNER] CART HELPER MODULE
     * We import the cart helper to add products to the cart. The cart
     * helper provides addItem(), which handles duplicate detection
     * and total recalculation.
     */
    "com/shopeasy/app/model/cart",
    /**
     * [BEGINNER] sap/m/MessageToast
     * A lightweight, non-intrusive notification that appears briefly
     * at the bottom of the screen and fades out automatically.
     * Perfect for success messages like "Added to cart!"
     *
     * MessageToast vs MessageBox:
     *   MessageToast: Auto-dismisses, no user action needed, non-blocking
     *     → Use for: success confirmations, info, progress updates
     *   MessageBox: Requires user action (OK/Cancel), blocks interaction
     *     → Use for: errors, warnings, confirmations, critical decisions
     */
    "sap/m/MessageToast"
], function (BaseController, formatter, cartHelper, MessageToast) {
    "use strict";

    return BaseController.extend("com.shopeasy.app.controller.ProductDetail", {

        /**
         * [BEGINNER] Attach the formatter module so XML view can use
         * .formatter.formatPrice, .formatter.formatAvailability, etc.
         */
        formatter: formatter,

        /**
         * ================================================================
         * onInit() — Controller Initialization
         * ================================================================
         *
         * [BEGINNER] Sets up route matching for the "productDetail" route.
         * When the URL matches "product/{productId}", _onRouteMatched
         * is called to load and display the specific product.
         */
        onInit: function () {
            this.getRouter()
                .getRoute("productDetail")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * ================================================================
         * _onRouteMatched(oEvent) — Load Product Data
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user navigates to a product detail URL like
         * #/product/P001. Extracts the productId from the URL and binds
         * the view to that specific product's data.
         *
         * [BEGINNER] STEP-BY-STEP:
         *   1. URL: #/product/P001
         *   2. Extract productId = "P001" from route arguments
         *   3. Build the OData entity path: /Products('P001')
         *   4. Bind the view to that path using bindElement
         *   5. OData model loads the product data (if not cached)
         *   6. View controls automatically display the product's properties
         *
         * [INTERMEDIATE] OData ENTITY PATHS
         * ──────────────────────────────────
         * OData uses a specific syntax to address individual entities:
         *
         *   /Products                → The entire Products collection
         *   /Products('P001')        → A single product with key 'P001'
         *   /Products('P001')/Name   → Just the Name property of P001
         *
         * The key format depends on the entity's key type:
         *   String key:  /Products('P001')    — Note the quotes
         *   Integer key: /Products(42)        — No quotes
         *   Compound key: /Products(Id='P001',Version=1)  — Multiple keys
         *
         * [GOTCHA] The key format MUST match the OData metadata exactly.
         * If the key is a string (Edm.String), you MUST use quotes:
         *   /Products('P001')   ← CORRECT
         *   /Products(P001)     ← WRONG for string keys
         *
         * If the key is a number (Edm.Int32), you must NOT use quotes:
         *   /Products(42)       ← CORRECT
         *   /Products('42')     ← WRONG for integer keys
         *
         * @private
         * @param {sap.ui.base.Event} oEvent - The patternMatched event
         */
        _onRouteMatched: function (oEvent) {
            var sProductId = oEvent.getParameter("arguments").productId;

            /**
             * [BEGINNER] FINDING A PRODUCT BY ID IN JSONModel
             * ════════════════════════════════════════════════
             *
             * With JSONModel, products are stored as an array at /Products.
             * To display one product, we find its index in the array and
             * use bindElement with the path "/Products/INDEX".
             *
             * With OData, you'd use: bindElement("/Products('P001')")
             * With JSONModel, you use: bindElement("/Products/3")
             *
             * We search the array for the product with matching ProductId.
             */
            var oModel = this.getModel();
            var aProducts = oModel.getProperty("/Products") || [];

            var iIndex = -1;
            for (var i = 0; i < aProducts.length; i++) {
                if (aProducts[i].ProductId === sProductId) {
                    iIndex = i;
                    break;
                }
            }

            if (iIndex >= 0) {
                // Bind the view to this product's path in the array.
                // After this, {Name} in the view resolves to /Products/3/Name
                this.getView().bindElement({
                    path: "/Products/" + iIndex
                });
            } else {
                // Product not found — navigate back
                this.navTo("home");
            }
        },

        /**
         * ================================================================
         * _onBindingChange() — Handle Binding Context Changes
         * ================================================================
         *
         * [INTERMEDIATE] PURPOSE:
         * Called when the element binding's context changes. The main use
         * case is detecting when a product was NOT FOUND — for example,
         * if the user manually types an invalid product ID in the URL.
         *
         * [INTERMEDIATE] HOW TO DETECT "NOT FOUND":
         * After bindElement, if the OData service returns no data for the
         * given path (404 or empty response), the binding context will be
         * null or undefined. We check for this and handle it gracefully.
         *
         * [BEGINNER] WHAT COULD GO WRONG:
         *   • User types: #/product/NONEXISTENT
         *   • OData service doesn't have product "NONEXISTENT"
         *   • bindElement creates a context that resolves to nothing
         *   • Without this handler, the page would show empty/broken
         *
         * [BEST PRACTICE] Always handle the "entity not found" case.
         * Options include:
         *   1. Navigate to a "NotFound" page
         *   2. Show a MessageBox with an error
         *   3. Navigate back to the previous page
         *   4. Show a MessagePage with "Product not found" text
         *
         * [ADVANCED] In OData v4, you'd check oEvent.getParameter("error")
         * for server errors. In OData v2, server errors are typically
         * handled via the model's "requestFailed" event globally, while
         * "binding has no context" indicates "not found".
         *
         * @private
         */
        _onBindingChange: function () {
            var oElementBinding = this.getView().getElementBinding();

            // Check if the binding exists and has a valid context
            // (a bound context means the entity was found in the model)
            if (oElementBinding && !oElementBinding.getBoundContext()) {
                // Product not found — the URL contains an invalid productId.
                // Navigate to the home page as a fallback.
                // In a production app, you'd navigate to a "NotFound" page:
                //   this.navTo("notFound");
                this.navTo("home", {}, true);
            }
        },

        /**
         * ================================================================
         * onAddToCart(oEvent) — Add Product to Shopping Cart
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user clicks the "Add to Cart" button. Reads
         * the current product data and desired quantity, then delegates
         * to the cart helper to add the item.
         *
         * [BEGINNER] STEP-BY-STEP:
         *   1. User selects quantity (e.g., 2) in a StepInput control
         *   2. User clicks "Add to Cart" button
         *   3. This handler is called
         *   4. We read the quantity from the StepInput control
         *   5. We read the product data from the view's binding context
         *   6. We call cartHelper.addItem() to add it to the cart model
         *   7. We show a success message via MessageToast
         *
         * [INTERMEDIATE] CROSS-MODEL OPERATION
         * ─────────────────────────────────────
         * This method demonstrates a cross-model operation:
         *   • READ from the default OData model (product data)
         *   • WRITE to the "cart" JSONModel (cart items)
         *
         * This is a common pattern: business data comes from OData,
         * but user actions (like "add to cart") modify local state
         * stored in a JSONModel.
         *
         * [GOTCHA] getBindingContext().getObject() returns a COPY of the
         * entity data for OData models, not a reference. Modifying the
         * returned object does NOT change the OData model. This is
         * different from JSONModel where getObject() returns a reference.
         *
         * @public
         * @param {sap.ui.base.Event} oEvent - The press event from the button
         */
        onAddToCart: function (oEvent) {
            /**
             * [BEGINNER] READING THE QUANTITY FROM A CONTROL
             *
             * this.byId("quantityInput")
             *   → Gets the StepInput control by its ID in the view.
             *     The view would have: <StepInput id="quantityInput" ... />
             *
             * .getValue()
             *   → Gets the current numeric value of the StepInput.
             *     StepInput is a number input with +/- buttons.
             *
             * [GOTCHA] byId() returns null if no control with that ID exists.
             * This would cause a crash on .getValue(). We use a default
             * value of 1 as a safety net.
             *
             * [INTERMEDIATE] Alternative approach using data binding:
             * Instead of reading from the control directly, you could:
             *   1. Bind the StepInput to a local view model property
             *   2. Read the model property in the handler
             *
             *   // In onInit:
             *   this.setModel(new JSONModel({ quantity: 1 }), "viewData");
             *
             *   // In XML:
             *   <StepInput value="{viewData>/quantity}" />
             *
             *   // In handler:
             *   var iQty = this.getModel("viewData").getProperty("/quantity");
             *
             * Both approaches work; reading directly from the control is
             * simpler for one-off use cases.
             */
            var oQuantityInput = this.byId("quantityInput");
            var iQuantity = oQuantityInput ? oQuantityInput.getValue() : 1;

            /**
             * [BEGINNER] READING PRODUCT DATA FROM THE BINDING CONTEXT
             *
             * this.getView().getBindingContext()
             *   → Gets the binding context set by bindElement()
             *     This points to the specific product entity
             *
             * .getObject()
             *   → Returns the entire entity as a plain JavaScript object:
             *     {
             *       ProductId: "P001",
             *       Name: "Wireless Mouse",
             *       Price: 29.99,
             *       Description: "Ergonomic wireless mouse...",
             *       ImageUrl: "images/mouse.jpg",
             *       Stock: 15,
             *       Rating: 4.5,
             *       CategoryId: "electronics"
             *     }
             *
             * [GOTCHA] For OData models, getObject() might include
             * OData metadata properties like __metadata, __deferred, etc.
             * The cart helper only uses specific properties (productId,
             * name, price, imageUrl), so the extra properties are ignored.
             */
            var oContext = this.getView().getBindingContext();

            if (!oContext) {
                return;
            }

            var oProduct = oContext.getObject();

            // Map OData property names to cart item property names
            // (OData uses PascalCase, our cart uses camelCase)
            var oProductForCart = {
                productId: oProduct.ProductId,
                name: oProduct.Name,
                price: oProduct.Price,
                imageUrl: oProduct.ImageUrl || ""
            };

            /**
             * [BEGINNER] ADDING TO CART
             *
             * We delegate to the cart helper module (imported as cartHelper).
             * The helper handles:
             *   • Checking if the product is already in the cart
             *   • Merging quantities for existing items
             *   • Recalculating the cart total
             *   • Refreshing the model so the UI updates
             *
             * [BEST PRACTICE] Keep controller event handlers thin.
             * The handler reads user input, delegates to a helper
             * module, and shows the result. No business logic here.
             */
            var oCartModel = this.getModel("cart");
            cartHelper.addItem(oCartModel, oProductForCart, iQuantity);

            /**
             * [BEGINNER] MessageToast — SHOWING A SUCCESS MESSAGE
             * ════════════════════════════════════════════════════
             *
             * MessageToast.show("text") displays a brief, non-intrusive
             * notification at the bottom-center of the screen. It:
             *   • Appears for ~3 seconds
             *   • Fades out automatically
             *   • Doesn't require user action (no OK button)
             *   • Doesn't block the user from continuing
             *
             * [BEGINNER] MessageToast vs MessageBox:
             *
             *   MessageToast.show("Added to cart!")
             *     → Brief popup, auto-dismisses, non-blocking
             *     → Use for: success messages, confirmations, info
             *     → Like Android's Toast or iOS's HUD
             *
             *   MessageBox.error("Product not found")
             *     → Modal dialog, requires user to click OK
             *     → Use for: errors, warnings, decisions
             *     → Like window.alert() but prettier
             *
             *   MessageBox.confirm("Delete this item?", { onClose: fn })
             *     → Modal dialog with OK/Cancel buttons
             *     → Use for: destructive actions, confirmations
             *     → Like window.confirm() but prettier
             *
             * [BEST PRACTICE] Use i18n for the message text:
             *   var sMsg = this.getResourceBundle().getText("addedToCart", [oProduct.Name]);
             *   MessageToast.show(sMsg);
             *
             * This allows the message to be translated. For this learning
             * project, we use hardcoded English.
             *
             * [GOTCHA] MessageToast requires the sap.m library. Make sure
             * it's listed in manifest.json under dependencies.libs.
             */
            MessageToast.show(oProduct.Name + " added to cart!");
        },

        /**
         * ================================================================
         * onNavBack() — Navigate Back from Product Detail
         * ================================================================
         *
         * [BEGINNER] Uses the inherited onNavBack() from BaseController.
         * This checks if there's a previous page in the browser history
         * and navigates there, or falls back to the home page.
         *
         * [INTERMEDIATE] We don't override onNavBack() here because the
         * user could have arrived from either:
         *   • The Product List (most common)
         *   • A direct link/bookmark
         *   • A search result
         *
         * The BaseController's history-based approach handles all these
         * cases correctly. Unlike ProductList (which always goes to Home),
         * Product Detail should go back to wherever the user came FROM.
         *
         * @public
         */
        onNavBack: function () {
            // Delegate to BaseController's implementation which uses
            // History to determine the correct back navigation
            BaseController.prototype.onNavBack.apply(this, arguments);
        }

        /**
         * [ADVANCED] ELEMENT BINDING vs READ OPERATION
         * ═════════════════════════════════════════════
         *
         * There are two ways to load a single entity in UI5 with OData:
         *
         * APPROACH 1: bindElement (what we use)
         * ─────────────────────────────────────
         *   this.getView().bindElement("/Products('P001')");
         *
         *   Pros:
         *     • Automatic data binding — view controls update automatically
         *     • Built-in caching — no duplicate requests
         *     • Built-in lifecycle events (dataRequested, dataReceived)
         *     • Works with Two-Way binding for editing
         *
         *   Cons:
         *     • Less control over the request
         *     • Hard to add custom query options ($expand, $select)
         *       (though you can add them via `parameters` in bindElement)
         *
         * APPROACH 2: model.read() (explicit)
         * ───────────────────────────────────
         *   this.getModel().read("/Products('P001')", {
         *     success: function (oData) {
         *       // Manually set data on a JSONModel
         *       this.getModel("productDetail").setData(oData);
         *     }.bind(this),
         *     error: function (oError) {
         *       // Handle error
         *     }
         *   });
         *
         *   Pros:
         *     • Full control over the request
         *     • Can add any OData query options
         *     • Works well with non-standard data flows
         *
         *   Cons:
         *     • Manual data management
         *     • No automatic binding — must use setData/setProperty
         *     • Must handle caching yourself
         *
         * [BEST PRACTICE] Use bindElement when you want to DISPLAY entity
         * data in a view. Use model.read() when you need data for
         * PROCESSING (calculations, validation) or when you need fine
         * control over the OData request.
         */
    });
});
