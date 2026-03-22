/**
 * ============================================================================
 * FILE: models.js — Device & App-Level Model Factory
 * NAMESPACE: com.shopeasy.app.model
 * ============================================================================
 *
 * [BEGINNER] WHAT IS THIS FILE?
 * -----------------------------------------------------------------------
 * This file is a "model factory". Its single job is to create model objects
 * that the rest of your application can use. In SAP UI5, a "model" is a
 * JavaScript object that holds DATA and notifies the UI whenever that data
 * changes. Think of it like a live spreadsheet — when a cell value changes,
 * every chart that references that cell updates automatically.
 *
 * In Model-View-Controller (MVC) architecture:
 *   • Model  → the DATA layer       (this file creates models)
 *   • View   → the UI / XML views   (displays data from models)
 *   • Controller → the LOGIC layer  (reacts to user actions)
 *
 * [BEGINNER] WHY A SEPARATE FILE?
 * -----------------------------------------------------------------------
 * Keeping model creation in its own module follows the "Separation of
 * Concerns" principle. Your Component.js calls `models.createDeviceModel()`
 * without caring HOW the model is built. If you later need to add default
 * values or change the model type, you only edit this one file.
 *
 * [BEGINNER] WHAT IS sap.ui.define?
 * -----------------------------------------------------------------------
 * `sap.ui.define` is SAP UI5's module system (similar to ES modules or
 * AMD/RequireJS). It lets you:
 *   1. Declare dependencies (other modules you need)
 *   2. Receive those dependencies as function parameters
 *   3. Return a public API that other modules can import
 *
 * Syntax:
 *   sap.ui.define(
 *     [array of dependency paths],
 *     function(Dep1, Dep2, ...) {
 *       // module body — use Dep1, Dep2, etc.
 *       return publicAPI;
 *     }
 *   );
 *
 * The dependency paths use forward-slashes (like URLs), NOT dots.
 *   ✓  "sap/ui/model/json/JSONModel"
 *   ✗  "sap.ui.model.json.JSONModel"
 *
 * [GOTCHA] The ORDER of the dependency array MUST match the order of
 * the function parameters. If you swap two paths but not the params,
 * you'll silently get the wrong class assigned to the wrong variable.
 *
 * ============================================================================
 */
