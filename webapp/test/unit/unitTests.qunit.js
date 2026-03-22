/**
 * ============================================================================
 * FILE: unitTests.qunit.js — Unit Test Module Aggregator
 * PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 * NAMESPACE: com.shopeasy.app
 * ============================================================================
 *
 * [BEGINNER] WHAT IS THIS FILE?
 * ─────────────────────────────
 * This file is the "entry point" for all unit tests. Its only job is to
 * LOAD (require) every individual test module. Think of it as a table of
 * contents that tells QUnit: "Here are all the test files — run them all."
 *
 * When the HTML test runner (unitTests.qunit.html) finishes bootstrapping
 * UI5, it runs this file via the data-sap-ui-oninit attribute.
 *
 * [BEGINNER] WHY A SEPARATE AGGREGATOR FILE?
 * ──────────────────────────────────────────
 * You COULD list every test module directly in the HTML file, but that
 * gets messy fast. Keeping a single JS entry point gives you:
 *   1. Clean HTML (no test logic in the HTML page)
 *   2. Easy to add/remove test modules — just add/remove a line here
 *   3. Can be reused if you need multiple test runner pages
 *
 * [INTERMEDIATE] HOW QUnit TEST DISCOVERY WORKS IN UI5
 * ────────────────────────────────────────────────────
 * Unlike Jest (which auto-discovers *.test.js files), QUnit in UI5
 * requires EXPLICIT listing of test modules. You must manually add
 * each new test file here. This is deliberate — it avoids loading
 * unnecessary modules and gives you full control over test execution
 * order.
 *
 * [BEST PRACTICE] NAMING CONVENTIONS
 * ──────────────────────────────────
 * Mirror the source file structure in your test directory:
 *   Source:  webapp/model/formatter.js
 *   Test:    webapp/test/unit/model/formatter.js
 *
 *   Source:  webapp/model/models.js
 *   Test:    webapp/test/unit/model/models.js
 *
 * This 1:1 mapping makes it trivial to find the test for any source file.
 *
 * ============================================================================
 */

/**
 * [BEGINNER] sap.ui.define FOR TEST FILES
 * ═══════════════════════════════════════
 *
 * We use sap.ui.define just like in production code, but here the
 * "dependencies" are test modules instead of app modules.
 *
 * Each dependency path points to a test file that contains QUnit.module()
 * and QUnit.test() definitions. When sap.ui.define loads them, QUnit
 * automatically registers the tests and runs them.
 *
 * The factory function is empty because we don't need to do anything
 * after loading — the test modules register themselves with QUnit
 * as a side effect of being loaded.
 *
 * [INTERMEDIATE] The paths here are RELATIVE to this file's location.
 * "./model/formatter" means: same directory as this file + /model/formatter.js
 * This resolves to: webapp/test/unit/model/formatter.js
 *
 * [ADVANCED] If you have many test files, you can also use
 * sap.ui.require.preload() to bundle them for faster loading in CI.
 */
sap.ui.define([
	// ----------------------------------------------------------------
	// TEST MODULE: Formatter Tests
	// ----------------------------------------------------------------
	// Tests for webapp/model/formatter.js
	// Covers: formatPrice, formatAvailability, formatAvailabilityState,
	//         formatRating, formatDate, formatCartTotal
	"./model/formatter",

	// ----------------------------------------------------------------
	// TEST MODULE: Models Tests
	// ----------------------------------------------------------------
	// Tests for webapp/model/models.js
	// Covers: createDeviceModel (JSONModel creation, binding mode)
	"./model/models"

	// ----------------------------------------------------------------
	// [BEST PRACTICE] ADD NEW TEST MODULES HERE
	// ----------------------------------------------------------------
	// As you create new source modules, add their test files here.
	// For example, if you create webapp/model/cart.js, add:
	//   "./model/cart"
	//
	// If you create webapp/controller/ProductList.controller.js tests:
	//   "./controller/ProductList"

], function () {
	"use strict";

	// [BEGINNER] Nothing to do here!
	// The test modules register their tests with QUnit when they load.
	// QUnit collects all QUnit.module() and QUnit.test() calls and
	// runs them in order.
});
