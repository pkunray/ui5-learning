/**
 * ============================================================================
 * FILE: models.js — Unit Tests for the Models Module
 * PROJECT: ShopEasy - SAP UI5 Online Shopping Application
 * NAMESPACE: com.shopeasy.app.test.unit.model
 * ============================================================================
 *
 * [BEGINNER] WHAT DOES THIS FILE TEST?
 * ─────────────────────────────────────
 * This file tests webapp/model/models.js, specifically the
 * createDeviceModel() function. We verify that:
 *   1. It returns a JSONModel instance (correct type)
 *   2. The model's binding mode is set to OneWay (correct configuration)
 *   3. The model contains device information (correct data)
 *
 * [BEGINNER] TESTING OBJECT CREATION
 * ──────────────────────────────────
 * Unlike formatter tests (which test input→output transformations),
 * model tests verify that OBJECTS are created correctly:
 *   - Is it the right TYPE of object? (instanceof check)
 *   - Does it have the right CONFIGURATION? (binding mode)
 *   - Does it contain the right DATA? (device properties)
 *
 * [INTERMEDIATE] TESTING WITH UI5 CLASSES
 * ──────────────────────────────────────
 * When testing code that creates UI5 objects (models, controls, etc.),
 * you need to import the relevant UI5 classes so you can:
 *   - Use `instanceof` to verify the type
 *   - Access enum values (like BindingMode.OneWay)
 *   - Call methods on the returned objects (getProperty, etc.)
 *
 * [ADVANCED] TESTING WITH REAL vs. MOCK DEPENDENCIES
 * ─────────────────────────────────────────────────
 * In these tests, createDeviceModel() uses the REAL sap.ui.Device
 * object, which returns actual device info from the test browser.
 * For more controlled tests, you could use sinon.js to stub the
 * Device object and return predictable values. However, for a simple
 * factory function like this, testing with real dependencies is fine.
 *
 * ============================================================================
 */
