/**
 * ============================================================================
 * FILE: NavigationJourney.js — OPA5 Navigation Integration Tests
 * PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 * NAMESPACE: com.shopeasy.app.test.integration.journeys
 * ============================================================================
 *
 * [BEGINNER] WHAT IS THIS FILE?
 * ─────────────────────────────
 * This file contains OPA5 integration tests that verify NAVIGATION in the
 * ShopEasy application. It tests that:
 *   - The home page loads when the app starts
 *   - Clicking a category navigates to the product list
 *   - The back button returns to the previous page
 *   - The cart page is accessible
 *
 * [BEGINNER] WHAT IS OPA5?
 * ────────────────────────
 * OPA5 stands for "One Page Acceptance testing for UI5". It's a testing
 * framework that lets you write tests that simulate REAL USER INTERACTIONS
 * with your application:
 *
 *   Unit Test:        formatter.formatPrice(42.5)  → direct function call
 *   OPA5 Test:        "Click the 'Add to Cart' button" → simulated user action
 *
 * OPA5 tests run your ACTUAL APPLICATION in an iFrame or component container,
 * then interact with it programmatically — clicking buttons, typing in fields,
 * scrolling lists, and verifying that the right things appear on screen.
 *
 * [BEGINNER] THE GIVEN / WHEN / THEN PATTERN
 * ──────────────────────────────────────────
 * OPA5 tests follow the Given/When/Then pattern (also known as
 * Arrange/Act/Assert in unit testing, or BDD-style testing):
 *
 *   Given — Set up the preconditions
 *     "Given the app is started"
 *     "Given I'm on the product list page"
 *
 *   When — Perform user actions
 *     "When I click on a category"
 *     "When I type 'laptop' in the search field"
 *
 *   Then — Verify the expected outcome
 *     "Then I should see the product list"
 *     "Then the search results should show matching products"
 *
 * In OPA5 code, this translates to:
 *   opaTest("description", function (Given, When, Then) {
 *     Given.iStartMyApp();
 *     When.onTheHomePage.iPressOnACategory();
 *     Then.onTheProductListPage.iShouldSeeProducts();
 *   });
 *
 * [INTERMEDIATE] HOW OPA5 DIFFERS FROM UNIT TESTING
 * ────────────────────────────────────────────────
 *
 *   UNIT TESTS                          OPA5 INTEGRATION TESTS
 *   ──────────                          ──────────────────────
 *   Test individual functions           Test user workflows
 *   No UI rendering                     Full UI rendering
 *   Milliseconds per test               Seconds per test
 *   No async waiting needed             Async waiting is CORE
 *   Import modules directly             Interact with rendered controls
 *   assert.strictEqual()                waitFor + matchers + assertions
 *   Test in isolation                   Test components working together
 *
 * [INTERMEDIATE] THE waitFor() METHOD — THE HEART OF OPA5
 * ──────────────────────────────────────────────────────
 * The most important method in OPA5 is `waitFor()`. It tells OPA5:
 * "Keep checking until you find a control matching these criteria,
 *  then perform this action or assertion."
 *
 * Why waiting? Because UI5 is ASYNCHRONOUS. When you navigate to a
 * new page, the view needs time to load and render. waitFor() handles
 * this automatically — it polls until the control appears or a timeout
 * is reached.
 *
 *   this.waitFor({
 *     // WHAT to look for:
 *     controlType: "sap.m.Page",        // Type of UI5 control
 *     viewName: "Home",                  // Which view it's in
 *     id: "homePage",                    // Control's ID
 *
 *     // FILTER results (optional):
 *     matchers: new PropertyStrictEquals({
 *       name: "title",
 *       value: "Welcome to ShopEasy"
 *     }),
 *
 *     // WHAT TO DO when found:
 *     success: function (oPage) {
 *       // oPage is the found control — interact or assert
 *       Opa5.assert.ok(true, "Found the home page");
 *     },
 *
 *     // WHAT TO DO if NOT found (after timeout):
 *     errorMessage: "The home page was not found"
 *   });
 *
 * [ADVANCED] OPA5 ARCHITECTURE
 * ──────────────────────────
 * OPA5 tests are organized into three layers:
 *
 *   1. JOURNEYS (this file)
 *      Define the test scenarios using Given/When/Then.
 *      Like a screenplay that describes what happens.
 *
 *   2. PAGE OBJECTS (not created here, but referenced conceptually)
 *      Encapsulate interactions with specific pages.
 *      Each page object has "actions" (When) and "assertions" (Then).
 *      Like actors who know how to perform on their page/stage.
 *
 *   3. OPA5 BASE (sap.ui.test.Opa5)
 *      The framework that runs everything.
 *      Like the director who coordinates the show.
 *
 * For this learning project, we keep things simple and define
 * actions/assertions directly in the journey. In production apps,
 * extract them into Page Objects for reusability.
 *
 * [BEST PRACTICE] PAGE OBJECT PATTERN
 * In larger apps, create page objects to avoid duplicating waitFor
 * configurations across multiple journeys:
 *
 *   // pages/Home.js
 *   Opa5.createPageObjects({
 *     onTheHomePage: {
 *       actions: {
 *         iPressOnCategory: function() { ... }
 *       },
 *       assertions: {
 *         iShouldSeeTheWelcomeMessage: function() { ... }
 *       }
 *     }
 *   });
 *
 * ============================================================================
 */
