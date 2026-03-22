/**
 * ============================================================================
 * FILE: formatter.js — Unit Tests for the Formatter Module
 * PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 * NAMESPACE: com.shopeasy.app.test.unit.model
 * ============================================================================
 *
 * [BEGINNER] WHAT IS THIS FILE?
 * ─────────────────────────────
 * This file contains UNIT TESTS for the formatter functions defined in
 * webapp/model/formatter.js. Each formatter function gets its own test
 * module (QUnit.module) with multiple test cases (QUnit.test).
 *
 * [BEGINNER] WHAT IS UNIT TESTING?
 * ────────────────────────────────
 * Unit testing is the practice of testing the SMALLEST PIECES of your code
 * in ISOLATION. For formatters, each function is a "unit" — it takes an
 * input and produces an output with no side effects. This makes formatters
 * the EASIEST code to unit test.
 *
 * The process for each test:
 *   1. ARRANGE — Set up the input data
 *   2. ACT     — Call the function being tested
 *   3. ASSERT  — Verify the output matches what we expect
 *
 * [BEGINNER] WHY WRITE TESTS?
 * ──────────────────────────
 *   1. CONFIDENCE — Know your code works before deploying
 *   2. REGRESSION — Catch bugs when you change code later
 *   3. DOCUMENTATION — Tests show HOW a function should behave
 *   4. DESIGN — Writing tests first (TDD) leads to cleaner APIs
 *
 * [INTERMEDIATE] QUNIT BASICS
 * ──────────────────────────
 * QUnit is the testing framework bundled with SAP UI5. Key concepts:
 *
 *   QUnit.module("Name", { ... })
 *     Groups related tests together. Like "describe()" in Jest/Mocha.
 *     The optional second argument is a hooks object with:
 *       - beforeEach: runs before EVERY test in this module
 *       - afterEach:  runs after EVERY test in this module
 *       - before:     runs ONCE before all tests in this module
 *       - after:      runs ONCE after all tests in this module
 *
 *   QUnit.test("test name", function(assert) { ... })
 *     Defines a single test case. Like "it()" in Jest/Mocha.
 *     The `assert` parameter provides assertion methods.
 *
 *   assert.strictEqual(actual, expected, message)
 *     Checks that actual === expected (strict equality, no type coercion).
 *     ALWAYS prefer strictEqual over equal (which uses ==).
 *
 *   assert.ok(value, message)
 *     Checks that `value` is truthy (not false, 0, "", null, undefined, NaN).
 *
 *   assert.deepEqual(actual, expected, message)
 *     Deep comparison for objects and arrays. Checks that the structure
 *     and values match, not that they're the same reference.
 *
 *   assert.throws(function, expectedError, message)
 *     Verifies that the function throws an error.
 *
 *   assert.notStrictEqual(actual, expected, message)
 *     Opposite of strictEqual — checks that actual !== expected.
 *
 * [BEST PRACTICE] ASSERTION MESSAGES
 * Every assertion should have a descriptive message (the last argument).
 * When a test fails, this message tells you WHAT went wrong without
 * having to read the test code:
 *   ✓ "Price 42.5 should be formatted as '$42.50'"
 *   ✗ "test 1"  (unhelpful!)
 *
 * [ADVANCED] TEST ISOLATION
 * ────────────────────────
 * Each QUnit.test() runs independently. Tests should NEVER depend on
 * each other or share mutable state. If test A sets a variable and
 * test B reads it, you have a "test coupling" problem — reordering
 * or skipping test A breaks test B.
 *
 * For formatters, isolation is natural because they're pure functions
 * (no state, no side effects). For controllers or services, you'd
 * use sinon.js stubs/mocks to isolate dependencies.
 *
 * ============================================================================
 */