sap.ui.define(
	[
		// ----------------------------------------------------------------
		// DEPENDENCY 1: JSONModel
		// ----------------------------------------------------------------
		// [BEGINNER] JSONModel is the most commonly used model type in UI5.
		// It stores data as a plain JavaScript object (JSON) in the
		// browser's memory (client-side). It's perfect for:
		//   • Small to medium data sets
		//   • Device information, user preferences, UI state
		//   • Offline / mock data during development
		//
		// Other model types you'll encounter later:
		//   • ODataModel (v2 & v4) — talks to a remote OData service
		//   • XMLModel             — parses XML data
		//   • ResourceModel        — handles i18n translation texts
		//
		// [INTERMEDIATE] JSONModel loads ALL data into memory at once.
		// For large datasets (thousands of rows), consider ODataModel
		// which supports server-side paging, filtering, and sorting.
		"sap/ui/model/json/JSONModel",

		// ----------------------------------------------------------------
		// DEPENDENCY 2: BindingMode
		// ----------------------------------------------------------------
		// [BEGINNER] BindingMode is an enum (a set of named constants)
		// that controls HOW data flows between Model ↔ View:
		//
		//   BindingMode.OneWay
		//     Model → View only.
		//     When the model changes, the UI updates.
		//     When the user types in an input field, the model does NOT update.
		//     This is the DEFAULT for JSONModel.
		//
		//   BindingMode.TwoWay
		//     Model ↔ View (both directions).
		//     User input automatically writes back to the model.
		//     Useful for forms, editable tables, etc.
		//     This is the DEFAULT for JSONModel too (yes, both are defaults
		//     depending on the control — see GOTCHA below).
		//
		//   BindingMode.OneTime
		//     Model → View ONCE at initial binding.
		//     After the first read, the view never updates, even if the
		//     model changes. Great for static labels that never change
		//     (e.g., app title from config).
		//
		// [GOTCHA] JSONModel's default binding mode is actually TwoWay.
		// That means if you bind an Input field to a JSONModel property,
		// typing in the field will CHANGE the model data. For read-only
		// models like Device info, we explicitly set OneWay to prevent
		// accidental writes. Always think about which direction you need.
		//
		// [ANTI-PATTERN] Using TwoWay binding on data that should be
		// read-only (like device info) can cause subtle bugs where the
		// UI accidentally mutates shared state.
		"sap/ui/model/BindingMode",

		// ----------------------------------------------------------------
		// DEPENDENCY 3: Device
		// ----------------------------------------------------------------
		// [BEGINNER] `sap.ui.Device` is a utility object that provides
		// information about the user's device and browser:
		//   • Device.system  — { phone: true/false, tablet: true/false, desktop: true/false }
		//   • Device.os      — { name: "win", version: 10, ... }
		//   • Device.browser — { name: "cr" (Chrome), version: 91, ... }
		//   • Device.support — { touch: true/false, orientation: true/false, ... }
		//   • Device.resize  — attaches to window resize events
		//   • Device.media   — responsive breakpoint helpers
		//
		// We wrap this object in a JSONModel so we can bind to it in XML views.
		// For example, in a view you could write:
		//   <FlexBox visible="{device>/system/phone}">
		//     This content only shows on phones
		//   </FlexBox>
		//
		// [INTERMEDIATE] The "device>" prefix is the MODEL NAME. When you
		// set a model on the component with a name:
		//   this.setModel(oModel, "device");
		// then in views you reference it as {device>/property}.
		// A model set WITHOUT a name is the "default" model, referenced
		// simply as {/property} (no prefix).
		"sap/ui/Device"
	],

	/**
	 * Module factory function.
	 *
	 * [BEGINNER] This function receives the three dependencies listed
	 * above, in the SAME ORDER. The return value becomes the module's
	 * public API — whatever we return here is what other files get when
	 * they list "com/shopeasy/app/model/models" as a dependency.
	 *
	 * @param {typeof sap.ui.model.json.JSONModel} JSONModel - Constructor for JSON models
	 * @param {typeof sap.ui.model.BindingMode} BindingMode - Enum of binding mode constants
	 * @param {typeof sap.ui.Device} Device - Device detection utility
	 * @returns {object} An object with model-creation helper methods
	 */
	function (JSONModel, BindingMode, Device) {
		"use strict";
		// [BEST PRACTICE] "use strict" enables JavaScript strict mode
		// inside this function scope. It catches common mistakes:
		//   • Using undeclared variables → throws ReferenceError
		//   • Assigning to read-only properties → throws TypeError
		//   • Deleting undeletable properties → throws TypeError
		// Always include it at the top of every UI5 module.

		/**
		 * ================================================================
		 * PUBLIC API
		 * ================================================================
		 *
		 * [BEGINNER] We return a plain object whose properties are the
		 * functions we want to expose. Any file that imports this module
		 * can call:
		 *   models.createDeviceModel()
		 *
		 * [BEST PRACTICE] Only expose what's necessary. Keep internal
		 * helper functions as local `function` declarations inside the
		 * sap.ui.define callback — they won't be accessible from outside.
		 */
		return {

			/**
			 * ============================================================
			 * createDeviceModel()
			 * ============================================================
			 *
			 * [BEGINNER] PURPOSE:
			 * Creates a JSONModel pre-loaded with information about the
			 * user's device (phone vs tablet vs desktop, browser, OS, etc.)
			 * and sets its binding mode to OneWay so no view can
			 * accidentally modify this data.
			 *
			 * [BEGINNER] WHERE IS THIS CALLED?
			 * Typically in your Component.js `init()` method:
			 *
			 *   // Component.js
			 *   init: function () {
			 *     // ... other setup ...
			 *     this.setModel(models.createDeviceModel(), "device");
			 *   }
			 *
			 * This makes the device model available to EVERY view and
			 * controller in the app under the name "device".
			 *
			 * [BEGINNER] HOW TO USE IN XML VIEWS:
			 *
			 *   <!-- Show a panel only on desktop -->
			 *   <Panel visible="{device>/system/desktop}">
			 *     <Text text="You're on a desktop browser!" />
			 *   </Panel>
			 *
			 *   <!-- Adjust column count based on device -->
			 *   <f:GridList items="{/products}">
			 *     <!-- More columns on desktop, fewer on phone -->
			 *   </f:GridList>
			 *
			 * [INTERMEDIATE] HOW TO USE IN CONTROLLERS:
			 *
			 *   onInit: function () {
			 *     var oDeviceModel = this.getOwnerComponent().getModel("device");
			 *     var bIsPhone = oDeviceModel.getProperty("/system/phone");
			 *     if (bIsPhone) {
			 *       // Adjust layout for phone
			 *     }
			 *   }
			 *
			 * [ADVANCED] WHY OneWay BINDING?
			 * The Device object is detected once at startup. It would be
			 * nonsensical for a view to "write back" and change whether
			 * the device is a phone. OneWay prevents TwoWay controls
			 * (like Input fields) from accidentally writing to this model.
			 *
			 * If you ever need a WRITABLE model for UI state (like a
			 * sidebar toggle), create a SEPARATE JSONModel with TwoWay
			 * binding (which is JSONModel's default).
			 *
			 * [BEST PRACTICE] Name your models descriptively:
			 *   ✓ "device"      — clear, everyone knows what it holds
			 *   ✗ "d"           — too cryptic
			 *   ✗ (no name)     — conflicts with other unnamed models
			 *
			 * [ANTI-PATTERN] Don't put everything into one giant model.
			 * Separate concerns: device info in "device", cart data in
			 * "cart", view state in "appView", etc.
			 *
			 * @public
			 * @returns {sap.ui.model.json.JSONModel} The device model with
			 *          OneWay binding mode, ready to be set on a component
			 */
			createDeviceModel: function () {

				// ---------------------------------------------------------
				// Step 1: Create a new JSONModel with Device data
				// ---------------------------------------------------------
				// [BEGINNER] The JSONModel constructor accepts a JavaScript
				// object (or a URL string pointing to a .json file). Here
				// we pass the `Device` object directly. The model will
				// wrap it and make every property bindable.
				//
				// After this line, the model's internal data looks like:
				// {
				//   system:  { phone: false, tablet: false, desktop: true, combi: false },
				//   os:      { name: "win", version: 10, versionStr: "10", ... },
				//   browser: { name: "cr", version: 112, ... },
				//   support: { touch: false, pointer: true, ... },
				//   ...
				// }
				//
				// [GOTCHA] `Device` is a LIVE object. Some properties
				// (like Device.resize or Device.orientation) can change at
				// runtime. Because JSONModel holds a REFERENCE to the
				// object (not a deep copy), changes to Device properties
				// will be reflected in the model — BUT the model won't
				// automatically fire change events. If you need reactive
				// updates for orientation changes, you'd attach an event
				// handler and call oModel.refresh() manually.
				var oModel = new JSONModel(Device);

				// ---------------------------------------------------------
				// Step 2: Set the default binding mode to OneWay
				// ---------------------------------------------------------
				// [BEGINNER] This line says: "For ANY property bound from
				// this model, data flows Model → View only."
				//
				// Without this line, JSONModel defaults to TwoWay, which
				// means an <Input value="{device>/os/name}"/> would let
				// the user TYPE a new OS name and it would update the
				// model. That's clearly wrong for device info.
				//
				// [INTERMEDIATE] `setDefaultBindingMode` sets the mode
				// for ALL bindings created from this model. You can
				// override it per-binding in XML:
				//   <Text text="{
				//     path: 'device>/os/name',
				//     mode: 'OneTime'
				//   }" />
				// But setting the default saves you from repeating it
				// everywhere and prevents mistakes.
				//
				// [BEST PRACTICE] Always explicitly set the binding mode
				// when creating models. Don't rely on defaults — they
				// differ between model types:
				//   • JSONModel default → TwoWay
				//   • ODataModel v2     → OneWay (server data shouldn't
				//                         change from UI without explicit save)
				//   • ResourceModel     → OneTime (translations don't change)
				oModel.setDefaultBindingMode(BindingMode.OneWay);

				// ---------------------------------------------------------
				// Step 3: Return the configured model
				// ---------------------------------------------------------
				// [BEGINNER] The caller (Component.js) receives this model
				// and attaches it to the component:
				//   this.setModel(oModel, "device");
				//
				// From that point on, every view, fragment, and controller
				// in the app can access it:
				//   View:       {device>/system/phone}
				//   Controller: this.getView().getModel("device")
				//   Component:  this.getModel("device")
				return oModel;
			}
		};
	}
);
