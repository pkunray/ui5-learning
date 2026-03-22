/**
 * ============================================================================
 * FILE: formatter.js — View Formatter Functions
 * NAMESPACE: com.shopeasy.app.model
 * ============================================================================
 *
 * [BEGINNER] WHAT IS A FORMATTER?
 * -----------------------------------------------------------------------
 * A formatter is a pure function that transforms raw data from a model
 * into a human-readable or UI-friendly value. The raw data stays
 * unchanged in the model; the formatter only affects what the user SEES.
 *
 * Think of it like a currency converter at an airport display board:
 *   • The database stores "42.5"  (raw number)
 *   • The formatter turns it into "$42.50" (display string)
 *   • The original "42.5" in the model is untouched
 *
 * [BEGINNER] WHY USE FORMATTERS?
 * -----------------------------------------------------------------------
 * 1. SEPARATION OF CONCERNS — Business data stays clean in the model.
 *    Display logic lives in formatters, not in controllers or views.
 *
 * 2. REUSABILITY — The same formatter can be used across many views.
 *    If the date format changes, you update ONE function, not 20 views.
 *
 * 3. TESTABILITY — Formatters are pure functions (input → output) with
 *    no side effects, making them trivial to unit test.
 *
 * 4. CLEAN VIEWS — XML views stay readable. Instead of inline JS:
 *      text="some complex expression"   ← messy, error-prone
 *    you write:
 *      text="{path: '/price', formatter: '.formatter.formatPrice'}"
 *
 * [BEGINNER] HOW DO FORMATTERS CONNECT TO VIEWS?
 * -----------------------------------------------------------------------
 * Step 1: In your Controller, import the formatter module and attach it:
 *
 *   sap.ui.define([
 *     "sap/ui/core/mvc/Controller",
 *     "com/shopeasy/app/model/formatter"   // ← import formatter module
 *   ], function (Controller, formatter) {
 *
 *     return Controller.extend("com.shopeasy.app.controller.ProductList", {
 *       formatter: formatter,  // ← attach it as a property named "formatter"
 *
 *       onInit: function () { ... }
 *     });
 *   });
 *
 * Step 2: In your XML View, reference it with a dot-prefix:
 *
 *   <Text text="{
 *     path: '/price',
 *     formatter: '.formatter.formatPrice'
 *   }" />
 *
 *   The leading dot "." means "look on the controller instance". So
 *   ".formatter.formatPrice" resolves to:
 *     this.formatter.formatPrice
 *   where `this` is the controller.
 *
 * [GOTCHA] The dot "." prefix is CRITICAL. Without it, UI5 looks for a
 * GLOBAL function, which will fail. Always use the dot.
 *
 * [GOTCHA] Formatters receive the BOUND VALUE as their argument, not the
 * entire model. If you bind to path '/price', the formatter receives
 * just the price value (e.g., 42.5), not the whole product object.
 *
 * [INTERMEDIATE] FORMATTERS WITH MULTIPLE ARGUMENTS
 * -----------------------------------------------------------------------
 * You can pass multiple model values to a single formatter using the
 * `parts` syntax:
 *
 *   <Text text="{
 *     parts: [
 *       {path: '/price'},
 *       {path: '/currency'}
 *     ],
 *     formatter: '.formatter.formatPriceWithCurrency'
 *   }" />
 *
 * The formatter then receives them as separate arguments:
 *   formatPriceWithCurrency: function (fPrice, sCurrency) { ... }
 *
 * [ADVANCED] FORMATTER vs. EXPRESSION BINDING vs. COMPLEX BINDING
 * -----------------------------------------------------------------------
 * UI5 offers three ways to transform data in views:
 *
 * 1. Formatter function (this file):
 *    Best for complex logic, reusable across views, testable.
 *    text="{path: '/stock', formatter: '.formatter.formatAvailability'}"
 *
 * 2. Expression binding (inline in XML):
 *    Best for simple one-liners. Uses a limited expression language.
 *    text="{= ${/stock} > 0 ? 'Available' : 'Sold Out'}"
 *    ⚠ Hard to debug, can't set breakpoints.
 *
 * 3. Complex binding with type:
 *    Uses built-in UI5 types for standard formatting (dates, numbers).
 *    text="{path: '/date', type: 'sap.ui.model.type.Date',
 *           formatOptions: {style: 'medium'}}"
 *    Best when a built-in type already does what you need.
 *
 * [BEST PRACTICE] Use formatters for business-specific logic (like
 * availability status). Use types for standard formatting (dates,
 * numbers, currencies). Use expression binding sparingly for trivial
 * boolean checks.
 *
 * ============================================================================
 */