sap.ui.define([
	// ----------------------------------------------------------------
	// DEPENDENCY 1: The formatter module we're testing
	// ----------------------------------------------------------------
	// [BEGINNER] We import the ACTUAL formatter module from the app.
	// The test will call these functions with various inputs and verify
	// the outputs match our expectations.
	//
	// The path "com/shopeasy/app/model/formatter" resolves to
	// webapp/model/formatter.js thanks to the resourceroots mapping
	// in our test HTML page.
	"com/shopeasy/app/model/formatter",

	// ----------------------------------------------------------------
	// DEPENDENCY 2: ValueState (for testing formatAvailabilityState)
	// ----------------------------------------------------------------
	// [BEGINNER] We need ValueState to verify that the formatter
	// returns the correct enum values. We compare the actual return
	// value against ValueState.Success, ValueState.Warning, etc.
	"sap/ui/core/ValueState"

], function (formatter, ValueState) {
	"use strict";

	/**
	 * ================================================================
	 * TEST MODULE: formatPrice
	 * ================================================================
	 *
	 * [BEGINNER] QUnit.module() creates a TEST GROUP.
	 * All QUnit.test() calls after this (until the next QUnit.module)
	 * belong to the "formatPrice" group. In the test results UI, they
	 * appear under a collapsible "formatPrice" heading.
	 *
	 * The string argument is the module name — make it descriptive.
	 * Common conventions:
	 *   "formatPrice"                      ← function name
	 *   "Formatter - formatPrice"          ← module + function
	 *   "model/formatter: formatPrice"     ← file path + function
	 *
	 * [BEST PRACTICE] Use the same name as the function being tested.
	 * This makes it easy to map failing tests to source code.
	 */
	QUnit.module("formatPrice");

	/**
	 * [BEGINNER] QUnit.test() — A SINGLE TEST CASE
	 * ═════════════════════════════════════════════
	 *
	 * Each test case checks ONE specific behavior. The naming convention
	 * is "Should [expected behavior] when [condition]":
	 *   "Should format a valid price with two decimal places"
	 *   "Should return empty string when price is null"
	 *
	 * The callback receives an `assert` object with methods for making
	 * assertions (checking that things are as expected).
	 *
	 * [BEST PRACTICE] THE ARRANGE-ACT-ASSERT (AAA) PATTERN
	 * ────────────────────────────────────────────────────
	 * Structure every test in three sections:
	 *
	 *   // Arrange — set up the test data
	 *   var fPrice = 42.5;
	 *
	 *   // Act — call the function being tested
	 *   var sResult = formatter.formatPrice(fPrice);
	 *
	 *   // Assert — verify the result
	 *   assert.strictEqual(sResult, "$42.50", "message");
	 *
	 * This makes tests readable and consistent.
	 */
	QUnit.test("Should format a valid price with two decimal places", function (assert) {
		// Arrange: a typical price value
		var fPrice = 42.5;

		// Act: call the formatter
		var sResult = formatter.formatPrice(fPrice);

		// Assert: verify the output
		// [BEGINNER] assert.strictEqual(actual, expected, message)
		// Uses === comparison (strict equality — no type coercion).
		// The message appears in test results, especially useful on failure.
		assert.strictEqual(sResult, "$42.50",
			"Price 42.5 should be formatted as '$42.50'");
	});

	QUnit.test("Should format a whole number price with .00", function (assert) {
		// Arrange
		var fPrice = 100;

		// Act
		var sResult = formatter.formatPrice(fPrice);

		// Assert: whole numbers should still show 2 decimal places
		assert.strictEqual(sResult, "$100.00",
			"Price 100 should be formatted as '$100.00' (two decimals always)");
	});

	QUnit.test("Should format zero as '$0.00'", function (assert) {
		// [BEGINNER] Testing with 0 is important because 0 is "falsy" in
		// JavaScript. A naive guard like `if (!price)` would incorrectly
		// treat 0 as missing data. Our formatter uses `price == null`
		// which correctly allows 0 through.
		var sResult = formatter.formatPrice(0);

		assert.strictEqual(sResult, "$0.00",
			"Price 0 should be formatted as '$0.00', not empty string");
	});

	QUnit.test("Should return empty string when price is null", function (assert) {
		// [BEGINNER] Testing edge cases (null, undefined) is critical.
		// In a real app, data might arrive as null from the server,
		// or the model property might not exist yet during initial load.
		var sResult = formatter.formatPrice(null);

		assert.strictEqual(sResult, "",
			"Null price should return empty string (graceful handling)");
	});

	QUnit.test("Should return empty string when price is undefined", function (assert) {
		// [BEGINNER] undefined is different from null in JavaScript:
		//   null      = "explicitly no value" (intentional absence)
		//   undefined = "not yet assigned" (accidental or default absence)
		// Both should be handled gracefully in formatters.
		var sResult = formatter.formatPrice(undefined);

		assert.strictEqual(sResult, "",
			"Undefined price should return empty string");
	});

	QUnit.test("Should format a negative price correctly", function (assert) {
		// [INTERMEDIATE] Negative prices might represent discounts or refunds.
		// Even if unlikely, testing negative values catches edge cases.
		var sResult = formatter.formatPrice(-15.99);

		assert.strictEqual(sResult, "$-15.99",
			"Negative price should include the minus sign");
	});

	QUnit.test("Should handle price passed as a string", function (assert) {
		// [INTERMEDIATE] JSON data from APIs often arrives as strings,
		// not numbers. The formatter uses parseFloat() internally to
		// handle this case.
		var sResult = formatter.formatPrice("29.99");

		assert.strictEqual(sResult, "$29.99",
			"String price '29.99' should be parsed and formatted correctly");
	});

	QUnit.test("Should return empty string for NaN input", function (assert) {
		// [INTERMEDIATE] NaN (Not a Number) can sneak in from calculations
		// like parseInt("abc") or 0/0. The formatter guards against this.
		var sResult = formatter.formatPrice(NaN);

		assert.strictEqual(sResult, "",
			"NaN should return empty string");
	});

	QUnit.test("Should round prices to two decimal places", function (assert) {
		// [INTERMEDIATE] toFixed(2) rounds: 42.999 → "43.00"
		var sResult = formatter.formatPrice(42.999);

		assert.strictEqual(sResult, "$43.00",
			"Price 42.999 should round up to '$43.00'");
	});


	/**
	 * ================================================================
	 * TEST MODULE: formatAvailability
	 * ================================================================
	 *
	 * [BEGINNER] Tests for the stock-to-label conversion:
	 *   stock > 5     → "In Stock"
	 *   stock 1–5     → "Low Stock"
	 *   stock === 0   → "Out of Stock"
	 *   stock is null → ""
	 *
	 * [BEST PRACTICE] Test EVERY branch of conditional logic.
	 * The formatAvailability function has an if/else-if/else chain,
	 * so we need at least one test per branch, plus boundary values.
	 */
	QUnit.module("formatAvailability");

	QUnit.test("Should return 'In Stock' when stock is greater than 5", function (assert) {
		// Arrange & Act
		var sResult = formatter.formatAvailability(10);

		// Assert
		assert.strictEqual(sResult, "In Stock",
			"Stock of 10 should show 'In Stock'");
	});

	QUnit.test("Should return 'In Stock' for stock of 6 (boundary)", function (assert) {
		// [INTERMEDIATE] BOUNDARY VALUE TESTING
		// The boundary between "In Stock" and "Low Stock" is at 5.
		// We test 6 (just above) and 5 (just below/at) to ensure
		// the boundary condition is coded correctly (> 5, not >= 5).
		var sResult = formatter.formatAvailability(6);

		assert.strictEqual(sResult, "In Stock",
			"Stock of 6 should be 'In Stock' (just above the boundary)");
	});

	QUnit.test("Should return 'Low Stock' when stock is 5 (boundary)", function (assert) {
		// [INTERMEDIATE] This tests the UPPER boundary of "Low Stock".
		// The formatter uses `<= 5`, so 5 should be "Low Stock".
		var sResult = formatter.formatAvailability(5);

		assert.strictEqual(sResult, "Low Stock",
			"Stock of 5 should be 'Low Stock' (at the boundary)");
	});

	QUnit.test("Should return 'Low Stock' when stock is between 1 and 5", function (assert) {
		var sResult = formatter.formatAvailability(3);

		assert.strictEqual(sResult, "Low Stock",
			"Stock of 3 should be 'Low Stock'");
	});

	QUnit.test("Should return 'Low Stock' when stock is 1 (lower boundary)", function (assert) {
		var sResult = formatter.formatAvailability(1);

		assert.strictEqual(sResult, "Low Stock",
			"Stock of 1 should be 'Low Stock' (minimum before Out of Stock)");
	});

	QUnit.test("Should return 'Out of Stock' when stock is 0", function (assert) {
		var sResult = formatter.formatAvailability(0);

		assert.strictEqual(sResult, "Out of Stock",
			"Stock of 0 should be 'Out of Stock'");
	});

	QUnit.test("Should return empty string when stock is null", function (assert) {
		var sResult = formatter.formatAvailability(null);

		assert.strictEqual(sResult, "",
			"Null stock should return empty string");
	});

	QUnit.test("Should return empty string when stock is undefined", function (assert) {
		var sResult = formatter.formatAvailability(undefined);

		assert.strictEqual(sResult, "",
			"Undefined stock should return empty string");
	});


	/**
	 * ================================================================
	 * TEST MODULE: formatAvailabilityState
	 * ================================================================
	 *
	 * [BEGINNER] Tests for the stock-to-ValueState conversion.
	 * This formatter works identically to formatAvailability but
	 * returns ValueState enum values instead of strings:
	 *   stock > 5     → ValueState.Success  (green)
	 *   stock 1–5     → ValueState.Warning  (orange)
	 *   stock === 0   → ValueState.Error    (red)
	 *   stock is null → ValueState.None     (neutral)
	 *
	 * [INTERMEDIATE] We compare against the imported ValueState enum
	 * rather than hardcoding strings like "Success". This ensures
	 * our tests stay correct even if SAP changes the internal string
	 * representation of these enums.
	 */
	QUnit.module("formatAvailabilityState");

	QUnit.test("Should return Success state when stock is greater than 5", function (assert) {
		var oResult = formatter.formatAvailabilityState(10);

		// [BEGINNER] We compare against ValueState.Success, not the
		// string "Success". This is more robust because we're testing
		// against the same enum the production code uses.
		assert.strictEqual(oResult, ValueState.Success,
			"Stock > 5 should return ValueState.Success (green)");
	});

	QUnit.test("Should return Warning state when stock is between 1 and 5", function (assert) {
		var oResult = formatter.formatAvailabilityState(3);

		assert.strictEqual(oResult, ValueState.Warning,
			"Stock 1-5 should return ValueState.Warning (orange)");
	});

	QUnit.test("Should return Error state when stock is 0", function (assert) {
		var oResult = formatter.formatAvailabilityState(0);

		assert.strictEqual(oResult, ValueState.Error,
			"Stock 0 should return ValueState.Error (red)");
	});

	QUnit.test("Should return None state when stock is null", function (assert) {
		var oResult = formatter.formatAvailabilityState(null);

		assert.strictEqual(oResult, ValueState.None,
			"Null stock should return ValueState.None (neutral/grey)");
	});

	QUnit.test("Should return None state when stock is undefined", function (assert) {
		var oResult = formatter.formatAvailabilityState(undefined);

		assert.strictEqual(oResult, ValueState.None,
			"Undefined stock should return ValueState.None");
	});

	QUnit.test("Should return Warning for boundary value 5", function (assert) {
		var oResult = formatter.formatAvailabilityState(5);

		assert.strictEqual(oResult, ValueState.Warning,
			"Stock of 5 (boundary) should return ValueState.Warning");
	});

	QUnit.test("Should return Success for boundary value 6", function (assert) {
		var oResult = formatter.formatAvailabilityState(6);

		assert.strictEqual(oResult, ValueState.Success,
			"Stock of 6 (boundary) should return ValueState.Success");
	});


	/**
	 * ================================================================
	 * TEST MODULE: formatRating
	 * ================================================================
	 *
	 * [BEGINNER] Tests for the rating rounder.
	 * The formatter rounds ratings to 1 decimal place:
	 *   4.666 → 4.7
	 *   3.0   → 3
	 *   null  → ""
	 *
	 * [INTERMEDIATE] Note that the return type changes based on input:
	 *   Valid number → returns a NUMBER (4.7)
	 *   Invalid input → returns a STRING ("")
	 * This is a common pattern in UI5 formatters. The binding framework
	 * handles both types correctly for display purposes.
	 */
	QUnit.module("formatRating");

	QUnit.test("Should round rating to one decimal place", function (assert) {
		var nResult = formatter.formatRating(4.666);

		assert.strictEqual(nResult, 4.7,
			"Rating 4.666 should round to 4.7");
	});

	QUnit.test("Should keep clean decimal values unchanged", function (assert) {
		var nResult = formatter.formatRating(4.5);

		assert.strictEqual(nResult, 4.5,
			"Rating 4.5 should remain 4.5 (no unnecessary rounding)");
	});

	QUnit.test("Should handle whole number ratings", function (assert) {
		var nResult = formatter.formatRating(5);

		assert.strictEqual(nResult, 5,
			"Whole number rating 5 should remain 5");
	});

	QUnit.test("Should return empty string for null rating", function (assert) {
		var sResult = formatter.formatRating(null);

		assert.strictEqual(sResult, "",
			"Null rating should return empty string");
	});

	QUnit.test("Should return empty string for undefined rating", function (assert) {
		var sResult = formatter.formatRating(undefined);

		assert.strictEqual(sResult, "",
			"Undefined rating should return empty string");
	});

	QUnit.test("Should handle zero rating", function (assert) {
		// [INTERMEDIATE] Zero is a valid rating (e.g., "not yet rated"
		// might display as 0). Make sure it's not treated as falsy/missing.
		var nResult = formatter.formatRating(0);

		assert.strictEqual(nResult, 0,
			"Rating 0 should return 0, not empty string");
	});

	QUnit.test("Should round up from .X5", function (assert) {
		// [ADVANCED] JavaScript's Math.round() follows "round half up"
		// for positive numbers: 4.25 * 10 = 42.5 → Math.round(42.5) = 43 → 4.3
		var nResult = formatter.formatRating(4.25);

		assert.strictEqual(nResult, 4.3,
			"Rating 4.25 should round up to 4.3");
	});

	QUnit.test("Should handle string input", function (assert) {
		// [INTERMEDIATE] Like formatPrice, ratings from JSON may arrive as strings.
		var nResult = formatter.formatRating("3.14");

		assert.strictEqual(nResult, 3.1,
			"String rating '3.14' should be parsed and rounded to 3.1");
	});


	/**
	 * ================================================================
	 * TEST MODULE: formatDate
	 * ================================================================
	 *
	 * [BEGINNER] Tests for date formatting.
	 * The formatter converts various date inputs into "MMM DD, YYYY":
	 *   new Date(2026, 2, 22) → "Mar 22, 2026"
	 *   "2026-03-22"          → "Mar 22, 2026" (from ISO string)
	 *   null                  → ""
	 *
	 * [INTERMEDIATE] Date testing can be tricky because of TIMEZONES.
	 * The test machine's timezone affects how dates are displayed.
	 * We use Date objects with explicit month/day/year to avoid
	 * timezone ambiguity.
	 *
	 * [ADVANCED] For timezone-sensitive tests, consider using sinon.js
	 * to fake the system clock (sinon.useFakeTimers) so tests produce
	 * consistent results regardless of the machine's timezone.
	 */
	QUnit.module("formatDate");

	QUnit.test("Should format a Date object correctly", function (assert) {
		// Arrange: create a specific date (month is 0-indexed: 2 = March)
		var oDate = new Date(2026, 2, 22);

		// Act
		var sResult = formatter.formatDate(oDate);

		// Assert
		assert.strictEqual(sResult, "Mar 22, 2026",
			"Date March 22, 2026 should format as 'Mar 22, 2026'");
	});

	QUnit.test("Should return empty string for null date", function (assert) {
		var sResult = formatter.formatDate(null);

		assert.strictEqual(sResult, "",
			"Null date should return empty string");
	});

	QUnit.test("Should return empty string for undefined date", function (assert) {
		var sResult = formatter.formatDate(undefined);

		assert.strictEqual(sResult, "",
			"Undefined date should return empty string");
	});

	QUnit.test("Should return empty string for empty string input", function (assert) {
		var sResult = formatter.formatDate("");

		assert.strictEqual(sResult, "",
			"Empty string should return empty string");
	});

	QUnit.test("Should return empty string for invalid date string", function (assert) {
		// [INTERMEDIATE] "garbage" creates an Invalid Date object.
		// new Date("garbage").getTime() returns NaN, which the formatter
		// checks for and handles gracefully.
		var sResult = formatter.formatDate("not-a-date");

		assert.strictEqual(sResult, "",
			"Invalid date string should return empty string");
	});

	QUnit.test("Should handle Date object for Jan 1st correctly", function (assert) {
		// [INTERMEDIATE] Test another date to ensure month/day formatting
		// works for single-digit days and the first month.
		var oDate = new Date(2026, 0, 1);

		var sResult = formatter.formatDate(oDate);

		assert.strictEqual(sResult, "Jan 1, 2026",
			"January 1st should format as 'Jan 1, 2026'");
	});


	/**
	 * ================================================================
	 * TEST MODULE: formatCartTotal
	 * ================================================================
	 *
	 * [BEGINNER] Tests for cart total calculation.
	 * The formatter takes an array of cart items (each with price and
	 * quantity) and returns the formatted total:
	 *   [{price: 10, quantity: 2}, {price: 5, quantity: 1}] → "$25.00"
	 *   []                                                  → "$0.00"
	 *   null                                                → "$0.00"
	 *
	 * [INTERMEDIATE] This formatter does BOTH calculation and formatting
	 * in one function. In larger apps, you might separate the calculation
	 * (pure math) from the formatting (adding "$" and decimals) for
	 * better testability and reuse.
	 *
	 * [BEST PRACTICE] When testing functions that work with arrays,
	 * always test:
	 *   - Normal case (array with items)
	 *   - Empty array
	 *   - null / undefined
	 *   - Array with one item
	 *   - Array with items that have edge-case values (0 price, 0 quantity)
	 */
	QUnit.module("formatCartTotal");

	QUnit.test("Should calculate total for multiple items", function (assert) {
		// Arrange: two items in the cart
		var aItems = [
			{ price: 29.99, quantity: 2 },  // 59.98
			{ price: 9.99,  quantity: 1 }   // 9.99
		];
		// Expected total: 59.98 + 9.99 = 69.97

		// Act
		var sResult = formatter.formatCartTotal(aItems);

		// Assert
		assert.strictEqual(sResult, "$69.97",
			"Two items (29.99×2 + 9.99×1) should total '$69.97'");
	});

	QUnit.test("Should return '$0.00' for empty array", function (assert) {
		var sResult = formatter.formatCartTotal([]);

		assert.strictEqual(sResult, "$0.00",
			"Empty cart should show '$0.00'");
	});

	QUnit.test("Should return '$0.00' for null", function (assert) {
		var sResult = formatter.formatCartTotal(null);

		assert.strictEqual(sResult, "$0.00",
			"Null items should show '$0.00'");
	});

	QUnit.test("Should return '$0.00' for undefined", function (assert) {
		var sResult = formatter.formatCartTotal(undefined);

		assert.strictEqual(sResult, "$0.00",
			"Undefined items should show '$0.00'");
	});

	QUnit.test("Should handle a single item", function (assert) {
		var aItems = [
			{ price: 15.50, quantity: 3 }
		];

		var sResult = formatter.formatCartTotal(aItems);

		assert.strictEqual(sResult, "$46.50",
			"Single item 15.50×3 should total '$46.50'");
	});

	QUnit.test("Should handle items with zero quantity", function (assert) {
		// [INTERMEDIATE] A zero quantity means the item shouldn't
		// contribute to the total. This tests that the formatter
		// handles multiplication by zero correctly.
		var aItems = [
			{ price: 99.99, quantity: 0 },
			{ price: 10.00, quantity: 1 }
		];

		var sResult = formatter.formatCartTotal(aItems);

		assert.strictEqual(sResult, "$10.00",
			"Item with 0 quantity should not contribute to total");
	});

	QUnit.test("Should handle items with zero price", function (assert) {
		// [INTERMEDIATE] Free items (price = 0) are valid — promotions,
		// free samples, etc.
		var aItems = [
			{ price: 0, quantity: 5 },
			{ price: 25.00, quantity: 1 }
		];

		var sResult = formatter.formatCartTotal(aItems);

		assert.strictEqual(sResult, "$25.00",
			"Free item (price 0) should not affect total");
	});

	QUnit.test("Should handle items with string prices", function (assert) {
		// [INTERMEDIATE] JSON data from APIs often has string values.
		// The formatter uses parseFloat internally to handle this.
		var aItems = [
			{ price: "19.99", quantity: "2" }
		];

		var sResult = formatter.formatCartTotal(aItems);

		assert.strictEqual(sResult, "$39.98",
			"String price/quantity should be parsed and calculated correctly");
	});

	QUnit.test("Should handle items with missing price or quantity gracefully", function (assert) {
		// [ADVANCED] Defensive programming test — what if an item
		// has undefined/null price or quantity? The formatter uses
		// `|| 0` fallback to handle this.
		var aItems = [
			{ price: undefined, quantity: 2 },
			{ price: 10.00, quantity: undefined },
			{ price: 5.00, quantity: 3 }
		];

		var sResult = formatter.formatCartTotal(aItems);

		assert.strictEqual(sResult, "$15.00",
			"Items with missing price/quantity should default to 0");
	});
});
