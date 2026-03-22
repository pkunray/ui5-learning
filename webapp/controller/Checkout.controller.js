/**
 * =============================================================================
 *   FILE: Checkout.controller.js
 *   PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 *   NAMESPACE: com.shopeasy.app.controller
 * =============================================================================
 *
 * [BEGINNER] WHAT IS THE CHECKOUT CONTROLLER?
 * ────────────────────────────────────────────
 * The Checkout controller manages the final step of the shopping flow where
 * the user provides their shipping/contact information and places the order.
 *
 * The checkout page typically includes:
 *   • A form for shipping address (name, address, city, zip, country)
 *   • Contact information (email, phone)
 *   • An order summary (items, quantities, total)
 *   • A "Place Order" button
 *
 * [BEGINNER] KEY CONCEPTS INTRODUCED:
 *   1. LOCAL VIEW MODELS — Creating a JSONModel specific to one view
 *   2. FORM VALIDATION — Checking that all required fields are filled
 *   3. VIEW-LEVEL vs COMPONENT-LEVEL MODELS — Scope and lifecycle
 *   4. FORM RESET — Clearing form data after submission
 *   5. MULTI-STEP USER FLOW — Order → Confirm → Clear → Navigate
 *
 * [INTERMEDIATE] VIEW-LEVEL MODELS vs COMPONENT-LEVEL MODELS
 * ────────────────────────────────────────────────────────────
 * This controller creates a LOCAL model for the checkout form:
 *
 *   Component-level (set in Component.js):
 *     • "cart" model    → Available in ALL views
 *     • "device" model  → Available in ALL views
 *     • "i18n" model    → Available in ALL views
 *     • Default OData   → Available in ALL views
 *
 *   View-level (set in this controller):
 *     • "checkout" model → Available ONLY in the Checkout view
 *       Contains: firstName, lastName, email, phone, address, etc.
 *
 * Why view-level? Because checkout form data is:
 *   • Temporary — only needed during the checkout process
 *   • View-specific — no other view needs access to it
 *   • Disposable — cleared after order placement
 *
 * If we put it on the Component, it would clutter the global model space
 * and persist unnecessarily in memory after the user leaves checkout.
 *
 * [ADVANCED] FORM PATTERNS IN UI5
 * ────────────────────────────────
 * UI5 offers several approaches for forms:
 *
 * 1. SIMPLE FORMS (sap.ui.layout.form.SimpleForm):
 *    Quick forms with automatic label/control layout
 *    <SimpleForm>
 *      <Label text="Name" />
 *      <Input value="{checkout>/firstName}" />
 *    </SimpleForm>
 *
 * 2. SMART FORMS (sap.ui.comp.smartform.SmartForm):
 *    Auto-generated forms from OData annotations
 *    Only available in SAPUI5 (not OpenUI5)
 *
 * 3. CUSTOM FORMS:
 *    Hand-built with Grid/FlexBox layouts
 *    Most flexible, most work
 *
 * For this learning app, we use a simple approach with a JSONModel
 * for form data and manual validation.
 */
