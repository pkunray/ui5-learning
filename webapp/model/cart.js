/**
 * ============================================================================
 * FILE: cart.js — Shopping Cart Helper Module
 * NAMESPACE: com.shopeasy.app.model
 * ============================================================================
 *
 * [BEGINNER] WHAT IS THIS FILE?
 * -----------------------------------------------------------------------
 * This is a UTILITY MODULE (sometimes called a "helper" or "service")
 * that encapsulates all the logic for manipulating a shopping cart. It
 * provides functions like addItem, removeItem, updateQuantity, etc.
 *
 * The cart data itself lives in a JSONModel. This module doesn't OWN the
 * model — instead, each function RECEIVES the cart model as a parameter
 * and manipulates its data. This design pattern makes the module:
 *   • Testable — you can create a mock JSONModel in tests
 *   • Reusable — any controller can use it without inheritance
 *   • Decoupled — the module doesn't know about controllers or views
 *
 * [BEGINNER] WHY NOT PUT THIS LOGIC IN THE CONTROLLER?
 * -----------------------------------------------------------------------
 * You COULD put addItem/removeItem logic directly in your controller's
 * event handlers. But that leads to problems:
 *
 *   1. DUPLICATION — If both ProductDetail.controller.js and
 *      ProductList.controller.js have "add to cart" buttons, you'd
 *      duplicate the logic in both controllers.
 *
 *   2. FAT CONTROLLERS — Controllers should be thin: handle UI events,
 *      delegate to helpers, update the view. Business logic (like
 *      "check if item already exists, then merge quantities") belongs
 *      in a dedicated module.
 *
 *   3. TESTING — Controller methods often depend on the view, router,
 *      and other UI5 infrastructure. A standalone module with simple
 *      function signatures is MUCH easier to unit test.
 *
 * [BEGINNER] THE CART DATA STRUCTURE
 * -----------------------------------------------------------------------
 * The cart model is expected to have this structure:
 *
 *   {
 *     "items": [
 *       {
 *         "productId": "P001",
 *         "name": "Wireless Mouse",
 *         "price": 29.99,
 *         "quantity": 2,
 *         "imageUrl": "images/products/mouse.jpg"
 *       },
 *       {
 *         "productId": "P002",
 *         "name": "USB-C Hub",
 *         "price": 49.99,
 *         "quantity": 1,
 *         "imageUrl": "images/products/hub.jpg"
 *       }
 *     ],
 *     "totalPrice": 109.97,
 *     "itemCount": 3
 *   }
 *
 * [BEGINNER] HOW TO USE THIS MODULE IN A CONTROLLER
 * -----------------------------------------------------------------------
 *
 *   sap.ui.define([
 *     "sap/ui/core/mvc/Controller",
 *     "com/shopeasy/app/model/cart"       // ← import the cart helper
 *   ], function (Controller, cartHelper) {
 *
 *     return Controller.extend("com.shopeasy.app.controller.ProductDetail", {
 *
 *       onAddToCart: function () {
 *         var oCartModel = this.getOwnerComponent().getModel("cart");
 *         var oProduct = this.getView().getBindingContext().getObject();
 *
 *         // Delegate to the cart helper — no business logic in controller!
 *         cartHelper.addItem(oCartModel, oProduct, 1);
 *
 *         // Show a success message
 *         sap.m.MessageToast.show(oProduct.name + " added to cart!");
 *       }
 *     });
 *   });
 *
 * ============================================================================
 *
 * [INTERMEDIATE] JSONModel MANIPULATION PATTERNS
 * ============================================================================
 * Throughout this file, you'll see three key patterns for working with
 * JSONModel data. Understanding these is crucial for any UI5 developer:
 *
 * PATTERN 1: getProperty / setProperty
 * -----------------------------------------------------------------------
 *   var aItems = oModel.getProperty("/items");     // READ
 *   oModel.setProperty("/totalPrice", 99.99);      // WRITE
 *
 *   - getProperty returns the raw JS value (string, number, array, object)
 *   - setProperty updates the value AND fires change events so bound
 *     controls update automatically
 *   - Paths start with "/" for absolute paths from the model root
 *   - You can navigate into nested objects: "/items/0/name" gets the
 *     name of the first item
 *
 * PATTERN 2: getData / setData
 * -----------------------------------------------------------------------
 *   var oAllData = oModel.getData();    // Gets the ENTIRE model object
 *   oModel.setData({ items: [] });      // REPLACES the entire model
 *
 *   - getData returns a REFERENCE to the internal data object, NOT a copy
 *   - Modifying the returned object DOES change the model's data
 *   - BUT it does NOT fire change events! You must call refresh() after
 *   - setData replaces everything — use with caution
 *
 * PATTERN 3: refresh()
 * -----------------------------------------------------------------------
 *   oModel.refresh(true);
 *
 *   - Forces ALL bindings to re-read from the model
 *   - The `true` parameter means "force update" — even if the model
 *     thinks nothing changed, it re-evaluates all bindings
 *   - Necessary when you modify data via getData() + direct mutation
 *   - NOT necessary after setProperty() (it auto-fires events)
 *
 * [GOTCHA] THE BIGGEST JSONModel TRAP:
 *
 *   // This WORKS — UI updates automatically:
 *   oModel.setProperty("/items", newItemsArray);
 *
 *   // This DOES NOT update UI:
 *   var items = oModel.getProperty("/items");
 *   items.push(newItem);     // ← mutated the array directly
 *   // The model doesn't know the array changed!
 *
 *   // FIX — tell the model to refresh:
 *   var items = oModel.getProperty("/items");
 *   items.push(newItem);
 *   oModel.refresh(true);    // ← NOW the UI updates
 *
 *   // ALTERNATIVE FIX — use setProperty to replace the array:
 *   var items = oModel.getProperty("/items");
 *   items.push(newItem);
 *   oModel.setProperty("/items", items);  // ← triggers change event
 *
 * ============================================================================
 */