sap.ui.define([
	// ----------------------------------------------------------------
	// DEPENDENCY 1: The models module we're testing
	// ----------------------------------------------------------------
	"com/shopeasy/app/model/models",

	// ----------------------------------------------------------------
	// DEPENDENCY 2: JSONModel class for instanceof checks
	// ----------------------------------------------------------------
	// [BEGINNER] We need to import JSONModel so we can verify that
	// createDeviceModel() returns an instance of this class.
	// The `instanceof` operator requires a reference to the class.
	"sap/ui/model/json/JSONModel",

	// ----------------------------------------------------------------
	// DEPENDENCY 3: BindingMode enum for mode verification
	// ----------------------------------------------------------------
	// [BEGINNER] We import BindingMode to compare against the model's
	// default binding mode without hardcoding strings.
	"sap/ui/model/BindingMode"

], function (models, JSONModel, BindingMode) {
	"use strict";

	/**
	 * ================================================================
	 * TEST MODULE: createDeviceModel
	 * ================================================================
	 *
	 * [BEGINNER] This module groups all tests for the createDeviceModel
	 * factory function. We test three aspects:
	 *   1. Return type (is it a JSONModel?)
	 *   2. Configuration (is binding mode OneWay?)
	 *   3. Data content (does it contain device properties?)
	 *
	 * [BEST PRACTICE] Test the CONTRACT of the function:
	 *   - WHAT it returns (type, shape)
	 *   - HOW it's configured (settings, modes)
	 *   - NOT implementation details (internal variable names, etc.)
	 *
	 * This way, if the implementation changes (e.g., using a different
	 * internal approach) but the contract stays the same, tests still pass.
	 */
	QUnit.module("createDeviceModel");

	QUnit.test("Should return a JSONModel instance", function (assert) {
		// Act: call the factory function
		var oModel = models.createDeviceModel();

		// Assert: verify the return type
		// [BEGINNER] `assert.ok(value, message)` checks that `value` is truthy.
		// Combined with `instanceof`, this verifies that createDeviceModel()
		// returned an object that IS a JSONModel (or extends from JSONModel).
		//
		// `instanceof` walks the prototype chain:
		//   oModel → JSONModel.prototype → Model.prototype → Object.prototype
		// If JSONModel.prototype is found anywhere in the chain, it returns true.
		assert.ok(oModel instanceof JSONModel,
			"createDeviceModel should return an instance of JSONModel");
	});

	QUnit.test("Should set the model to OneWay binding mode", function (assert) {
		// Act
		var oModel = models.createDeviceModel();

		// Assert
		// [BEGINNER] getDefaultBindingMode() returns the binding mode that
		// will be used for ANY property bound from this model, unless
		// overridden at the individual binding level.
		//
		// We compare against BindingMode.OneWay (the enum value) rather
		// than the string "OneWay" for type safety and refactoring resilience.
		assert.strictEqual(
			oModel.getDefaultBindingMode(),
			BindingMode.OneWay,
			"Device model binding mode should be OneWay (read-only)"
		);
	});

	QUnit.test("Should contain device system information", function (assert) {
		// Act
		var oModel = models.createDeviceModel();

		// Assert: the model should have system properties
		// [BEGINNER] getProperty("/path") reads a value from the model's
		// internal JSON data. The "/" prefix means "start from the root".
		// "/system" accesses the top-level "system" property.
		//
		// [INTERMEDIATE] The actual values (true/false) depend on the
		// device running the tests. On a desktop browser:
		//   system.desktop = true, system.phone = false, system.tablet = false
		// On a phone browser:
		//   system.desktop = false, system.phone = true, system.tablet = false
		//
		// We don't test for specific values — just that the properties EXIST
		// and are booleans. This makes the test pass on any device.
		var oSystem = oModel.getProperty("/system");

		assert.ok(oSystem !== undefined && oSystem !== null,
			"Model should contain a '/system' property");

		// [INTERMEDIATE] typeof check ensures the values are boolean,
		// not strings or numbers. This validates the data shape.
		assert.strictEqual(typeof oSystem.desktop, "boolean",
			"system.desktop should be a boolean value");
		assert.strictEqual(typeof oSystem.phone, "boolean",
			"system.phone should be a boolean value");
		assert.strictEqual(typeof oSystem.tablet, "boolean",
			"system.tablet should be a boolean value");
	});

	QUnit.test("Should contain device OS information", function (assert) {
		// Act
		var oModel = models.createDeviceModel();

		// Assert: the model should have OS information
		// [BEGINNER] The /os property contains operating system details:
		//   { name: "win", version: 10, versionStr: "10", ... }
		var oOS = oModel.getProperty("/os");

		assert.ok(oOS !== undefined && oOS !== null,
			"Model should contain a '/os' property with OS information");
	});

	QUnit.test("Should contain device browser information", function (assert) {
		// Act
		var oModel = models.createDeviceModel();

		// Assert
		// [BEGINNER] The /browser property contains browser details:
		//   { name: "cr" (Chrome), version: 112, ... }
		var oBrowser = oModel.getProperty("/browser");

		assert.ok(oBrowser !== undefined && oBrowser !== null,
			"Model should contain a '/browser' property with browser information");
	});

	QUnit.test("Should NOT have TwoWay binding mode", function (assert) {
		// [INTERMEDIATE] This is a NEGATIVE test — we explicitly verify
		// that the model is NOT in TwoWay mode. Negative tests ensure
		// that incorrect configurations are caught.
		//
		// [BEST PRACTICE] Include at least one negative test per module
		// to verify that common misconfigurations are absent.
		var oModel = models.createDeviceModel();

		assert.notStrictEqual(
			oModel.getDefaultBindingMode(),
			BindingMode.TwoWay,
			"Device model should NOT be TwoWay (would allow accidental writes)"
		);
	});
});
