/**
 * =============================================================================
 *   FILE: Cart.controller.js
 *   PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 *   NAMESPACE: com.shopeasy.app.controller
 * =============================================================================
 *
 * [BEGINNER] WHAT IS THE CART CONTROLLER?
 * ─────────────────────────────────────────
 * The Cart controller manages the shopping cart page where users can:
 *   • View all items they've added to the cart
 *   • Change quantities of items
 *   • Remove individual items
 *   • Clear the entire cart
 *   • See the total price
 *   • Proceed to checkout or continue shopping
 *
 * [BEGINNER] DATA SOURCE:
 * Unlike the product pages (which use the OData model), the Cart page
 * reads from and writes to the "cart" JSONModel. This is a CLIENT-SIDE
 * model — all cart data lives in the browser and is NOT sent to a server.
 *
 * In a production app, you'd typically persist the cart to the server
 * so it survives page refreshes and is accessible across devices.
 *
 * [INTERMEDIATE] KEY CONCEPTS INTRODUCED:
 *   1. MessageBox.confirm() — Asking for user confirmation before actions
 *   2. Defensive programming — Validating data before operations
 *   3. Model refresh patterns — Ensuring the UI stays in sync with data
 *   4. Callback patterns — Handling asynchronous user decisions
 *
 * [INTERMEDIATE] CART MODEL STRUCTURE (reminder from cart.js):
 *   {
 *     "items": [
 *       { productId, name, price, quantity, imageUrl },
 *       { productId, name, price, quantity, imageUrl }
 *     ],
 *     "totalPrice": 109.97,
 *     "itemCount": 3,
 *     "currency": "USD"
 *   }
 *
 * In the XML view, items are bound via:
 *   <List items="{cart>/items}">
 *     <StandardListItem title="{cart>name}" ... />
 *   </List>
 *
 * Note the "cart>" prefix — this tells UI5 to look in the "cart" named
 * model instead of the default (unnamed) OData model.
 */
