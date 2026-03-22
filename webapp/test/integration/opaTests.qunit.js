/**
 * ============================================================================
 * FILE: opaTests.qunit.js — OPA5 Integration Test Module Aggregator
 * PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 * NAMESPACE: com.shopeasy.app
 * ============================================================================
 *
 * [BEGINNER] WHAT IS THIS FILE?
 * ─────────────────────────────
 * This is the entry point for all OPA5 integration tests, similar to how
 * unitTests.qunit.js aggregates unit tests. It loads all "journey" test
 * modules that simulate user interactions with the application.
 *
 * [BEGINNER] WHAT ARE "JOURNEYS"?
 * ──────────────────────────────
 * In OPA5 testing, a "journey" represents a complete USER FLOW through
 * the application. Think of it as a story:
 *
 *   NavigationJourney: "A user opens the app, clicks on a category,
 *     views products, then navigates back."
 *
 *   ShoppingJourney: "A user searches for a product, views its details,
 *     adds it to the cart, and reviews the cart."
 *
 * Each journey file contains multiple opaTest() calls that form a
 * sequential narrative of user actions.
 *
 * [INTERMEDIATE] JOURNEY ORGANIZATION
 * ──────────────────────────────────
 * Common ways to organize journeys:
 *   - By feature:     NavigationJourney, ShoppingJourney, CheckoutJourney
 *   - By user persona: AdminJourney, CustomerJourney, GuestJourney
 *   - By page:        HomeJourney, ProductListJourney, CartJourney
 *
 * [BEST PRACTICE] Keep each journey focused on ONE user flow.
 * A journey that tests everything becomes hard to debug when it fails.
 *
 * ============================================================================
 */
sap.ui.define([
	// ----------------------------------------------------------------
	// JOURNEY 1: Navigation Tests
	// ----------------------------------------------------------------
	// Tests that the router correctly navigates between pages and that
	// the app loads the expected views for each URL hash.
	"./journeys/NavigationJourney",

	// ----------------------------------------------------------------
	// JOURNEY 2: Shopping Flow Tests
	// ----------------------------------------------------------------
	// Tests the core shopping experience: browsing products, searching,
	// viewing details, and adding items to the cart.
	"./journeys/ShoppingJourney"

	// ----------------------------------------------------------------
	// [BEST PRACTICE] ADD NEW JOURNEYS HERE
	// ----------------------------------------------------------------
	// As you implement more features, add journey tests:
	//   "./journeys/CheckoutJourney"    ← checkout flow
	//   "./journeys/UserAccountJourney" ← login/profile flow
	//   "./journeys/AdminJourney"       ← admin panel flow

], function () {
	"use strict";

	// [BEGINNER] Like the unit test aggregator, the factory function
	// is empty. Journey modules register their tests with QUnit/OPA5
	// when they're loaded.
});
