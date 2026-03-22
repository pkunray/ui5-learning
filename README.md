# SAP UI5 Learning Project: ShopEasy - Online Shopping Application

> A comprehensive, hands-on learning project that teaches you **everything** about SAP UI5
> by building a complete online shopping application from scratch.

---

## Table of Contents

- [Who Is This For?](#who-is-this-for)
- [What You Will Learn](#what-you-will-learn)
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Learning Path](#learning-path)
- [How to Read This Project](#how-to-read-this-project)
- [Running Tests](#running-tests)
- [Key Concepts Quick Reference](#key-concepts-quick-reference)
- [Resources](#resources)

---

## Who Is This For?

This project is designed for developers who:
- Know basic HTML (tags, attributes, DOM structure)
- Know basic JavaScript (variables, functions, objects, arrays, callbacks)
- Have minimal CSS knowledge
- Have a little React.js experience (helps understand component thinking)
- Want to become proficient SAP UI5 developers
- Are targeting a role building commercial SAP applications

---

## What You Will Learn

### Fundamentals (Modules 00-03)
| Module | Topic | Key Skills |
|--------|-------|------------|
| 00 | [Prerequisites & Setup](docs/00-prerequisites.md) | Node.js, npm, UI5 CLI, browser DevTools |
| 01 | [Architecture & MVC](docs/01-architecture.md) | MVC pattern, Component-based arch, App Descriptor |
| 02 | [Views & Controllers](docs/02-views-and-controllers.md) | XML Views, Controller lifecycle, Event handling |
| 03 | [Data Binding](docs/03-data-binding.md) | Property/Aggregation/Expression binding, Binding modes |

### Core Skills (Modules 04-08)
| Module | Topic | Key Skills |
|--------|-------|------------|
| 04 | [Models](docs/04-models.md) | JSONModel, ODataModel, ResourceModel, Device model |
| 05 | [Routing & Navigation](docs/05-routing.md) | Router config, Route matching, URL parameters, Deep linking |
| 06 | [Controls Deep Dive](docs/06-controls.md) | Lists, Tables, Forms, Inputs, Toolbars, Icons |
| 07 | [Fragments & Dialogs](docs/07-fragments-and-dialogs.md) | Reusable UI pieces, Dialog lifecycle, MessageBox, MessageToast |
| 08 | [Internationalization (i18n)](docs/08-i18n.md) | Resource bundles, Pluralization, Date/Number formatting |

### Intermediate Skills (Modules 09-12)
| Module | Topic | Key Skills |
|--------|-------|------------|
| 09 | [Formatting & Validation](docs/09-formatting.md) | Custom formatters, Types, Constraints, Input validation |
| 10 | [Filtering, Sorting & Grouping](docs/10-filtering-sorting.md) | Filter, Sorter, client vs server, SearchField |
| 11 | [OData Services](docs/11-odata.md) | OData v2/v4, CRUD, Mock Server, Batch requests |
| 12 | [Testing](docs/12-testing.md) | QUnit, OPA5, Mock Server, Test-driven development |

### Advanced Skills (Modules 13-16)
| Module | Topic | Key Skills |
|--------|-------|------------|
| 13 | [Responsive & Adaptive Design](docs/13-theming-responsive.md) | Device API, FlexBox, responsive tables, breakpoints |
| 14 | [Security](docs/14-security.md) | XSS prevention, CSP, CSRF tokens, Input sanitization |
| 15 | [Performance](docs/15-performance.md) | Lazy loading, Growing lists, Async views, Preloading |
| 16 | [Deployment & Best Practices](docs/16-deployment.md) | UI5 build, SAP BTP, Fiori Launchpad, Naming conventions |

---

## Prerequisites

Before starting, make sure you have:

1. **Node.js** (v16 or later) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **A modern browser** (Chrome recommended for DevTools)
4. **A code editor** (VS Code / Cursor recommended)

### Helpful but not required:
- Basic understanding of MVC pattern
- Familiarity with XML syntax
- Basic knowledge of REST APIs

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SAP UI5 Application                  │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Views      │  │ Controllers │  │     Models      │ │
│  │  (XML)       │◄─┤  (JS)       │──┤  (JSON/OData)   │ │
│  │             │  │             │  │                 │ │
│  │ - App       │  │ - App       │  │ - Products     │ │
│  │ - Home      │  │ - Home      │  │ - Cart         │ │
│  │ - Products  │  │ - Products  │  │ - Categories   │ │
│  │ - Cart      │  │ - Cart      │  │ - Device       │ │
│  │ - Checkout  │  │ - Checkout  │  │ - i18n         │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                   │          │
│         └────────────────┼───────────────────┘          │
│                          │                              │
│  ┌───────────────────────▼──────────────────────────┐   │
│  │              Component (Root)                     │   │
│  │  - manifest.json (App Descriptor)                │   │
│  │  - Router Configuration                          │   │
│  │  - Model Initialization                          │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│  ┌───────────────────────▼──────────────────────────┐   │
│  │           UI5 Runtime / Framework                 │   │
│  │  - Control Rendering  - Event System              │   │
│  │  - Data Binding       - Theming                   │   │
│  │  - Routing            - i18n                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### How Data Flows in UI5

```
User Action (click, type, etc.)
       │
       ▼
  XML View (UI)  ──── Data Binding ────  Model (Data)
       │                                      │
       ▼                                      │
  Controller  ──── Updates / Reads ───────────┘
       │
       ▼
  Router (navigates to new view)
       │
       ▼
  New View + Controller loaded
```

---

## Project Structure

```
ui5-learning/
├── README.md                          # You are here!
├── package.json                       # Node.js dependencies
├── ui5.yaml                           # UI5 Tooling configuration
│
├── docs/                              # 📚 Detailed learning documentation
│   ├── 00-prerequisites.md            # Setup & prerequisites
│   ├── 01-architecture.md             # MVC & Component architecture
│   ├── 02-views-and-controllers.md    # Views and Controllers deep dive
│   ├── 03-data-binding.md             # All about data binding
│   ├── 04-models.md                   # JSONModel, ODataModel, etc.
│   ├── 05-routing.md                  # Navigation & routing
│   ├── 06-controls.md                 # UI controls reference
│   ├── 07-fragments-and-dialogs.md    # Reusable UI fragments
│   ├── 08-i18n.md                     # Internationalization
│   ├── 09-formatting.md              # Formatters & validation
│   ├── 10-filtering-sorting.md        # Filter, sort, group
│   ├── 11-odata.md                    # OData services
│   ├── 12-testing.md                  # Testing guide
│   ├── 13-theming-responsive.md       # Responsive design & themes
│   ├── 14-security.md                # Security best practices
│   ├── 15-performance.md             # Performance optimization
│   └── 16-deployment.md              # Build & deployment
│
├── webapp/                            # 🚀 The actual application
│   ├── index.html                     # Entry point (bootstraps UI5)
│   ├── manifest.json                  # App descriptor (the "brain")
│   ├── Component.js                   # Root UI Component
│   │
│   ├── controller/                    # 🎮 Controllers (business logic)
│   │   ├── BaseController.js          # Shared controller logic
│   │   ├── App.controller.js          # Root view controller
│   │   ├── Home.controller.js         # Home/landing page
│   │   ├── ProductList.controller.js  # Product listing & filtering
│   │   ├── ProductDetail.controller.js# Product details
│   │   ├── Cart.controller.js         # Shopping cart management
│   │   └── Checkout.controller.js     # Checkout flow
│   │
│   ├── view/                          # 🎨 Views (UI structure)
│   │   ├── App.view.xml               # Root view with shell
│   │   ├── Home.view.xml              # Welcome & categories
│   │   ├── ProductList.view.xml       # Product grid/list
│   │   ├── ProductDetail.view.xml     # Single product page
│   │   ├── Cart.view.xml              # Cart contents
│   │   └── Checkout.view.xml          # Order form
│   │
│   ├── fragment/                      # 🧩 Reusable UI fragments
│   │   ├── ProductCard.fragment.xml   # Product display card
│   │   ├── CartItem.fragment.xml      # Cart line item
│   │   ├── AddToCartDialog.fragment.xml # Add-to-cart popup
│   │   └── CheckoutSummary.fragment.xml # Order summary
│   │
│   ├── model/                         # 📊 Data models & helpers
│   │   ├── models.js                  # Model creation factory
│   │   ├── formatter.js               # Display formatters
│   │   └── cart.js                    # Cart business logic
│   │
│   ├── i18n/                          # 🌍 Translations
│   │   ├── i18n.properties            # English (default)
│   │   └── i18n_de.properties         # German translation
│   │
│   ├── css/                           # 🎨 Custom styles
│   │   └── style.css                  # Application styles
│   │
│   ├── localService/                  # 🔧 Mock OData server
│   │   ├── mockserver.js              # Mock server setup
│   │   └── mockdata/                  # Sample data
│   │       ├── Products.json
│   │       ├── Categories.json
│   │       └── metadata.xml           # OData service definition
│   │
│   └── test/                          # ✅ Test suites
│       ├── testsuite.qunit.html       # Test runner entry point
│       ├── unit/                      # Unit tests (QUnit)
│       │   ├── unitTests.qunit.html
│       │   ├── unitTests.qunit.js
│       │   └── model/
│       │       ├── formatter.js
│       │       └── models.js
│       └── integration/               # Integration tests (OPA5)
│           ├── opaTests.qunit.html
│           ├── opaTests.qunit.js
│           └── journeys/
│               ├── NavigationJourney.js
│               └── ShoppingJourney.js
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm start
```

This starts a local server at `http://localhost:8080/index.html`.

### 3. Run Tests

```bash
npm test
```

Or open the test pages in your browser:
- Unit Tests: `http://localhost:8080/test/unit/unitTests.qunit.html`
- Integration Tests: `http://localhost:8080/test/integration/opaTests.qunit.html`

---

## Learning Path

### Recommended Order

Follow this order for the best learning experience. Each module builds on the previous one.

```
Week 1: Foundations
━━━━━━━━━━━━━━━━━━
📖 Read docs/00-prerequisites.md
📖 Read docs/01-architecture.md
🔍 Study: index.html, manifest.json, Component.js
📖 Read docs/02-views-and-controllers.md
🔍 Study: App.view.xml, App.controller.js

Week 2: Data & Binding
━━━━━━━━━━━━━━━━━━━━━
📖 Read docs/03-data-binding.md
📖 Read docs/04-models.md
🔍 Study: model/models.js, Home.view.xml, Home.controller.js
📖 Read docs/05-routing.md
🔍 Study: manifest.json routing config, all views

Week 3: UI & Controls
━━━━━━━━━━━━━━━━━━━━━
📖 Read docs/06-controls.md
🔍 Study: ProductList.view.xml, ProductDetail.view.xml
📖 Read docs/07-fragments-and-dialogs.md
🔍 Study: fragment/ folder, AddToCartDialog
📖 Read docs/08-i18n.md
🔍 Study: i18n/ folder, how texts are referenced

Week 4: Business Logic
━━━━━━━━━━━━━━━━━━━━━
📖 Read docs/09-formatting.md
🔍 Study: model/formatter.js, expression bindings in views
📖 Read docs/10-filtering-sorting.md
🔍 Study: ProductList.controller.js filtering/sorting
🔍 Study: Cart.view.xml, Cart.controller.js, model/cart.js

Week 5: Backend & Data
━━━━━━━━━━━━━━━━━━━━━
📖 Read docs/11-odata.md
🔍 Study: localService/ folder, metadata.xml, mockserver.js
📖 Read docs/12-testing.md
🔍 Study: test/ folder, run all tests

Week 6: Production Ready
━━━━━━━━━━━━━━━━━━━━━━━
📖 Read docs/13-theming-responsive.md
📖 Read docs/14-security.md
📖 Read docs/15-performance.md
📖 Read docs/16-deployment.md
🔍 Review entire codebase with new understanding
```

---

## How to Read This Project

### Comments Convention

Every file in this project uses a consistent commenting style:

```javascript
// ========================================================================
// CONCEPT: [Topic Name]
// What: Brief description of what this code does
// Why: Why this approach is used in UI5
// Learn more: docs/XX-topic.md
// ========================================================================
```

### Complexity Markers

Look for these markers in comments:
- `[BEGINNER]` - Essential knowledge, learn first
- `[INTERMEDIATE]` - Important for day-to-day work
- `[ADVANCED]` - Deep knowledge for complex scenarios
- `[BEST PRACTICE]` - Recommended approach at SAP
- `[ANTI-PATTERN]` - Common mistakes to avoid
- `[GOTCHA]` - Surprising behavior to watch out for

---

## Key Concepts Quick Reference

### What is SAP UI5?

SAP UI5 (also known as OpenUI5 for the open-source version) is an **enterprise-grade JavaScript framework** for building web applications. It is:

- **The standard UI framework at SAP** for building Fiori applications
- Based on the **MVC (Model-View-Controller)** pattern
- **Enterprise-ready** with built-in i18n, accessibility, theming, and responsive design
- Uses **XML Views** (preferred) for declarative UI definition
- Has a rich set of **pre-built UI controls** following SAP Fiori design guidelines
- Supports **OData** as the primary data protocol

### UI5 vs React: A Quick Comparison (Since You Know Some React)

| Concept | React | SAP UI5 |
|---------|-------|---------|
| UI Definition | JSX (JavaScript) | XML Views (declarative) |
| Component | React Component | UI5 Control / Component |
| State | useState / Redux | Models (JSONModel, etc.) |
| Routing | react-router | sap.m.routing.Router |
| Styling | CSS-in-JS / CSS Modules | Theming + custom CSS |
| Data Fetching | fetch / axios | ODataModel (built-in) |
| Testing | Jest / React Testing Library | QUnit / OPA5 |
| Build Tool | Webpack / Vite | UI5 Tooling |
| Package Manager | npm | npm + UI5 CLI |

### The Most Important Files

1. **`manifest.json`** - The "brain" of your app. Configures everything: models, routes, dependencies.
2. **`Component.js`** - The root component. Initializes the app.
3. **`index.html`** - Entry point. Loads the UI5 framework.

---

## Resources

### Official Documentation
- [SAP UI5 SDK](https://sapui5.hana.ondemand.com/)
- [OpenUI5 Documentation](https://openui5.org/)
- [SAP UI5 API Reference](https://sapui5.hana.ondemand.com/#/api)
- [UI5 Tooling](https://sap.github.io/ui5-tooling/)

### Tutorials
- [Official UI5 Walkthrough (57 steps)](https://sapui5.hana.ondemand.com/#/topic/3da5f4be63264db99f2e5b04c5e853db)
- [SAP Learning Journey](https://learning.sap.com/)

### Community
- [SAP Community](https://community.sap.com/)
- [Stack Overflow - SAPUI5 tag](https://stackoverflow.com/questions/tagged/sapui5)
- [UI5 on GitHub](https://github.com/nicotres/ui5-ecosystem-showcase)

### Videos
- [SAP UI5 Full Course](https://www.youtube.com/watch?v=C9cK2Z2JDLg)
- [SAP Developers YouTube Channel](https://www.youtube.com/@SAPDevs)

---

## License

This is a learning project. Feel free to use, modify, and distribute.

---

> **Remember**: The best way to learn UI5 is to **read the code**, **run it**, **break it**, and **fix it**.
> Every file in this project has detailed comments. Start with `index.html` and follow the trail!