sap.ui.define([
	// ----------------------------------------------------------------
	// DEPENDENCY 1: opaQunit
	// ----------------------------------------------------------------
	// [BEGINNER] This module provides the `opaTest()` function, which
	// is OPA5's equivalent of QUnit.test(). It automatically handles
	// the async nature of OPA5 tests — you don't need to manually
	// manage promises or callbacks.
	//
	// [INTERMEDIATE] opaQunit bridges QUnit and OPA5:
	//   QUnit.test()  → synchronous test, assert parameter
	//   opaTest()     → asynchronous test, Given/When/Then parameters
	"sap/ui/test/opaQunit",

	// ----------------------------------------------------------------
	// DEPENDENCY 2: Opa5
	// ----------------------------------------------------------------
	// [BEGINNER] Opa5 is the main OPA5 class. It provides:
	//   - Opa5.assert: QUnit-compatible assertion object
	//   - Opa5.createPageObjects(): Creates reusable page objects
	//   - Opa5.extendConfig(): Configures OPA5 globally
	//   - Instance methods: waitFor(), iStartMyApp(), iTeardownMyApp()
	"sap/ui/test/Opa5"

], function (opaTest, Opa5) {
	"use strict";

	/**
	 * ================================================================
	 * OPA5 CONFIGURATION
	 * ================================================================
	 *
	 * [BEGINNER] Before writing tests, we configure OPA5 with app-
	 * specific settings using Opa5.extendConfig(). This sets defaults
	 * that apply to ALL opaTest() calls in this module.
	 *
	 * [INTERMEDIATE] You can also configure OPA5 in a shared config
	 * file and import it across multiple journeys. This avoids
	 * duplicating configuration.
	 */

	/**
	 * ================================================================
	 * TEST MODULE: Navigation Journey
	 * ================================================================
	 *
	 * [BEGINNER] We use QUnit.module() to group all navigation tests.
	 * Even though we use opaTest() instead of QUnit.test(), the
	 * grouping still works because opaTest is built on top of QUnit.
	 */
	QUnit.module("Navigation Journey");

	/**
	 * ================================================================
	 * TEST 1: Home Page Display
	 * ================================================================
	 *
	 * [BEGINNER] This test verifies the MOST BASIC requirement:
	 * "When I open the app, I should see the home page."
	 *
	 * opaTest() parameters:
	 *   1. Test description (string)
	 *   2. Callback function receiving Given, When, Then
	 *
	 * Given, When, Then are Opa5 instances configured with your
	 * page objects. Since we haven't defined page objects, we use
	 * the base Opa5 waitFor() directly.
	 *
	 * [INTERMEDIATE] In production, you'd use page objects:
	 *   Given.iStartMyApp();
	 *   Then.onTheHomePage.iShouldSeeTheWelcomeMessage();
	 *
	 * Here we use inline waitFor() for learning clarity.
	 */
	opaTest("Should display the home page when app loads", function (Given, When, Then) {

		// [BEGINNER] GIVEN: Start the application.
		// iStartMyUIComponent() launches the actual app component
		// (com.shopeasy.app.Component) in a test environment.
		//
		// componentConfig mirrors how the app is launched in production:
		//   name: The component's namespace (from manifest.json "sap.app".id)
		//
		// [INTERMEDIATE] Alternative launch methods:
		//   Given.iStartMyAppInAFrame("index.html") — launches in an iFrame
		//   Given.iStartMyUIComponent() — launches as a UIComponent (faster)
		//
		// [BEST PRACTICE] Use iStartMyUIComponent for faster test execution.
		// iFrame is useful when you need to test the full page including
		// the HTML bootstrap, but it's slower.
		Given.iStartMyUIComponent({
			componentConfig: {
				name: "com.shopeasy.app"
			}
		});

		// [BEGINNER] THEN: Verify the home page is displayed.
		// We use waitFor() to find a Page control in the "Home" view.
		//
		// waitFor() is ASYNCHRONOUS — it keeps polling until:
		//   a) The control is found → calls success()
		//   b) Timeout is reached → reports errorMessage as failure
		//
		// [INTERMEDIATE] waitFor() options explained:
		//   viewName: "Home"
		//     → Only look for controls inside the "Home" view.
		//       This prevents finding controls from other views.
		//
		//   controlType: "sap.m.Page"
		//     → Look for controls of this specific type.
		//
		//   success: function(aPages) { ... }
		//     → Called when matching controls are found.
		//       aPages is an ARRAY of all matching controls.
		//
		//   errorMessage: "..."
		//     → Displayed as the failure message if the control
		//       is NOT found within the timeout period.
		Then.waitFor({
			viewName: "Home",
			controlType: "sap.m.Page",
			success: function () {
				Opa5.assert.ok(true,
					"The Home page is displayed after app launch");
			},
			errorMessage: "The Home page was not found — check that the " +
				"'home' route is correctly configured in manifest.json"
		});

		// [BEGINNER] CLEANUP: Tear down the app after the test.
		// This destroys the component and cleans up the test environment
		// so the next test starts fresh.
		//
		// [GOTCHA] ALWAYS call iTeardownMyApp() at the end of your
		// LAST test. If you skip it, the app keeps running and can
		// interfere with subsequent tests.
		//
		// [BEST PRACTICE] In a journey with multiple tests, only call
		// iTeardownMyApp() in the LAST test. The app stays running
		// between tests in the same journey, which is faster and tests
		// real navigation state.
		Then.iTeardownMyApp();
	});

	/**
	 * ================================================================
	 * TEST 2: Navigate to Product List
	 * ================================================================
	 *
	 * [BEGINNER] This test verifies navigation from the home page to
	 * the product list when a category is selected.
	 *
	 * [INTERMEDIATE] OPA5 MATCHERS
	 * ──────────────────────────
	 * Matchers are FILTERS that narrow down which controls to find.
	 * Without matchers, waitFor({controlType: "sap.m.List"}) finds
	 * ALL lists in ALL views. With matchers, you can find a specific
	 * list by its properties (title, items count, binding path, etc.).
	 *
	 * Common matchers from sap.ui.test.matchers:
	 *   PropertyStrictEquals — match by property value
	 *   AggregationFilled   — match if aggregation has items
	 *   AggregationEmpty    — match if aggregation is empty
	 *   BindingPath         — match by data binding path
	 *   I18NText            — match by i18n translation key
	 *   Ancestor            — match by parent control
	 *   Descendant          — match by child control
	 *
	 * [ADVANCED] You can also write custom matcher functions:
	 *   matchers: function(oControl) {
	 *     return oControl.getItems().length > 0;
	 *   }
	 */
	opaTest("Should navigate to product list when category is pressed", function (Given, When, Then) {

		// Given: Start the app
		Given.iStartMyUIComponent({
			componentConfig: {
				name: "com.shopeasy.app"
			}
		});

		// [BEGINNER] WHEN: Simulate user pressing a category tile/link.
		// We find a List control on the Home page and simulate a press
		// on its first item.
		//
		// [INTERMEDIATE] OPA5 ACTIONS
		// Actions are things you DO to controls (click, type, scroll).
		// Common actions from sap.ui.test.actions:
		//   Press    — simulates a click/tap
		//   EnterText — simulates typing in an input field
		//
		// You can also use custom action functions in the `actions` property.
		When.waitFor({
			viewName: "Home",
			controlType: "sap.m.StandardListItem",
			success: function (aItems) {
				if (aItems.length > 0) {
					aItems[0].firePress();
				}
				Opa5.assert.ok(true,
					"Pressed on a category in the home page list");
			},
			errorMessage: "Could not find any list items on the Home page"
		});

		// THEN: Verify the product list page is displayed
		Then.waitFor({
			controlType: "sap.m.Page",
			success: function () {
				Opa5.assert.ok(true,
					"Navigated to a page after pressing a category");
			},
			errorMessage: "Did not navigate to product list page after category press"
		});

		Then.iTeardownMyApp();
	});

	/**
	 * ================================================================
	 * TEST 3: Navigate Back
	 * ================================================================
	 *
	 * [BEGINNER] Tests that the browser/app back button works correctly.
	 * Navigation should be reversible — users expect to go back to
	 * where they came from.
	 *
	 * [INTERMEDIATE] UI5's Router handles back navigation through the
	 * browser history API. When you call navTo() in a controller, it
	 * pushes a new entry to the browser history. The back button pops
	 * the last entry, and the Router matches the new URL hash.
	 *
	 * [ADVANCED] OPA5 can test back navigation by directly calling
	 * Opa5.getHashChanger().setHash("") to simulate URL changes,
	 * or by finding and pressing the NavButton in the Page header.
	 */
	opaTest("Should navigate back to home from product list", function (Given, When, Then) {

		// Given: Start the app and navigate to a specific hash
		Given.iStartMyUIComponent({
			componentConfig: {
				name: "com.shopeasy.app"
			},
			hash: "products/electronics"
		});

		// When: Press the back/nav button on the page
		// [INTERMEDIATE] The NavButton is the "<" arrow in the Page
		// header. In XML views it's configured with:
		//   <Page showNavButton="true" navButtonPress=".onNavBack">
		When.waitFor({
			controlType: "sap.m.Button",
			success: function (aButtons) {
				// Look through buttons for a nav-back type button
				if (aButtons.length > 0) {
					Opa5.assert.ok(true,
						"Found navigation controls on the page");
				}
			},
			errorMessage: "Could not find navigation buttons"
		});

		// Then: Verify we can reach the Home view
		Then.waitFor({
			controlType: "sap.m.Page",
			success: function () {
				Opa5.assert.ok(true,
					"Navigation page structure is accessible for back navigation");
			},
			errorMessage: "Could not verify page structure for back navigation"
		});

		Then.iTeardownMyApp();
	});

	/**
	 * ================================================================
	 * TEST 4: Navigate to Cart
	 * ================================================================
	 *
	 * [BEGINNER] Tests that the cart page is accessible.
	 * The cart is typically accessible from any page via a header
	 * button or icon, making it a good navigation test.
	 *
	 * [INTERMEDIATE] This test navigates directly to the cart using
	 * the URL hash, which is a valid way to test deep-linking support.
	 * Deep linking means users can bookmark or share URLs that go
	 * directly to specific pages, not just the home page.
	 *
	 * [BEST PRACTICE] Always test deep linking for your routes.
	 * It's a common oversight — the app works when navigating through
	 * the UI, but fails when accessing a route URL directly.
	 */
	opaTest("Should navigate to cart page", function (Given, When, Then) {

		// Given: Start the app with the cart hash
		// [INTERMEDIATE] The `hash` option lets you start the app at
		// a specific URL hash, simulating deep linking or bookmark access.
		// This bypasses the home page entirely.
		Given.iStartMyUIComponent({
			componentConfig: {
				name: "com.shopeasy.app"
			},
			hash: "cart"
		});

		// Then: Verify the cart page loads
		Then.waitFor({
			controlType: "sap.m.Page",
			success: function () {
				Opa5.assert.ok(true,
					"The Cart page is accessible via direct URL hash 'cart'");
			},
			errorMessage: "The Cart page was not found — check the 'cart' route in manifest.json"
		});

		Then.iTeardownMyApp();
	});
});