sap.ui.define(
	[
		// [BEGINNER] No external dependencies needed for this module!
		// We only work with the JSONModel that gets passed in as a
		// parameter. The JSONModel class itself doesn't need to be
		// imported here because we receive already-created instances.
		//
		// [INTERMEDIATE] This is a deliberate design choice. By not
		// importing JSONModel, this module has ZERO dependencies, which
		// makes it:
		//   • Faster to load (no dependency resolution)
		//   • Easier to test (no mocking needed)
		//   • More portable (could work with any model-like object)
	],

	/**
	 * Module factory function.
	 * No parameters because we declared no dependencies.
	 *
	 * @returns {object} Cart helper object with cart manipulation functions
	 */
	function () {
		"use strict";

		// =================================================================
		// PRIVATE HELPER FUNCTIONS
		// =================================================================
		//
		// [BEGINNER] Functions defined here (outside the returned object)
		// are PRIVATE. They can't be accessed by other modules. Only the
		// functions in the returned object are public.
		//
		// [BEST PRACTICE] Prefix private functions with underscore (_)
		// as a naming convention, even though JavaScript doesn't enforce
		// access modifiers. The underscore signals to other developers:
		// "this is an internal implementation detail, don't depend on it."

		/**
		 * ============================================================
		 * _findItemIndex (PRIVATE)
		 * ============================================================
		 *
		 * [BEGINNER] Searches the cart items array for a product with
		 * the given ID and returns its array index. Returns -1 if not
		 * found (following the JavaScript convention of Array.indexOf).
		 *
		 * This is used internally by addItem, removeItem, and
		 * updateQuantity to locate an item before modifying it.
		 *
		 * @private
		 * @param {Array} aItems - The cart items array
		 * @param {string} sProductId - The product ID to search for
		 * @returns {number} Index of the item, or -1 if not found
		 */
		function _findItemIndex(aItems, sProductId) {
			// [BEGINNER] We loop through the array checking each item's
			// productId. This is a linear search — O(n) time complexity.
			//
			// [ADVANCED] For very large carts (unlikely in practice),
			// you could use a Map keyed by productId for O(1) lookups.
			// But carts rarely have more than 20-30 items, so a simple
			// loop is perfectly fine and more readable.
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].productId === sProductId) {
					return i;
				}
			}
			return -1;
		}

		/**
		 * ============================================================
		 * _recalculateTotal (PRIVATE)
		 * ============================================================
		 *
		 * [BEGINNER] PURPOSE:
		 * Recalculates the total price and item count from the current
		 * items array and updates the model. This is called after every
		 * cart modification (add, remove, update quantity, clear).
		 *
		 * [BEGINNER] WHY A SEPARATE FUNCTION?
		 * Every cart operation (add, remove, update) needs to recalculate
		 * the total. By extracting this into a helper function, we avoid
		 * duplicating the calculation logic in every public function.
		 * This is the DRY principle: Don't Repeat Yourself.
		 *
		 * [INTERMEDIATE] DESIGN DECISION: COMPUTED vs STORED TOTALS
		 * There are two approaches:
		 *
		 * A) Compute on-the-fly with a formatter (see formatter.js):
		 *    Pros: Always accurate, no sync issues
		 *    Cons: Recalculates on every binding update, can be slow
		 *
		 * B) Store in the model (this approach):
		 *    Pros: Fast reads, no recalculation on display
		 *    Cons: Must remember to update after every change
		 *
		 * We use approach B here because the cart total is shown in
		 * multiple places (header badge, cart page, checkout), and
		 * recalculating for each binding would be wasteful.
		 *
		 * [GOTCHA] If you forget to call _recalculateTotal after modifying
		 * items, the displayed total will be STALE (wrong). This is the
		 * main risk of approach B. Every public function in this module
		 * calls _recalculateTotal at the end to prevent this.
		 *
		 * @private
		 * @param {sap.ui.model.json.JSONModel} oCartModel - The cart model
		 */
		function _recalculateTotal(oCartModel) {
			var aItems = oCartModel.getProperty("/items") || [];

			// Calculate total price: sum of (price × quantity) for each item
			var fTotalPrice = aItems.reduce(function (fSum, oItem) {
				return fSum + (parseFloat(oItem.price) || 0) * (parseInt(oItem.quantity, 10) || 0);
			}, 0);

			// Calculate total item count: sum of all quantities
			// (A cart with 2 mice and 1 keyboard = 3 items total)
			var iTotalCount = aItems.reduce(function (iSum, oItem) {
				return iSum + (parseInt(oItem.quantity, 10) || 0);
			}, 0);

			// [BEGINNER] setProperty updates the model AND fires change
			// events. Bound controls (like a cart badge showing the count)
			// will update automatically after these calls.
			//
			// [INTERMEDIATE] We use setProperty for individual values
			// rather than setData to replace everything. This is more
			// surgical — only bindings that reference "/totalPrice" or
			// "/itemCount" will re-evaluate, not ALL bindings on the model.
			oCartModel.setProperty("/totalPrice", Math.round(fTotalPrice * 100) / 100);
			oCartModel.setProperty("/itemCount", iTotalCount);
		}

		// =================================================================
		// PUBLIC API
		// =================================================================
		return {

			/**
			 * ============================================================
			 * addItem(cartModel, product, quantity)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Adds a product to the shopping cart. If the product is
			 * ALREADY in the cart, it increments the quantity instead of
			 * adding a duplicate entry.
			 *
			 * [BEGINNER] EXAMPLE USAGE IN A CONTROLLER:
			 *
			 *   // In ProductDetail.controller.js
			 *   onAddToCartPress: function () {
			 *     var oCartModel = this.getOwnerComponent().getModel("cart");
			 *     var oProduct = this.getView().getBindingContext().getObject();
			 *     var iQuantity = this.byId("quantityInput").getValue();
			 *
			 *     cartHelper.addItem(oCartModel, oProduct, iQuantity);
			 *     sap.m.MessageToast.show("Added to cart!");
			 *   }
			 *
			 * [BEGINNER] STEP-BY-STEP WHAT HAPPENS:
			 *   1. Get the current items array from the model
			 *   2. Check if this product is already in the cart
			 *   3a. If YES → increase the quantity of the existing entry
			 *   3b. If NO  → add a new entry to the items array
			 *   4. Recalculate the cart total
			 *   5. Refresh the model so all bound UI controls update
			 *
			 * [INTERMEDIATE] WHY WE MERGE DUPLICATES:
			 * If a user adds "Wireless Mouse" twice (once from the list
			 * page, once from the detail page), they expect to see ONE
			 * line item with quantity=2, not TWO separate entries.
			 * This is standard e-commerce UX.
			 *
			 * [BEST PRACTICE] Default parameter values: if `iQuantity`
			 * is not provided, we default to 1. This makes the common
			 * case (adding one item) simple:
			 *   cartHelper.addItem(oCartModel, oProduct);  // quantity = 1
			 *
			 * @public
			 * @param {sap.ui.model.json.JSONModel} oCartModel - The cart model
			 * @param {object} oProduct - Product object with at least:
			 *   { productId: string, name: string, price: number, imageUrl: string }
			 * @param {number} [iQuantity=1] - Number of items to add
			 */
			addItem: function (oCartModel, oProduct, iQuantity) {
				// Default quantity to 1 if not provided or invalid
				iQuantity = parseInt(iQuantity, 10) || 1;

				// [BEGINNER] Step 1: Get the current items array.
				// getProperty("/items") returns the array stored at the
				// root-level "items" key. If the cart is brand new and
				// has no items property yet, we default to an empty array.
				//
				// [GOTCHA] getProperty returns a REFERENCE to the actual
				// array inside the model, not a copy. So when we push to
				// this array, we're modifying the model's internal data
				// directly. This is intentional here, but it means we
				// MUST call refresh() afterwards to notify the UI.
				var aItems = oCartModel.getProperty("/items") || [];

				// Step 2: Check if this product is already in the cart
				var iExistingIndex = _findItemIndex(aItems, oProduct.productId);

				if (iExistingIndex >= 0) {
					// -------------------------------------------------
					// Case A: Product ALREADY exists → merge quantities
					// -------------------------------------------------
					// [BEGINNER] We use setProperty with an indexed path
					// to update just the quantity of the specific item.
					// The path "/items/2/quantity" means: items array →
					// index 2 → quantity property.
					//
					// [INTERMEDIATE] We could also do:
					//   aItems[iExistingIndex].quantity += iQuantity;
					//   oCartModel.refresh(true);
					//
					// But setProperty is preferred because:
					//   1. It fires a change event for that specific path
					//   2. Only controls bound to that path will re-render
					//   3. It's more "UI5-idiomatic"
					var iCurrentQty = aItems[iExistingIndex].quantity;
					oCartModel.setProperty(
						"/items/" + iExistingIndex + "/quantity",
						iCurrentQty + iQuantity
					);
				} else {
					// -------------------------------------------------
					// Case B: New product → add a new item entry
					// -------------------------------------------------
					// [BEGINNER] We create a new object with just the
					// properties the cart needs. We don't store the
					// entire product object because:
					//   1. The cart doesn't need all product fields
					//      (description, reviews, specs, etc.)
					//   2. Keeping it slim reduces memory usage
					//   3. It's a clear contract: cart items have exactly
					//      these fields
					var oCartItem = {
						productId: oProduct.productId,
						name: oProduct.name,
						price: parseFloat(oProduct.price) || 0,
						quantity: iQuantity,
						imageUrl: oProduct.imageUrl || ""
					};

					// [BEGINNER] Push the new item onto the array.
					// Remember: aItems is a REFERENCE to the model's
					// internal array, so this push modifies the model.
					aItems.push(oCartItem);

					// [INTERMEDIATE] After mutating the array directly
					// (via push), we must use setProperty or refresh to
					// tell the model that the data changed. Using
					// setProperty with the same array is the cleanest:
					oCartModel.setProperty("/items", aItems);
				}

				// Step 3: Recalculate totals
				_recalculateTotal(oCartModel);

				// [BEGINNER] Step 4: refresh(true) forces the model to
				// notify ALL bindings to re-read their values.
				//
				// We call this as a safety net to ensure everything is
				// in sync, even if we already used setProperty above.
				// The `true` parameter means "force update" — even
				// bindings that think they're current will re-evaluate.
				//
				// [GOTCHA] Calling refresh too often (e.g., in a tight
				// loop) can cause performance issues because every
				// single binding re-evaluates. For batch operations
				// (like adding 10 items at once), do all mutations
				// first, then call refresh ONCE at the end.
				oCartModel.refresh(true);
			},

			/**
			 * ============================================================
			 * removeItem(cartModel, productId)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Removes an item from the cart entirely, regardless of its
			 * quantity. If the item doesn't exist, nothing happens.
			 *
			 * [BEGINNER] EXAMPLE USAGE IN A CONTROLLER:
			 *
			 *   // In Cart.controller.js
			 *   onDeleteItem: function (oEvent) {
			 *     var oCartModel = this.getView().getModel("cart");
			 *
			 *     // Get the product ID from the item's binding context
			 *     var sProductId = oEvent.getSource()
			 *       .getBindingContext("cart")
			 *       .getProperty("productId");
			 *
			 *     cartHelper.removeItem(oCartModel, sProductId);
			 *     sap.m.MessageToast.show("Item removed from cart");
			 *   }
			 *
			 * [BEGINNER] WHAT HAPPENS STEP-BY-STEP:
			 *   1. Get the current items array
			 *   2. Find the item by productId
			 *   3. Remove it from the array using splice
			 *   4. Update the model and recalculate totals
			 *
			 * [INTERMEDIATE] Array.splice() vs Array.filter():
			 *
			 *   splice: Modifies the array IN PLACE (mutates original)
			 *     aItems.splice(index, 1);  // removes 1 element at index
			 *
			 *   filter: Creates a NEW array (doesn't mutate original)
			 *     aItems = aItems.filter(item => item.productId !== id);
			 *
			 * We use splice + setProperty here. filter would also work
			 * but would create a new array reference, which is fine with
			 * setProperty since it replaces the value entirely.
			 *
			 * [BEST PRACTICE] Always validate inputs. If productId is
			 * undefined (bug in calling code), fail gracefully rather
			 * than silently corrupting the cart data.
			 *
			 * @public
			 * @param {sap.ui.model.json.JSONModel} oCartModel - The cart model
			 * @param {string} sProductId - The ID of the product to remove
			 */
			removeItem: function (oCartModel, sProductId) {
				if (!sProductId) {
					// [BEST PRACTICE] Log a warning for debugging, but
					// don't crash the app. The user shouldn't see errors
					// for what's likely a programming mistake.
					// jQuery.sap.log.warning is the UI5 way to log;
					// console.warn works too but jQuery.sap.log integrates
					// with UI5's support tools.
					return;
				}

				var aItems = oCartModel.getProperty("/items") || [];
				var iIndex = _findItemIndex(aItems, sProductId);

				if (iIndex >= 0) {
					// [BEGINNER] splice(index, deleteCount) removes
					// `deleteCount` elements starting at `index`.
					// splice(2, 1) removes 1 element at position 2.
					//
					// Before: ["A", "B", "C", "D"]
					// splice(1, 1)
					// After:  ["A", "C", "D"]
					//
					// splice MUTATES the original array (doesn't create
					// a new one), so `aItems` is already modified.
					aItems.splice(iIndex, 1);

					// [INTERMEDIATE] After splicing, we use setProperty
					// to write the modified array back. Technically the
					// model already has the updated array (since aItems
					// is a reference), but setProperty ensures the model
					// fires change events for the "/items" path.
					//
					// [GOTCHA] If we only did `aItems.splice(...)` without
					// setProperty or refresh, the UI would still show the
					// old list! The model doesn't watch its internal data
					// for changes — you must tell it explicitly.
					oCartModel.setProperty("/items", aItems);

					_recalculateTotal(oCartModel);
					oCartModel.refresh(true);
				}
				// [BEGINNER] If iIndex === -1 (item not found), we do
				// nothing. This is a "fail silently" approach — the user
				// might have double-clicked the delete button, so the
				// item was already removed on the first click.
			},

			/**
			 * ============================================================
			 * updateQuantity(cartModel, productId, newQuantity)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Changes the quantity of an existing cart item. This is
			 * typically triggered by a StepInput or Input control in the
			 * cart view where the user can type or click +/- to change
			 * how many of an item they want.
			 *
			 * [BEGINNER] EXAMPLE USAGE IN A CONTROLLER:
			 *
			 *   // In Cart.controller.js — event handler for quantity change
			 *   onQuantityChange: function (oEvent) {
			 *     var oCartModel = this.getView().getModel("cart");
			 *     var oContext = oEvent.getSource().getBindingContext("cart");
			 *     var sProductId = oContext.getProperty("productId");
			 *     var iNewQuantity = oEvent.getParameter("value");
			 *
			 *     cartHelper.updateQuantity(oCartModel, sProductId, iNewQuantity);
			 *   }
			 *
			 * [BEGINNER] SPECIAL BEHAVIOR:
			 *   • If newQuantity <= 0, the item is REMOVED from the cart.
			 *     This is intuitive: setting quantity to 0 means "I don't
			 *     want this anymore."
			 *   • If the product isn't found, nothing happens.
			 *
			 * [INTERMEDIATE] This function delegates to removeItem when
			 * quantity is 0, following the DRY principle. The remove
			 * logic only exists in one place.
			 *
			 * @public
			 * @param {sap.ui.model.json.JSONModel} oCartModel - The cart model
			 * @param {string} sProductId - The ID of the product to update
			 * @param {number} iNewQuantity - The new quantity (0 or negative
			 *        removes the item)
			 */
			updateQuantity: function (oCartModel, sProductId, iNewQuantity) {
				iNewQuantity = parseInt(iNewQuantity, 10);

				// [BEGINNER] If the new quantity is 0 or negative (or NaN
				// from bad input), treat it as a removal request.
				if (!iNewQuantity || iNewQuantity <= 0) {
					this.removeItem(oCartModel, sProductId);
					return;
				}

				var aItems = oCartModel.getProperty("/items") || [];
				var iIndex = _findItemIndex(aItems, sProductId);

				if (iIndex >= 0) {
					// [BEGINNER] setProperty with an indexed path updates
					// just that one value. The path breakdown:
					//   "/items"     → the items array
					//   "/3"         → index 3 in that array
					//   "/quantity"  → the quantity property of that item
					//
					// Result: Only the quantity of item at index 3 changes.
					// UI5 fires a change event only for that specific path,
					// so only controls bound to that item's quantity will
					// re-render. This is efficient!
					//
					// [INTERMEDIATE] Compare this to:
					//   aItems[iIndex].quantity = iNewQuantity;
					//   oCartModel.refresh(true);
					//
					// The refresh approach re-evaluates ALL bindings on
					// the model. setProperty is more surgical and
					// performant, but we still call refresh at the end
					// as a safety net.
					oCartModel.setProperty(
						"/items/" + iIndex + "/quantity",
						iNewQuantity
					);

					_recalculateTotal(oCartModel);
					oCartModel.refresh(true);
				}
			},

			/**
			 * ============================================================
			 * getTotal(cartModel)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Returns the current total price of the cart. This reads the
			 * pre-calculated total from the model (which is kept up to
			 * date by _recalculateTotal).
			 *
			 * [BEGINNER] EXAMPLE USAGE IN A CONTROLLER:
			 *
			 *   var fTotal = cartHelper.getTotal(oCartModel);
			 *   if (fTotal > 100) {
			 *     sap.m.MessageToast.show("You qualify for free shipping!");
			 *   }
			 *
			 * [INTERMEDIATE] WHY READ FROM MODEL INSTEAD OF CALCULATING?
			 * We already store the total in the model (updated after every
			 * cart operation). Reading it is an O(1) operation. Recalculating
			 * from scratch would be O(n) where n = number of items.
			 *
			 * For a shopping cart this performance difference is negligible,
			 * but the pattern is important: store derived values in the
			 * model when they're needed in multiple places and the source
			 * data changes infrequently relative to reads.
			 *
			 * [GOTCHA] If someone modifies the items array WITHOUT going
			 * through this module (e.g., directly via oModel.setProperty),
			 * the total will be stale. Always use this module's functions
			 * to modify cart data.
			 *
			 * @public
			 * @param {sap.ui.model.json.JSONModel} oCartModel - The cart model
			 * @returns {number} The total price of all items in the cart
			 */
			getTotal: function (oCartModel) {
				return oCartModel.getProperty("/totalPrice") || 0;
			},

			/**
			 * ============================================================
			 * getItemCount(cartModel)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Returns the total number of items in the cart (sum of all
			 * quantities). Used for displaying a badge/counter on the
			 * cart icon in the header.
			 *
			 * [BEGINNER] EXAMPLE USAGE IN A CONTROLLER:
			 *
			 *   // Update the cart icon badge
			 *   var iCount = cartHelper.getItemCount(oCartModel);
			 *   this.byId("cartButton").setText("Cart (" + iCount + ")");
			 *
			 * [BEGINNER] EXAMPLE USAGE IN XML VIEW:
			 * You might NOT need this function in views because you can
			 * bind directly to the model property:
			 *
			 *   <Button icon="sap-icon://cart" text="{cart>/itemCount}" />
			 *
			 * This function is more useful in controller logic where you
			 * need the count for business decisions (e.g., "show checkout
			 * button only if cart has items").
			 *
			 * [INTERMEDIATE] ITEM COUNT vs ITEMS LENGTH:
			 *   • getItemCount: Sum of all quantities (2 mice + 1 keyboard = 3)
			 *   • items.length: Number of LINE ITEMS (2 mice + 1 keyboard = 2)
			 *
			 * Both are useful, but the UI typically shows the total count
			 * (3), not the number of distinct products (2).
			 *
			 * @public
			 * @param {sap.ui.model.json.JSONModel} oCartModel - The cart model
			 * @returns {number} Total quantity of all items
			 */
			getItemCount: function (oCartModel) {
				return oCartModel.getProperty("/itemCount") || 0;
			},

			/**
			 * ============================================================
			 * clearCart(cartModel)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Empties the entire cart — removes all items and resets
			 * totals to zero. Typically called after a successful
			 * checkout or when the user clicks "Clear Cart".
			 *
			 * [BEGINNER] EXAMPLE USAGE IN A CONTROLLER:
			 *
			 *   // In Checkout.controller.js — after successful order
			 *   onOrderConfirmed: function () {
			 *     var oCartModel = this.getOwnerComponent().getModel("cart");
			 *     cartHelper.clearCart(oCartModel);
			 *
			 *     sap.m.MessageBox.success("Order placed successfully!");
			 *     this.getRouter().navTo("orderConfirmation");
			 *   }
			 *
			 * [INTERMEDIATE] We use setProperty for each field instead of
			 * setData to replace the entire model. This is because:
			 *   1. setData replaces EVERYTHING, which could lose other
			 *      cart-related state (like "selectedShipping" or "coupon")
			 *   2. setProperty is more precise — only resets what we
			 *      intend to reset
			 *
			 * [ANTI-PATTERN] Don't do this:
			 *   oCartModel.setData({});
			 * This nukes ALL model properties, including ones that other
			 * parts of the app might depend on. Always be explicit about
			 * what you're resetting.
			 *
			 * [BEST PRACTICE] In a real app, you might want to show a
			 * confirmation dialog before clearing the cart:
			 *
			 *   sap.m.MessageBox.confirm("Clear all items?", {
			 *     onClose: function (sAction) {
			 *       if (sAction === sap.m.MessageBox.Action.OK) {
			 *         cartHelper.clearCart(oCartModel);
			 *       }
			 *     }
			 *   });
			 *
			 * @public
			 * @param {sap.ui.model.json.JSONModel} oCartModel - The cart model
			 */
			clearCart: function (oCartModel) {
				// [BEGINNER] Reset items to an empty array. We create a
				// brand new empty array rather than using
				// aItems.length = 0 (which empties an existing array)
				// because setProperty with a new array is the cleanest
				// way to trigger change events.
				oCartModel.setProperty("/items", []);

				// Reset computed totals to zero
				oCartModel.setProperty("/totalPrice", 0);
				oCartModel.setProperty("/itemCount", 0);

				// [BEGINNER] Even though setProperty fires change events
				// for each path, calling refresh ensures that any complex
				// bindings (like list aggregation bindings) also update.
				//
				// [INTERMEDIATE] List bindings (items="{cart>/items}")
				// sometimes need a refresh to properly remove all rendered
				// list items. setProperty on the array path SHOULD be
				// sufficient, but refresh is a safety net against edge
				// cases in the UI5 binding engine.
				oCartModel.refresh(true);
			}
		};
	}
);