sap.ui.define([
    "com/shopeasy/app/controller/BaseController",
    "com/shopeasy/app/model/formatter",
    "com/shopeasy/app/model/cart",
    /**
     * [BEGINNER] sap/m/MessageBox
     * ═══════════════════════════
     * MessageBox provides modal dialog methods for user interaction:
     *
     *   MessageBox.show(message)       — Generic dialog with custom buttons
     *   MessageBox.alert(message)      — Info dialog with OK button
     *   MessageBox.confirm(message)    — Confirmation with OK/Cancel
     *   MessageBox.error(message)      — Error dialog with Close button
     *   MessageBox.information(message) — Info dialog
     *   MessageBox.success(message)    — Success dialog
     *   MessageBox.warning(message)    — Warning dialog
     *
     * All MessageBox methods are ASYNCHRONOUS — they show the dialog and
     * return immediately. The user's response comes via a callback function.
     *
     * [INTERMEDIATE] MessageBox vs Dialog:
     *   MessageBox: Pre-built dialogs for common scenarios (confirm, error, etc.)
     *     → Quick to use, limited customization
     *   sap.m.Dialog: Fully customizable modal dialog
     *     → More work to set up, but can contain any controls
     *
     * Use MessageBox for standard messages, Dialog for complex forms or
     * custom layouts.
     */
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, formatter, cartHelper, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("com.shopeasy.app.controller.Cart", {

        /**
         * Attach formatter for XML view bindings
         */
        formatter: formatter,

        /**
         * ================================================================
         * onInit() — Cart Page Initialization
         * ================================================================
         *
         * [BEGINNER] Currently minimal setup needed for the cart page.
         * The cart model is already set on the Component level and
         * propagates down to this view automatically.
         *
         * [INTERMEDIATE] You could attach a route matched handler here
         * to perform actions every time the user navigates to the cart:
         *
         *   this.getRouter()
         *     .getRoute("cart")
         *     .attachPatternMatched(this._onRouteMatched, this);
         *
         * Possible use cases:
         *   • Re-validate stock levels against the server
         *   • Check if any cart items have been discontinued
         *   • Update prices (they might have changed since the user
         *     last visited the cart)
         *   • Track analytics (cart views, abandon rate)
         */
        onInit: function () {
            // Attach route handler to refresh cart state on each visit
            this.getRouter()
                .getRoute("cart")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * ================================================================
         * _onRouteMatched() — Cart Route Handler
         * ================================================================
         *
         * [INTERMEDIATE] Called each time the user navigates to the cart.
         * Currently a placeholder for cart validation logic.
         *
         * [ADVANCED] In a production app, you'd validate the cart here:
         *
         *   _onRouteMatched: function () {
         *     var oCartModel = this.getModel("cart");
         *     var aItems = oCartModel.getProperty("/items");
         *
         *     // Check each item against current server data
         *     aItems.forEach(function (oItem) {
         *       this.getModel().read("/Products('" + oItem.productId + "')", {
         *         success: function (oProduct) {
         *           if (oProduct.Price !== oItem.price) {
         *             // Price changed — update cart and warn user
         *           }
         *           if (oProduct.Stock < oItem.quantity) {
         *             // Not enough stock — reduce quantity
         *           }
         *         }
         *       });
         *     }.bind(this));
         *   }
         *
         * @private
         */
        _onRouteMatched: function () {
            // Placeholder for cart validation on navigation
        },

        /**
         * ================================================================
         * onDeleteItem(oEvent) — Remove Item from Cart
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user clicks the delete button/icon next to a
         * cart item. Removes that specific item from the cart completely.
         *
         * [BEGINNER] THE APPROACH:
         *   1. Get the control that was clicked (the delete button)
         *   2. Get its binding context (which cart item it belongs to)
         *   3. Read the productId from the context
         *   4. Call cartHelper.removeItem() to remove it from the model
         *   5. Show a confirmation toast message
         *
         * [INTERMEDIATE] BINDING CONTEXT FOR NAMED MODELS
         * ────────────────────────────────────────────────
         * Since cart items are bound to the NAMED model "cart", we must
         * use getBindingContext("cart") — NOT getBindingContext():
         *
         *   getBindingContext()       → Context for the default model (OData)
         *   getBindingContext("cart") → Context for the "cart" model
         *
         * This is a VERY common mistake. If you forget the model name,
         * getBindingContext() returns null (because the delete button
         * isn't bound to the OData model), and you'll get a crash.
         *
         * [GOTCHA] The delete button and the list item might be different
         * controls. Make sure you call getBindingContext on the right one:
         *
         *   Option A: Delete button inside a list item
         *     <StandardListItem>
         *       <Button icon="sap-icon://delete" press=".onDeleteItem" />
         *     </StandardListItem>
         *     → oEvent.getSource() is the Button
         *     → The Button inherits the list item's binding context
         *     → getBindingContext("cart") works on the Button
         *
         *   Option B: List's "delete" mode
         *     <List mode="Delete" delete=".onDeleteItem">
         *     → oEvent.getParameter("listItem") gives the deleted item
         *     → Call getBindingContext("cart") on the listItem
         *
         * [BEST PRACTICE] Always show confirmation or feedback after
         * removing an item. Users should know their action was successful.
         *
         * @public
         * @param {sap.ui.base.Event} oEvent - The press/delete event
         */
        onDeleteItem: function (oEvent) {
            var oSource = oEvent.getSource();

            // Get binding context for the "cart" model
            var oContext = oSource.getBindingContext("cart");

            // [BEST PRACTICE] Defensive check — validate context exists
            if (!oContext) {
                return;
            }

            var sProductId = oContext.getProperty("productId");
            var sProductName = oContext.getProperty("name");

            // Delegate removal to the cart helper
            var oCartModel = this.getModel("cart");
            cartHelper.removeItem(oCartModel, sProductId);

            // Show feedback to the user
            MessageToast.show(sProductName + " removed from cart");
        },

        /**
         * ================================================================
         * onQuantityChange(oEvent) — Update Item Quantity
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user changes the quantity of a cart item
         * (e.g., via a StepInput or Input control). Updates the cart
         * model with the new quantity and recalculates totals.
         *
         * [BEGINNER] EVENT PARAMETERS:
         * For a StepInput "change" event:
         *   oEvent.getParameter("value")  → The new numeric value
         *
         * For an Input "change" event:
         *   oEvent.getParameter("value")  → The new text value (string)
         *   → You'd need parseInt() to convert it
         *
         * [INTERMEDIATE] IMMEDIATE vs DEFERRED UPDATES
         * ────────────────────────────────────────────
         * We update the cart immediately on every quantity change.
         * An alternative approach is:
         *   • Let the user change quantities freely
         *   • Only update when they click "Update Cart" button
         *   • This requires storing temporary state
         *
         * Immediate updates are simpler and give instant feedback
         * (the total price updates right away). Deferred updates are
         * better for performance with server-side carts (fewer API calls).
         *
         * [GOTCHA] StepInput fires the "change" event on blur AND on
         * +/- button clicks. Make sure your handler can be called
         * multiple times rapidly without issues.
         *
         * @public
         * @param {sap.ui.base.Event} oEvent - The change event from StepInput
         */
        onQuantityChange: function (oEvent) {
            // Get the new quantity value from the event
            var iNewQuantity = oEvent.getParameter("value");

            // Get the product ID from the control's binding context
            var oSource = oEvent.getSource();
            var oContext = oSource.getBindingContext("cart");

            if (!oContext) {
                return;
            }

            var sProductId = oContext.getProperty("productId");

            // Delegate to cart helper for quantity update
            // (if quantity <= 0, the helper will remove the item)
            var oCartModel = this.getModel("cart");
            cartHelper.updateQuantity(oCartModel, sProductId, iNewQuantity);
        },

        /**
         * ================================================================
         * onContinueShopping() — Navigate Back to Home
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user clicks a "Continue Shopping" button.
         * Simply navigates back to the home page so they can browse
         * more products.
         *
         * [BEGINNER] This is straightforward — just a navigation call.
         * The cart data is preserved in the component-level model,
         * so when the user comes back to the cart, everything is
         * still there.
         *
         * [INTERMEDIATE] We navigate to "home" specifically (not the
         * previous page) because the user's intent is clear: they want
         * to browse products. If we used history.back(), they might
         * end up on the checkout page or a product detail — not the
         * browsing experience they expect.
         *
         * @public
         */
        onContinueShopping: function () {
            this.navTo("home");
        },

        /**
         * ================================================================
         * onProceedToCheckout() — Navigate to Checkout Page
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user clicks the "Checkout" or "Proceed to
         * Checkout" button. Navigates to the checkout page.
         *
         * [INTERMEDIATE] In a production app, you might validate the
         * cart before allowing checkout:
         *
         *   onProceedToCheckout: function () {
         *     var oCartModel = this.getModel("cart");
         *     var aItems = oCartModel.getProperty("/items");
         *
         *     if (!aItems || aItems.length === 0) {
         *       MessageBox.warning("Your cart is empty. Add items first.");
         *       return;
         *     }
         *
         *     // Check minimum order amount
         *     var fTotal = cartHelper.getTotal(oCartModel);
         *     if (fTotal < 10) {
         *       MessageBox.warning("Minimum order is $10.00");
         *       return;
         *     }
         *
         *     this.navTo("checkout");
         *   }
         *
         * @public
         */
        onProceedToCheckout: function () {
            this.navTo("checkout");
        },

        /**
         * ================================================================
         * onClearCart() — Clear All Items from Cart (with Confirmation)
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user clicks a "Clear Cart" or "Remove All"
         * button. Shows a confirmation dialog before clearing, because
         * this is a DESTRUCTIVE ACTION that can't be undone.
         *
         * [BEGINNER] MessageBox.confirm() EXPLAINED
         * ═════════════════════════════════════════
         *
         * MessageBox.confirm("Are you sure?", { onClose: function(action) {} })
         *
         * This shows a modal dialog with:
         *   • The message text ("Are you sure?")
         *   • An OK button
         *   • A Cancel button
         *
         * When the user clicks either button, the onClose callback is
         * called with the action they chose:
         *   • MessageBox.Action.OK — User clicked OK
         *   • MessageBox.Action.CANCEL — User clicked Cancel
         *
         * [BEGINNER] THE CALLBACK PATTERN
         * ────────────────────────────────
         * MessageBox.confirm is ASYNCHRONOUS. It shows the dialog and
         * returns IMMEDIATELY. Your code continues running without
         * waiting for the user to click.
         *
         * The user's response arrives LATER via the callback function.
         * This is why you put the "clear" logic INSIDE the callback,
         * not after the MessageBox.confirm() call:
         *
         *   // WRONG — clears cart immediately, doesn't wait for user!
         *   MessageBox.confirm("Clear cart?", {});
         *   cartHelper.clearCart(oCartModel);  // ← Runs immediately!
         *
         *   // CORRECT — clears cart only when user clicks OK
         *   MessageBox.confirm("Clear cart?", {
         *     onClose: function (sAction) {
         *       if (sAction === MessageBox.Action.OK) {
         *         cartHelper.clearCart(oCartModel);  // ← Runs after OK
         *       }
         *     }
         *   });
         *
         * [GOTCHA] The callback's `this` context is NOT the controller
         * unless you explicitly bind it. Inside the callback, `this`
         * is typically the global object. Use .bind(this) or arrow
         * functions (if your project supports them) to fix this.
         *
         * [BEST PRACTICE] Always confirm destructive actions:
         *   • Clear cart
         *   • Delete account
         *   • Cancel order
         *   • Discard changes
         *
         * Never confirm routine actions:
         *   • Add to cart (just show a toast)
         *   • Navigate to a page
         *   • Change sort order
         *
         * @public
         */
        onClearCart: function () {
            var oCartModel = this.getModel("cart");

            /**
             * [INTERMEDIATE] CHECKING IF CART IS ALREADY EMPTY
             *
             * Before showing the confirmation dialog, check if there's
             * anything to clear. Asking "Clear your empty cart?" is
             * confusing and unprofessional.
             *
             * [BEST PRACTICE] Always validate preconditions before
             * performing actions. This is "defensive programming" —
             * assume things might not be in the expected state and
             * handle those cases gracefully.
             */
            var aItems = oCartModel.getProperty("/items") || [];

            if (aItems.length === 0) {
                MessageToast.show("Cart is already empty");
                return;
            }

            /**
             * [BEGINNER] MessageBox.confirm() — THE CONFIRMATION DIALOG
             *
             * Parameters:
             *   1. Message text (string) — The question to ask the user
             *   2. Options object:
             *     • title: Dialog title (default: "Confirmation")
             *     • onClose: Callback when the user responds
             *     • actions: Custom button labels (optional)
             *     • emphasizedAction: Which button to highlight (optional)
             *
             * [INTERMEDIATE] CUSTOM ACTIONS
             * You can customize the buttons:
             *   MessageBox.confirm("Clear cart?", {
             *     actions: ["Clear All", MessageBox.Action.CANCEL],
             *     emphasizedAction: "Clear All",
             *     onClose: function (sAction) {
             *       if (sAction === "Clear All") { ... }
             *     }
             *   });
             */
            MessageBox.confirm(
                "Are you sure you want to clear all items from your cart?",
                {
                    title: "Clear Cart",

                    /**
                     * [BEGINNER] onClose CALLBACK
                     *
                     * This function runs AFTER the user clicks OK or Cancel.
                     * The `sAction` parameter tells you which button they chose.
                     *
                     * [GOTCHA] .bind(this) is CRITICAL here. Without it,
                     * `this` inside the callback would NOT be the controller,
                     * and this.getModel("cart") would fail with:
                     *   "TypeError: this.getModel is not a function"
                     *
                     * .bind(this) forces `this` to be the controller instance.
                     */
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            // User confirmed — clear the cart
                            cartHelper.clearCart(oCartModel);
                            MessageToast.show("Cart cleared");
                        }
                        // If user clicked Cancel, do nothing — the dialog
                        // just closes and the cart remains unchanged.
                    }.bind(this)
                }
            );
        }

        /**
         * [ADVANCED] CART PERSISTENCE PATTERNS
         * ════════════════════════════════════
         *
         * Our cart uses a client-side JSONModel, which means:
         *   ❌ Cart is lost on page refresh
         *   ❌ Cart is not shared across devices
         *   ❌ Cart is not visible to the server
         *
         * Production apps solve this with:
         *
         * 1. LOCAL STORAGE — Persist to browser's localStorage:
         *    window.localStorage.setItem("cart", JSON.stringify(cartData));
         *    var cartData = JSON.parse(window.localStorage.getItem("cart"));
         *    Pros: Survives refresh, no server needed
         *    Cons: Device-specific, limited storage, no server visibility
         *
         * 2. SERVER-SIDE CART — POST cart changes to an API:
         *    oModel.create("/Carts", cartData);
         *    Pros: Cross-device, server visibility, persistent
         *    Cons: Network latency, requires backend API
         *
         * 3. SAP COMMERCE CLOUD — Use the commerce cart APIs:
         *    Native support for multi-cart, saved carts, wish lists
         *    The "gold standard" for SAP commerce projects
         */
    });
});