sap.ui.define([
    "com/shopeasy/app/controller/BaseController",
    "com/shopeasy/app/model/formatter",
    "com/shopeasy/app/model/cart",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, formatter, cartHelper, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("com.shopeasy.app.controller.Checkout", {

        /**
         * Attach formatter for XML view bindings (order summary, prices)
         */
        formatter: formatter,

        /**
         * ================================================================
         * onInit() — Checkout Page Initialization
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Creates a LOCAL JSONModel for the checkout form and sets it
         * on the view. This model holds all the form field values that
         * the user fills in during checkout.
         *
         * [BEGINNER] CREATING A LOCAL VIEW MODEL
         * ═══════════════════════════════════════
         *
         * var oFormModel = new JSONModel({ firstName: "", lastName: "", ... });
         *
         * This creates a new JSONModel with initial data. Each property
         * corresponds to a form field:
         *
         *   firstName → <Input value="{checkout>/firstName}" />
         *   lastName  → <Input value="{checkout>/lastName}" />
         *   email     → <Input value="{checkout>/email}" type="Email" />
         *   etc.
         *
         * [BEGINNER] TWO-WAY BINDING FOR FORMS
         * ─────────────────────────────────────
         * JSONModel uses Two-Way binding by default, which means:
         *
         *   1. Model → View: Initial empty values are displayed in inputs
         *   2. View → Model: When user types, the model is AUTO-UPDATED
         *
         * So when the user types "John" in the firstName Input, the model
         * automatically updates to { firstName: "John", ... } without
         * any code in the controller!
         *
         * This is why we don't need onChange handlers for each field.
         * We just read the model values when the user clicks "Place Order".
         *
         * [INTERMEDIATE] WHY NOT USE THE ODATA MODEL FOR FORM DATA?
         * ─────────────────────────────────────────────────────────
         * The OData model is for SERVER data (products, categories).
         * Form data is LOCAL — it's typed by the user and only sent to
         * the server when they submit. Using a separate JSONModel:
         *   • Keeps concerns separated (display data vs. input data)
         *   • Avoids "polluting" the OData model with temporary form state
         *   • Makes validation and reset easier
         *   • Avoids accidental OData submitChanges() calls
         */
        onInit: function () {
            /**
             * [BEGINNER] THE FORM DATA MODEL
             *
             * Each property starts as an empty string. This ensures:
             *   1. Input controls show as empty (not "undefined")
             *   2. Validation can check for empty strings
             *   3. The data structure is clear and documented
             *
             * [BEST PRACTICE] Always initialize form models with ALL fields,
             * even if they're empty. This makes the expected structure
             * explicit and prevents "undefined" errors when reading fields
             * that haven't been touched yet.
             *
             * [ANTI-PATTERN] Don't start with an empty object {}:
             *   new JSONModel({})
             * Then getProperty("/firstName") would return undefined,
             * which might cause binding issues or "undefined" text in inputs.
             */
            var oFormModel = new JSONModel({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                zipCode: "",
                country: "",
                messageStripVisible: false,
                messageStripText: "",
                messageStripType: "None"
            });

            /**
             * [BEGINNER] SETTING THE MODEL ON THE VIEW (not Component)
             *
             * this.setModel(oFormModel, "checkout")
             *   → Calls this.getView().setModel(oFormModel, "checkout")
             *   → Makes "checkout" model available ONLY in this view
             *
             * In the XML view, controls bind to it with the "checkout>" prefix:
             *   <Input value="{checkout>/firstName}" />
             *   <Input value="{checkout>/email}" />
             *
             * [INTERMEDIATE] LIFECYCLE CONSIDERATION:
             * This model is created in onInit(), which runs ONCE when the
             * view is first created. If the user navigates away and back:
             *
             *   Scenario A (view is cached — default behavior):
             *     → onInit is NOT called again
             *     → The form retains previously entered data
             *     → You might want to reset it in _onRouteMatched
             *
             *   Scenario B (view is recreated — if configured):
             *     → onInit IS called again
             *     → A fresh model is created
             *     → Form starts empty
             *
             * [BEST PRACTICE] If the form should always start fresh,
             * attach a routeMatched handler and call _resetForm() there.
             */
            this.setModel(oFormModel, "checkout");
        },

        /**
         * ================================================================
         * onPlaceOrder() — Submit the Order
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Called when the user clicks the "Place Order" button. This
         * method validates all form fields, and if everything is valid:
         *   1. Shows a success confirmation dialog
         *   2. Clears the shopping cart
         *   3. Resets the form
         *   4. Navigates to the home page
         *
         * If validation fails, shows an error message.
         *
         * [BEGINNER] THE ORDER FLOW:
         *
         *   User fills form → Clicks "Place Order"
         *                         ↓
         *                   Validate form
         *                    ↓           ↓
         *                 VALID        INVALID
         *                  ↓              ↓
         *            Show success    Show error
         *            Clear cart      (User fixes form)
         *            Reset form
         *            Navigate home
         *
         * [INTERMEDIATE] IN A REAL APP:
         * Instead of just showing a success message, you'd:
         *   1. Create an Order entity on the server via OData:
         *      this.getModel().create("/Orders", orderData, {
         *        success: function () { ... },
         *        error: function () { ... }
         *      });
         *   2. Handle server errors (validation, payment failure)
         *   3. Navigate to an Order Confirmation page (not home)
         *   4. Send a confirmation email
         *   5. Generate an order number
         *
         * [ADVANCED] For OData v2, creating entities with related items
         * (order header + line items) requires "deep insert" or batch
         * operations. This is a complex topic — see SAP documentation on
         * OData deep insert and changeset handling.
         *
         * @public
         */
        onPlaceOrder: function () {
            /**
             * [BEGINNER] STEP 1: VALIDATE THE FORM
             *
             * Call _validateForm() to check all required fields.
             * If it returns false, we show an error and stop.
             */
            if (!this._validateForm()) {
                /**
                 * [BEGINNER] MessageBox.error() — SHOWING AN ERROR DIALOG
                 *
                 * Unlike MessageToast (which auto-dismisses), MessageBox.error
                 * shows a modal dialog that REQUIRES the user to click Close.
                 *
                 * Use MessageBox.error for validation errors because:
                 *   • The user MUST acknowledge the error
                 *   • The dialog stays on screen until dismissed
                 *   • It's clearly an "error" state (red icon)
                 *
                 * [INTERMEDIATE] You could also use MessageStrip instead of
                 * MessageBox for inline validation feedback:
                 *
                 *   <MessageStrip
                 *     text="Please fill in all required fields"
                 *     type="Error"
                 *     visible="{checkout>/hasErrors}"
                 *   />
                 *
                 * MessageStrip stays visible in the form (not a popup),
                 * which is better UX for form validation because the user
                 * can see both the error message AND the form fields.
                 */
                MessageBox.error(
                    "Please fill in all required fields before placing your order.",
                    { title: "Validation Error" }
                );
                return;
            }

            /**
             * [BEGINNER] STEP 2: CHECK CART HAS ITEMS
             *
             * Don't allow placing an empty order!
             */
            var oCartModel = this.getModel("cart");
            var aItems = oCartModel.getProperty("/items") || [];

            if (aItems.length === 0) {
                MessageBox.warning(
                    "Your cart is empty. Please add items before checkout.",
                    { title: "Empty Cart" }
                );
                return;
            }

            /**
             * [BEGINNER] STEP 3: SHOW SUCCESS CONFIRMATION
             *
             * MessageBox.success() shows a green-themed dialog with an
             * OK button. We use the onClose callback to perform cleanup
             * actions AFTER the user acknowledges the success.
             *
             * [INTERMEDIATE] WHY CLEANUP IN THE CALLBACK?
             * We want the user to SEE the success message before we
             * navigate them away. If we cleared the cart and navigated
             * immediately (before showing the dialog), the user would
             * never see the confirmation.
             *
             * Flow: Show success → User clicks OK → Clear cart → Navigate
             *
             * [ADVANCED] In a real app, the order would be submitted to
             * the server BEFORE showing the success message. You'd only
             * show success after the server confirms the order:
             *
             *   this.getModel().create("/Orders", oOrderData, {
             *     success: function (oCreatedOrder) {
             *       MessageBox.success("Order #" + oCreatedOrder.OrderId);
             *       cartHelper.clearCart(oCartModel);
             *       this.navTo("orderConfirmation", {
             *         orderId: oCreatedOrder.OrderId
             *       });
             *     }.bind(this),
             *     error: function (oError) {
             *       MessageBox.error("Failed to place order. Please try again.");
             *     }
             *   });
             */
            var fTotal = cartHelper.getTotal(oCartModel);

            MessageBox.success(
                "Your order has been placed successfully!\n\n" +
                "Order Total: $" + fTotal.toFixed(2) + "\n" +
                "Items: " + aItems.length + "\n\n" +
                "Thank you for shopping with ShopEasy!",
                {
                    title: "Order Confirmed",
                    onClose: function () {
                        // Clear the cart — order is placed, items are no longer needed
                        cartHelper.clearCart(oCartModel);

                        // Reset the form — clear all entered data
                        this._resetForm();

                        // Navigate to home page
                        // Use bReplace = true to prevent the user from pressing
                        // Back and returning to checkout (which would show an
                        // empty form for a completed order — confusing!)
                        this.navTo("home", {}, true);
                    }.bind(this)
                }
            );
        },

        /**
         * ================================================================
         * _validateForm() — Check All Required Fields
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Checks that all required form fields have been filled in.
         * Returns true if the form is valid, false otherwise.
         *
         * [BEGINNER] THE VALIDATION APPROACH:
         * For each required field, we check if the value is a non-empty
         * string (after trimming whitespace). A field with only spaces
         * ("   ") is considered empty.
         *
         * [INTERMEDIATE] VALIDATION APPROACHES IN UI5:
         *
         * 1. MANUAL VALIDATION (this approach):
         *    Read model properties, check them in JavaScript.
         *    Pros: Full control, easy to understand
         *    Cons: Must maintain validation logic manually
         *
         * 2. UI5 TYPE VALIDATION:
         *    Use binding types that validate automatically:
         *    <Input value="{
         *      path: 'checkout>/email',
         *      type: 'sap.ui.model.type.String',
         *      constraints: { minLength: 1 }
         *    }" />
         *    Pros: Declarative, automatic error display
         *    Cons: Limited to type constraints
         *
         * 3. sap.ui.core.message.MessageManager:
         *    UI5's built-in validation framework. Manages validation
         *    messages and can highlight invalid controls.
         *    Pros: Integrated with UI5 controls, per-field error states
         *    Cons: More complex setup
         *
         * [BEST PRACTICE] For production apps, use MessageManager with
         * UI5 type constraints. For learning/prototyping, manual
         * validation is perfectly fine and more transparent.
         *
         * [GOTCHA] trim() removes whitespace from both ends of a string.
         * Without it, a field containing only spaces ("   ") would pass
         * validation — the user typed SOMETHING, but nothing meaningful.
         *
         * @private
         * @returns {boolean} true if all required fields are filled
         */
        _validateForm: function () {
            var oFormModel = this.getModel("checkout");

            /**
             * [BEGINNER] READING FORM VALUES FROM THE MODEL
             *
             * Thanks to Two-Way binding, the model is already updated
             * with whatever the user typed. We just read the values:
             *
             *   oFormModel.getProperty("/firstName")
             *     → Returns whatever is in the firstName Input field
             *
             * No need to read from DOM elements (like document.getElementById)
             * or from controls (like this.byId("firstNameInput").getValue()).
             * The model IS the source of truth.
             *
             * [INTERMEDIATE] This is a major advantage of data binding:
             * the form state is centralized in the model. You read from
             * ONE place (the model) instead of querying multiple controls.
             */
            var aRequiredFields = [
                "/firstName",
                "/lastName",
                "/email",
                "/address",
                "/city",
                "/zipCode",
                "/country"
            ];

            /**
             * [BEGINNER] CHECKING EACH REQUIRED FIELD
             *
             * We loop through all required field paths and check if
             * each one has a non-empty value. If ANY field is empty,
             * the form is invalid.
             *
             * [INTERMEDIATE] Array.every() returns true only if the
             * callback returns true for EVERY element. It short-circuits
             * on the first false (stops checking remaining elements).
             *
             *   [true, true, true].every(x => x)   → true
             *   [true, false, true].every(x => x)   → false (stops at index 1)
             */
            var bIsValid = aRequiredFields.every(function (sPath) {
                var sValue = oFormModel.getProperty(sPath);
                return sValue && sValue.trim().length > 0;
            });

            return bIsValid;
        },

        /**
         * ================================================================
         * _resetForm() — Clear All Form Fields
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Resets all form fields to empty strings. Called after a
         * successful order placement to clear the form.
         *
         * [BEGINNER] HOW IT WORKS:
         * Since the form fields are bound to the "checkout" model via
         * Two-Way binding, we just need to reset the model data. The
         * Input controls will automatically clear themselves because
         * their bound values changed to empty strings.
         *
         *   Model: { firstName: "John" }  →  { firstName: "" }
         *   Input: Shows "John"           →  Shows "" (empty)
         *
         * [INTERMEDIATE] TWO APPROACHES TO RESET:
         *
         * Approach A — setProperty for each field:
         *   oModel.setProperty("/firstName", "");
         *   oModel.setProperty("/lastName", "");
         *   oModel.setProperty("/email", "");
         *   ... (verbose but precise — each field fires its own event)
         *
         * Approach B — setData to replace everything (used here):
         *   oModel.setData({ firstName: "", lastName: "", ... });
         *   ... (concise — replaces entire model, fires one batch update)
         *
         * Approach B is cleaner for "reset all" scenarios. Approach A is
         * better when you want to reset only SOME fields.
         *
         * [GOTCHA] setData REPLACES the entire model. If you added extra
         * properties at runtime (like "hasErrors" for validation state),
         * they'd be lost. Make sure your reset data includes ALL properties
         * the view needs.
         *
         * @private
         */
        _resetForm: function () {
            var oFormModel = this.getModel("checkout");

            oFormModel.setData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                zipCode: "",
                country: ""
            });
        },

        onWizardComplete: function () {},
        onShippingStepActivate: function () {},
        onFormFieldChange: function () {},
        onPaymentStepActivate: function () {},
        onPaymentMethodSelect: function () {},
        onSummaryStepActivate: function () {},

        /**
         * ================================================================
         * onNavBack() — Navigate Back to Cart
         * ================================================================
         *
         * [BEGINNER] PURPOSE:
         * Navigates back to the cart page. We override onNavBack() to
         * go specifically to the cart, since that's the logical "parent"
         * page in the checkout flow.
         *
         * [BEGINNER] NAVIGATION HIERARCHY:
         *   Home → [Browse] → Cart → Checkout
         *                              ↑ YOU ARE HERE
         *                              ↓ Back goes to Cart
         *                            Cart
         *
         * [INTERMEDIATE] UNSAVED DATA WARNING
         * In a production app, you might want to warn the user if they
         * have unsaved form data:
         *
         *   onNavBack: function () {
         *     if (this._hasUnsavedData()) {
         *       MessageBox.confirm("Discard your checkout information?", {
         *         onClose: function (sAction) {
         *           if (sAction === MessageBox.Action.OK) {
         *             this._resetForm();
         *             this.navTo("cart");
         *           }
         *         }.bind(this)
         *       });
         *     } else {
         *       this.navTo("cart");
         *     }
         *   }
         *
         * [BEST PRACTICE] For non-trivial forms, always consider the
         * "Back" scenario. Users may accidentally press Back and lose
         * their input. A simple confirmation dialog prevents frustration.
         *
         * @public
         */
        onNavBack: function () {
            this.navTo("cart");
        }

        /**
         * [ADVANCED] CHECKOUT ARCHITECTURE IN PRODUCTION
         * ═══════════════════════════════════════════════
         *
         * A real checkout flow might include:
         *
         * 1. MULTI-STEP WIZARD (sap.m.Wizard):
         *    Step 1: Shipping Address
         *    Step 2: Payment Method
         *    Step 3: Order Review
         *    Step 4: Confirmation
         *
         * 2. PAYMENT INTEGRATION:
         *    • Credit card form (PCI compliance!)
         *    • PayPal, Apple Pay, Google Pay
         *    • SAP Digital Payments integration
         *
         * 3. ADDRESS VALIDATION:
         *    • Verify address via geocoding API
         *    • Auto-complete with suggestions
         *    • International format support
         *
         * 4. ORDER CREATION:
         *    • OData deep insert (Order + OrderItems in one request)
         *    • Inventory check before confirming
         *    • Price recalculation on server
         *    • Coupon/discount application
         *
         * 5. ERROR HANDLING:
         *    • Payment declined
         *    • Item out of stock
         *    • Server timeout
         *    • Network failure during order creation
         *
         * 6. POST-ORDER:
         *    • Email confirmation
         *    • Order tracking page
         *    • PDF invoice generation
         *
         * This controller implements a simplified version for learning.
         * Each of these areas could be its own chapter in a UI5 course!
         */
    });
});