sap.ui.define(
	[
		// [BEGINNER] We import ValueState so our availability formatter
		// can return semantic states that UI5 controls understand.
		// ValueState is an enum with these values:
		//   ValueState.None    — neutral / default (grey)
		//   ValueState.Success — positive / good (green)
		//   ValueState.Warning — caution (orange/yellow)
		//   ValueState.Error   — critical / bad (red)
		//   ValueState.Information — informational (blue)
		//
		// Many UI5 controls have a "state" property that accepts these
		// values and colors themselves accordingly:
		//   <ObjectStatus state="{path: '/stock', formatter: '.formatter.formatAvailabilityState'}" />
		"sap/ui/core/ValueState"
	],

	/**
	 * @param {typeof sap.ui.core.ValueState} ValueState - Enum for semantic states
	 * @returns {object} An object containing all formatter functions
	 */
	function (ValueState) {
		"use strict";

		/**
		 * ================================================================
		 * FORMATTER OBJECT
		 * ================================================================
		 *
		 * [BEGINNER] We return a plain object where each property is a
		 * formatter function. Controllers import this object and assign
		 * it to `this.formatter`, making all functions available in views
		 * via the ".formatter.functionName" syntax.
		 *
		 * [BEST PRACTICE] Keep formatter functions PURE:
		 *   ✓ Same input always produces same output
		 *   ✓ No side effects (don't modify models, DOM, or globals)
		 *   ✓ No dependency on `this` (don't use controller context)
		 *   ✗ Don't make API calls or read from DOM inside formatters
		 *
		 * [ANTI-PATTERN] Using `this` inside a formatter to access the
		 * controller or view. While technically `this` IS the controller
		 * when called via binding, relying on it makes the formatter
		 * impure and harder to test. Pass everything through parameters.
		 */
		return {

			/**
			 * ============================================================
			 * formatPrice(price)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Converts a raw number (e.g., 42.5) into a currency display
			 * string (e.g., "$42.50"). This ensures prices always show
			 * exactly 2 decimal places and include the $ symbol.
			 *
			 * [BEGINNER] EXAMPLE USAGE IN XML VIEW:
			 *
			 *   <!-- Simple binding with formatter -->
			 *   <ObjectNumber
			 *     number="{
			 *       path: 'price',
			 *       formatter: '.formatter.formatPrice'
			 *     }"
			 *     unit="USD"
			 *   />
			 *
			 *   <!-- In a List item -->
			 *   <ObjectListItem
			 *     title="{name}"
			 *     number="{path: 'price', formatter: '.formatter.formatPrice'}"
			 *     numberUnit="USD"
			 *   />
			 *
			 * [BEGINNER] WHAT HAPPENS AT RUNTIME:
			 *   1. UI5 reads the value at path 'price' from the model → 42.5
			 *   2. UI5 calls formatPrice(42.5)
			 *   3. The function returns "$42.50"
			 *   4. UI5 displays "$42.50" in the control
			 *   5. Whenever the model's 'price' changes, steps 1-4 repeat
			 *
			 * [INTERMEDIATE] For production apps, consider using
			 * sap.ui.core.format.NumberFormat for locale-aware formatting
			 * that respects the user's language settings (e.g., "42,50 €"
			 * for German users). This simple version always uses "$" and
			 * US-style decimals for learning clarity.
			 *
			 * [GOTCHA] The `price` argument could be `undefined` or `null`
			 * if the model property doesn't exist yet (e.g., data hasn't
			 * loaded). ALWAYS add a guard check at the top of formatters.
			 *
			 * @public
			 * @param {number|string|undefined} price - The raw price value from the model
			 * @returns {string} Formatted price string like "$42.50", or
			 *                   empty string if price is missing
			 */
			formatPrice: function (price) {
				// Guard: handle undefined/null/NaN gracefully.
				// This is a MUST in every formatter because:
				//   - Data might not be loaded yet (async fetch)
				//   - The property path might be wrong (typo in binding)
				//   - The value might be explicitly null in the data
				if (price == null || isNaN(price)) {
					return "";
				}

				// parseFloat handles the case where price arrives as a
				// string (e.g., "42.50" from JSON). Then .toFixed(2)
				// ensures exactly 2 decimal places:
				//   42     → "42.00"
				//   42.5   → "42.50"
				//   42.999 → "43.00" (rounds!)
				return "$" + parseFloat(price).toFixed(2);
			},

			/**
			 * ============================================================
			 * formatAvailability(stock)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Converts a numeric stock count into a human-readable
			 * availability label. Users don't care that there are "3"
			 * items left — they care that it's "Low Stock" so they
			 * should order soon.
			 *
			 * [BEGINNER] EXAMPLE USAGE IN XML VIEW:
			 *
			 *   <ObjectStatus
			 *     text="{
			 *       path: 'stock',
			 *       formatter: '.formatter.formatAvailability'
			 *     }"
			 *     state="{
			 *       path: 'stock',
			 *       formatter: '.formatter.formatAvailabilityState'
			 *     }"
			 *   />
			 *
			 *   This ObjectStatus will show colored text like:
			 *     • "In Stock"     (green)   — stock > 5
			 *     • "Low Stock"    (orange)  — stock 1–5
			 *     • "Out of Stock" (red)     — stock 0
			 *
			 * [BEGINNER] Notice how we use TWO formatters on the SAME
			 * control: one for the text, one for the state (color).
			 * This is a common pattern — pair a display formatter with
			 * a state formatter for semantic coloring.
			 *
			 * [INTERMEDIATE] In a real app, these strings should come from
			 * an i18n (internationalization) resource bundle so they can
			 * be translated:
			 *   var oBundle = this.getView().getModel("i18n").getResourceBundle();
			 *   return oBundle.getText("statusInStock");
			 *
			 * For this learning project, we use hardcoded English strings
			 * to keep things simple. The i18n approach is covered in the
			 * i18n chapter.
			 *
			 * @public
			 * @param {number|undefined} stock - Number of items in stock
			 * @returns {string} "In Stock", "Low Stock", or "Out of Stock"
			 */
			formatAvailability: function (stock) {
				// Guard: if stock is undefined, we can't determine status
				if (stock == null || isNaN(stock)) {
					return "";
				}

				var iStock = parseInt(stock, 10);

				// [BEGINNER] We check conditions from most-specific to
				// least-specific (0, then <=5, then everything else).
				// Order matters: if we checked <=5 first, 0 would also
				// match and we'd never reach "Out of Stock".
				if (iStock === 0) {
					return "Out of Stock";
				} else if (iStock <= 5) {
					return "Low Stock";
				} else {
					return "In Stock";
				}
			},

			/**
			 * ============================================================
			 * formatAvailabilityState(stock)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Returns a ValueState enum value that UI5 controls use to
			 * color themselves semantically. This is the "companion"
			 * formatter to formatAvailability — one provides text, this
			 * one provides the color.
			 *
			 * [BEGINNER] ValueState MAPPING:
			 *   stock = 0     → ValueState.Error   → Red
			 *   stock <= 5    → ValueState.Warning → Orange
			 *   stock > 5     → ValueState.Success → Green
			 *
			 * [BEGINNER] EXAMPLE USAGE IN XML VIEW:
			 *
			 *   <ObjectStatus
			 *     text="{path: 'stock', formatter: '.formatter.formatAvailability'}"
			 *     state="{path: 'stock', formatter: '.formatter.formatAvailabilityState'}"
			 *   />
			 *
			 * [INTERMEDIATE] ValueState controls more than just color.
			 * Depending on the control, it can also change:
			 *   • Border color (Input, TextArea)
			 *   • Icon (MessageStrip)
			 *   • Aria attributes for accessibility (screen readers
			 *     announce "Error" or "Warning" to visually impaired users)
			 *
			 * [BEST PRACTICE] Always pair text formatters with state
			 * formatters. Relying only on color is an accessibility
			 * anti-pattern (color-blind users can't distinguish red/green).
			 *
			 * @public
			 * @param {number|undefined} stock - Number of items in stock
			 * @returns {sap.ui.core.ValueState} The semantic state
			 */
			formatAvailabilityState: function (stock) {
				if (stock == null || isNaN(stock)) {
					return ValueState.None;
				}

				var iStock = parseInt(stock, 10);

				if (iStock === 0) {
					return ValueState.Error;
				} else if (iStock <= 5) {
					return ValueState.Warning;
				} else {
					return ValueState.Success;
				}
			},

			/**
			 * ============================================================
			 * formatRating(rating)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Rounds a rating value to 1 decimal place for clean display.
			 * Raw data might have many decimals (4.66666667), but users
			 * expect something like "4.7".
			 *
			 * [BEGINNER] EXAMPLE USAGE IN XML VIEW:
			 *
			 *   <!-- Show as text -->
			 *   <Text text="{path: 'rating', formatter: '.formatter.formatRating'} / 5" />
			 *   <!-- Output: "4.7 / 5" -->
			 *
			 *   <!-- With RatingIndicator control -->
			 *   <RatingIndicator
			 *     value="{path: 'rating', formatter: '.formatter.formatRating'}"
			 *     maxValue="5"
			 *     editable="false"
			 *   />
			 *
			 * [INTERMEDIATE] Math.round(x * 10) / 10 is a classic JS
			 * pattern for rounding to 1 decimal:
			 *   4.666 * 10 = 46.66
			 *   Math.round(46.66) = 47
			 *   47 / 10 = 4.7
			 *
			 * [GOTCHA] JavaScript floating point can be tricky:
			 *   0.1 + 0.2 = 0.30000000000000004
			 * For display purposes this rounding approach is fine, but
			 * for financial calculations, consider using integer math
			 * (work in cents, not dollars) or a library like decimal.js.
			 *
			 * @public
			 * @param {number|undefined} rating - Raw rating value (e.g., 4.666)
			 * @returns {number|string} Rounded rating (e.g., 4.7) or empty string
			 */
			formatRating: function (rating) {
				if (rating == null || isNaN(rating)) {
					return "";
				}

				return Math.round(parseFloat(rating) * 10) / 10;
			},

			/**
			 * ============================================================
			 * formatDate(date)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Converts a date value (could be a Date object, ISO string,
			 * or timestamp) into a readable format like "Mar 22, 2026".
			 *
			 * [BEGINNER] EXAMPLE USAGE IN XML VIEW:
			 *
			 *   <Text text="{path: 'orderDate', formatter: '.formatter.formatDate'}" />
			 *   <!-- Input: "2026-03-22T10:30:00Z" → Output: "Mar 22, 2026" -->
			 *
			 *   <ObjectAttribute
			 *     title="Ordered"
			 *     text="{path: 'createdAt', formatter: '.formatter.formatDate'}"
			 *   />
			 *
			 * [INTERMEDIATE] In production apps, use sap.ui.core.format.DateFormat
			 * for locale-aware date formatting:
			 *
			 *   var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			 *     style: "medium"
			 *   });
			 *   return oDateFormat.format(oDate);
			 *
			 * This respects the user's locale (e.g., "22.03.2026" for German,
			 * "22/03/2026" for British English). For this learning project,
			 * we use JavaScript's built-in toLocaleDateString for simplicity.
			 *
			 * [ADVANCED] UI5 also supports date formatting directly in the
			 * binding using types, which is often preferred over formatters
			 * for standard date display:
			 *
			 *   <Text text="{
			 *     path: 'orderDate',
			 *     type: 'sap.ui.model.type.Date',
			 *     formatOptions: { style: 'medium', source: { pattern: 'yyyy-MM-dd' } }
			 *   }" />
			 *
			 * [GOTCHA] Date strings from JSON ("2026-03-22") are NOT Date
			 * objects. You must wrap them with `new Date()` first. Also,
			 * be aware of timezone issues: "2026-03-22" (no time) is
			 * interpreted as UTC midnight, which might show as "Mar 21"
			 * in Western Hemisphere timezones.
			 *
			 * @public
			 * @param {Date|string|number|undefined} date - The date to format
			 * @returns {string} Formatted date like "Mar 22, 2026" or empty string
			 */
			formatDate: function (date) {
				if (!date) {
					return "";
				}

				// Ensure we have a Date object regardless of input type
				var oDate = date instanceof Date ? date : new Date(date);

				// Validate — new Date("garbage") creates an Invalid Date
				// whose getTime() returns NaN
				if (isNaN(oDate.getTime())) {
					return "";
				}

				// toLocaleDateString with "en-US" and these options gives
				// a format like "Mar 22, 2026"
				return oDate.toLocaleDateString("en-US", {
					year: "numeric",
					month: "short",
					day: "numeric"
				});
			},

			/**
			 * ============================================================
			 * formatCartTotal(items)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Takes an array of cart items (each with `price` and
			 * `quantity` properties) and returns the formatted total.
			 * This is useful for showing a cart summary:
			 *   "Total: $127.50"
			 *
			 * [BEGINNER] EXAMPLE USAGE IN XML VIEW:
			 *
			 *   <ObjectNumber
			 *     number="{
			 *       path: 'cart>/items',
			 *       formatter: '.formatter.formatCartTotal'
			 *     }"
			 *     unit="USD"
			 *   />
			 *
			 * [INTERMEDIATE] NOTE ABOUT BINDING TO ARRAYS:
			 * When you bind a formatter to an array path (like 'cart>/items'),
			 * the formatter receives the ENTIRE array as its argument.
			 * This is different from list bindings where each item gets
			 * its own binding context.
			 *
			 * [GOTCHA] If items in the array are added/removed/modified,
			 * the formatter will only re-run if the model fires a change
			 * event for that path. After modifying array data in a
			 * JSONModel, you must call model.refresh() to trigger re-
			 * evaluation of bindings.
			 *
			 * [ADVANCED] For complex calculations like this, consider
			 * moving the logic to the controller and storing the computed
			 * total in the model itself, rather than recalculating it in
			 * a formatter on every binding update. See cart.js for that
			 * approach.
			 *
			 * @public
			 * @param {Array|undefined} items - Array of cart items, each
			 *        having `price` (number) and `quantity` (number) properties
			 * @returns {string} Formatted total like "$127.50" or "$0.00"
			 */
			formatCartTotal: function (items) {
				if (!Array.isArray(items) || items.length === 0) {
					return "$0.00";
				}

				// [BEGINNER] Array.reduce() iterates over every item,
				// accumulating a running total. For each item, we add
				// (price × quantity) to the accumulator.
				//
				// Breakdown:
				//   items = [
				//     { price: 29.99, quantity: 2 },  ← 59.98
				//     { price: 9.99,  quantity: 1 }   ← 9.99
				//   ]
				//   total = 0 + 59.98 + 9.99 = 69.97
				var fTotal = items.reduce(function (fAccumulator, oItem) {
					var fPrice = parseFloat(oItem.price) || 0;
					var iQuantity = parseInt(oItem.quantity, 10) || 0;
					return fAccumulator + (fPrice * iQuantity);
				}, 0);

				return "$" + fTotal.toFixed(2);
			},

			/**
			 * ============================================================
			 * formatImageUrl(relativePath)
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Prepends the application's base URL path to a relative
			 * image path so it resolves correctly regardless of how the
			 * app is deployed.
			 *
			 * [BEGINNER] THE PROBLEM THIS SOLVES:
			 * In your data you might store image paths like:
			 *   "images/products/laptop.jpg"
			 *
			 * But the app might be served from different base paths:
			 *   • Development: http://localhost:8080/
			 *   • Deployed:    https://myserver.com/shopeasy/
			 *   • Launchpad:   https://fiorilaunchpad.com/sap/bc/ui5/shopeasy/
			 *
			 * Just using the relative path "images/products/laptop.jpg"
			 * would break if the browser's current URL doesn't match.
			 * This formatter ensures the correct base path is prepended.
			 *
			 * [BEGINNER] EXAMPLE USAGE IN XML VIEW:
			 *
			 *   <Image
			 *     src="{path: 'imageUrl', formatter: '.formatter.formatImageUrl'}"
			 *     alt="{name}"
			 *     width="200px"
			 *   />
			 *
			 * [INTERMEDIATE] In real apps, you'd typically use
			 * sap.ui.require.toUrl() or jQuery.sap.getModulePath() to
			 * resolve module-relative paths:
			 *
			 *   sap.ui.require.toUrl("com/shopeasy/app/images/laptop.jpg")
			 *
			 * For this learning project, we use a simpler approach.
			 *
			 * [GOTCHA] This formatter uses `this` to access the controller,
			 * which means it's NOT a pure function. This is an exception
			 * to the "don't use this" best practice, because we need
			 * access to the component's root path. As an alternative,
			 * you could store the base path in the model and use a
			 * multi-part binding instead.
			 *
			 * [BEST PRACTICE] If the image path is empty/null, return an
			 * empty string or a placeholder image path so the <Image>
			 * control doesn't show a broken image icon.
			 *
			 * @public
			 * @param {string|undefined} relativePath - e.g., "images/products/laptop.jpg"
			 * @returns {string} Full URL path or empty string
			 */
			formatImageUrl: function (relativePath) {
				if (!relativePath) {
					return "";
				}

				// [BEGINNER] We prepend "./" to make the path relative to
				// the webapp folder. In a Fiori launchpad scenario, you'd
				// use the component's manifest base URL instead.
				//
				// [INTERMEDIATE] A more robust approach would be:
				//   var sRootPath = sap.ui.require.toUrl("com/shopeasy/app");
				//   return sRootPath + "/" + sRelativePath;
				//
				// But for development with ui5 serve, "./" works fine.
				var sPath = relativePath.replace(/^\//, "");
				return "./" + sPath;
			}
		};
	}
);
