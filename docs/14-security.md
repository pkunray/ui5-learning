# Module 14: Security

> **Objective**: Learn how to build secure SAP UI5 applications. Understand XSS prevention, input
> sanitization, CSRF protection, authentication patterns, and SAP's secure coding guidelines.

---

## Table of Contents

- [Why Security Matters](#why-security-matters)
- [Security Layers Overview](#security-layers-overview)
- [XSS (Cross-Site Scripting) Prevention](#xss-cross-site-scripting-prevention)
- [Content Security Policy (CSP)](#content-security-policy-csp)
- [CSRF Token Handling](#csrf-token-handling)
- [Input Validation and Sanitization](#input-validation-and-sanitization)
- [Authentication Patterns](#authentication-patterns)
- [Authorization: Role-Based Visibility](#authorization-role-based-visibility)
- [HTTPS and Secure Communication](#https-and-secure-communication)
- [Sensitive Data Handling](#sensitive-data-handling)
- [SAP Secure Coding Guidelines](#sap-secure-coding-guidelines)
- [Summary](#summary)

---

## Why Security Matters

SAP applications handle some of the most sensitive data in any organization — financial records, personal employee data, supply chain details, customer information. A security breach in an SAP system can result in:

- **Financial loss** — Direct theft or regulatory fines (GDPR fines up to 4% of global revenue)
- **Data exposure** — Employee salaries, customer PII, trade secrets
- **Business disruption** — Systems taken offline, processes halted
- **Reputation damage** — Loss of customer and partner trust

> **Key Principle**: Security is not a feature — it's a **requirement** for every line of code you write.

---

## Security Layers Overview

```mermaid
graph TB
    subgraph Layers["Security Defense in Depth"]
        L1["🌐 Network Layer<br/>HTTPS, TLS, Firewalls"]
        L2["🔐 Authentication Layer<br/>Who are you?<br/>OAuth, SAML, Certificates"]
        L3["🛡️ Authorization Layer<br/>What can you do?<br/>Roles, Permissions"]
        L4["🧹 Input Layer<br/>Validation & Sanitization<br/>Never trust user input"]
        L5["🔒 Output Layer<br/>XSS Prevention<br/>Encoding & Escaping"]
        L6["📋 Policy Layer<br/>CSP, CORS, Headers<br/>Browser enforcement"]
        L7["🗄️ Data Layer<br/>Encryption at rest<br/>Secure storage"]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6
    L6 --> L7

    style L1 fill:#3498db,color:#fff
    style L2 fill:#9b59b6,color:#fff
    style L3 fill:#e67e22,color:#fff
    style L4 fill:#1abc9c,color:#fff
    style L5 fill:#e74c3c,color:#fff
    style L6 fill:#2ecc71,color:#fff
    style L7 fill:#34495e,color:#fff
```

---

## XSS (Cross-Site Scripting) Prevention

XSS is the **#1 client-side vulnerability** in web applications. An attacker injects malicious JavaScript that runs in other users' browsers.

### How XSS Works

```mermaid
sequenceDiagram
    participant Attacker
    participant App as Web Application
    participant DB as Database
    participant Victim

    Note over Attacker,Victim: Stored XSS Attack

    Attacker->>App: Submit product review:<br/>"Great! <script>stealCookies()</script>"
    App->>DB: Store review (unescaped)
    DB-->>App: ✓ Saved

    Victim->>App: View product reviews
    App->>DB: Fetch reviews
    DB-->>App: Return reviews (including malicious one)
    App->>Victim: Render page with:<br/><script>stealCookies()</script>
    Victim->>Victim: Browser executes malicious script!
    Victim->>Attacker: Cookies/tokens sent to attacker
```

### UI5's Built-in XSS Protection

**Good news**: UI5 controls automatically escape output, making XSS much harder. When you use data binding, values are HTML-encoded before rendering:

```xml
<!-- ✅ SAFE: UI5 automatically HTML-encodes bound values -->
<Text text="{productName}" />
<!-- If productName = "<script>alert('xss')</script>"
     UI5 renders: &lt;script&gt;alert('xss')&lt;/script&gt;
     The browser shows the text literally, NOT executing it -->

<!-- ✅ SAFE: All standard UI5 control properties are escaped -->
<Input value="{userInput}" />
<Title text="{title}" />
<Label text="{label}" />
```

### When You ARE Vulnerable — Anti-Patterns

```javascript
// ❌ DANGEROUS: Setting innerHTML directly bypasses UI5 protection
var oHtml = new sap.ui.core.HTML({
    content: "<div>" + sUserInput + "</div>"  // XSS vulnerability!
});

// ❌ DANGEROUS: Using jQuery to insert unescaped HTML
$("#myDiv").html(sUserInput);  // XSS vulnerability!

// ❌ DANGEROUS: document.write with user data
document.write(sUserInput);  // XSS vulnerability!

// ❌ DANGEROUS: Unescaped values in event handler strings
oButton.attachPress(function () {
    eval(sUserInput);  // Critical vulnerability! Never use eval()
});
```

### SAP Encoding Functions

When you must handle raw HTML or construct URLs, use SAP's encoding utilities:

```javascript
sap.ui.define([
    "sap/base/security/encodeXML",
    "sap/base/security/encodeURL",
    "sap/base/security/encodeJS",
    "sap/base/security/encodeCSS"
], function (encodeXML, encodeURL, encodeJS, encodeCSS) {
    "use strict";

    // Encode for HTML/XML context
    var sSafe = encodeXML(sUserInput);
    // "<script>" becomes "&lt;script&gt;"

    // Encode for URL parameters
    var sUrl = "/api/search?q=" + encodeURL(sSearchQuery);
    // "a&b=c" becomes "a%26b%3Dc"

    // Encode for JavaScript string context
    var sJsSafe = encodeJS(sUserInput);
    // Escapes quotes and special JS characters

    // Encode for CSS value context
    var sCssSafe = encodeCSS(sUserInput);
    // Prevents CSS injection
});
```

### XSS Prevention Decision Tree

```mermaid
graph TD
    Start{Where does user<br/>data appear?} -->|"UI5 control property<br/>(Text, Input, Label)"| Safe["✅ Automatically safe<br/>UI5 encodes output"]
    Start -->|"Raw HTML<br/>(sap.ui.core.HTML)"| Encode["⚠️ Use encodeXML()"]
    Start -->|"URL parameter"| URL["⚠️ Use encodeURL()"]
    Start -->|"JavaScript string"| JS["⚠️ Use encodeJS()"]
    Start -->|"CSS value"| CSS["⚠️ Use encodeCSS()"]
    Start -->|"innerHTML or jQuery.html()"| Never["❌ NEVER do this<br/>Use UI5 controls instead"]

    Encode --> Safe2["✅ Safe after encoding"]
    URL --> Safe2
    JS --> Safe2
    CSS --> Safe2

    style Safe fill:#27ae60,color:#fff
    style Safe2 fill:#27ae60,color:#fff
    style Never fill:#e74c3c,color:#fff
    style Encode fill:#f39c12,color:#fff
    style URL fill:#f39c12,color:#fff
    style JS fill:#f39c12,color:#fff
    style CSS fill:#f39c12,color:#fff
```

---

## Content Security Policy (CSP)

CSP is a browser-enforced security policy that prevents unauthorized script execution. It tells the browser which sources of content are allowed.

### How CSP Works

```mermaid
graph LR
    Server["Server sends<br/>CSP header"]
    -->|"Content-Security-Policy:<br/>script-src 'self'"| Browser["Browser enforces<br/>policy"]

    Browser -->|"✅ Allowed"| Own["Scripts from<br/>same origin"]
    Browser -->|"❌ Blocked"| Inline["Inline scripts<br/>&lt;script&gt;alert()&lt;/script&gt;"]
    Browser -->|"❌ Blocked"| External["Scripts from<br/>untrusted CDNs"]

    style Server fill:#3498db,color:#fff
    style Browser fill:#9b59b6,color:#fff
    style Own fill:#27ae60,color:#fff
    style Inline fill:#e74c3c,color:#fff
    style External fill:#e74c3c,color:#fff
```

### CSP for UI5 Applications

```html
<!-- Set CSP via meta tag (or preferably via HTTP header) -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src  'self' https://openui5.hana.ondemand.com;
               style-src   'self' https://openui5.hana.ondemand.com 'unsafe-inline';
               font-src    'self' https://openui5.hana.ondemand.com;
               img-src     'self' data:;
               connect-src 'self' https://your-odata-server.com;">
```

### UI5 CSP Compatibility

UI5 works with strict CSP, but you need to configure it properly:

```html
<!-- Enable CSP-compatible mode in UI5 bootstrap -->
<script
    src="https://openui5.hana.ondemand.com/resources/sap-ui-core.js"
    data-sap-ui-async="true"
    data-sap-ui-xx-nosync="warn">
    <!-- data-sap-ui-xx-nosync prevents synchronous XHR which CSP may block -->
</script>
```

### CSP Directives Quick Reference

| Directive | Controls | Recommended Value |
|-----------|----------|-------------------|
| `default-src` | Fallback for all | `'self'` |
| `script-src` | JavaScript sources | `'self'` + UI5 CDN |
| `style-src` | CSS sources | `'self'` + UI5 CDN + `'unsafe-inline'` (UI5 needs this) |
| `font-src` | Font files | `'self'` + UI5 CDN |
| `img-src` | Image sources | `'self' data:` |
| `connect-src` | AJAX/WebSocket targets | `'self'` + API servers |
| `frame-src` | Embeddable frames | `'none'` (unless needed) |
| `object-src` | Plugins (Flash, etc.) | `'none'` |

---

## CSRF Token Handling

**CSRF** (Cross-Site Request Forgery) tricks a user's browser into making unauthorized requests to a server where the user is authenticated.

### How CSRF Works

```mermaid
sequenceDiagram
    participant User as User (Logged In)
    participant SAP as SAP Application
    participant Evil as Malicious Site

    User->>SAP: Login (get session cookie)
    SAP-->>User: Session cookie set

    Note over User,Evil: User visits malicious site while logged in

    User->>Evil: Visit evil-site.com
    Evil->>User: Hidden form that posts to SAP:<br/>/api/delete-all-data
    User->>SAP: POST /api/delete-all-data<br/>(browser sends cookie automatically!)
    SAP->>SAP: Executes action!<br/>Thinks it's the user 😱

    Note over User,Evil: With CSRF Token Protection

    User->>SAP: GET request → Fetch CSRF token
    SAP-->>User: X-CSRF-Token: abc123
    User->>SAP: POST /api/action<br/>X-CSRF-Token: abc123 ✅
    SAP->>SAP: Token valid → Execute

    Evil->>SAP: POST /api/action<br/>(no token or wrong token) ❌
    SAP-->>Evil: 403 Forbidden
```

### CSRF in UI5 OData

**Great news**: UI5's ODataModel handles CSRF tokens **automatically**:

```javascript
// ODataModel automatically:
// 1. Fetches CSRF token on first request (GET with X-CSRF-Token: Fetch)
// 2. Includes token in all modifying requests (POST, PUT, DELETE)
// 3. Refreshes token if it expires (server returns 403)

var oModel = new ODataModel("/api/odata/v2/", {
    // CSRF handling is enabled by default
    // No configuration needed!
});

// All these automatically include the CSRF token:
oModel.create("/Products", oNewProduct);
oModel.update("/Products('P1')", oUpdatedData);
oModel.remove("/Products('P1')");
```

### Manual CSRF Token Handling

For non-OData AJAX requests, handle CSRF tokens manually:

```javascript
// Fetch CSRF token
jQuery.ajax({
    url: "/api/endpoint",
    method: "GET",
    headers: {
        "X-CSRF-Token": "Fetch"
    },
    success: function (data, textStatus, xhr) {
        var sCsrfToken = xhr.getResponseHeader("X-CSRF-Token");

        // Use token in subsequent POST request
        jQuery.ajax({
            url: "/api/endpoint",
            method: "POST",
            headers: {
                "X-CSRF-Token": sCsrfToken
            },
            data: JSON.stringify(oPayload),
            contentType: "application/json"
        });
    }
});
```

---

## Input Validation and Sanitization

**Never trust user input.** Validate on both client and server.

### Client-Side Validation in UI5

UI5 provides built-in types with constraints for input validation:

```xml
<!-- Validate email format -->
<Input value="{
    path: '/email',
    type: 'sap.ui.model.type.String',
    constraints: { maxLength: 254 }
}" />

<!-- Validate number range -->
<Input value="{
    path: '/quantity',
    type: 'sap.ui.model.type.Integer',
    constraints: { minimum: 1, maximum: 999 }
}" />

<!-- Validate required fields -->
<Input
    value="{/name}"
    required="true"
    valueLiveUpdate="true"
    valueState="{= ${/name} ? 'None' : 'Error'}"
    valueStateText="Name is required" />
```

### Custom Validation in Controller

```javascript
onSubmitOrder: function () {
    var oModel = this.getView().getModel();
    var sEmail = oModel.getProperty("/email");
    var sPhone = oModel.getProperty("/phone");
    var iQuantity = oModel.getProperty("/quantity");

    // Validate email
    var rEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rEmail.test(sEmail)) {
        MessageBox.error("Please enter a valid email address");
        return;
    }

    // Validate phone (only digits, dashes, spaces, plus)
    var rPhone = /^[+\d\s\-()]+$/;
    if (sPhone && !rPhone.test(sPhone)) {
        MessageBox.error("Phone number contains invalid characters");
        return;
    }

    // Validate quantity (positive integer)
    if (!Number.isInteger(iQuantity) || iQuantity < 1) {
        MessageBox.error("Quantity must be a positive number");
        return;
    }

    // Input is valid — proceed
    this._submitOrder();
}
```

### Validation Layers

```mermaid
graph TD
    Input["User Input"] --> Client["Client-Side Validation<br/>(UI5 types & constraints)<br/>Immediate feedback"]
    Client -->|"Valid"| Controller["Controller Validation<br/>(Business rules)<br/>Complex logic"]
    Client -->|"Invalid"| Error1["Show error state<br/>on control"]
    Controller -->|"Valid"| Server["Server-Side Validation<br/>(Backend/OData)<br/>Final authority"]
    Controller -->|"Invalid"| Error2["MessageBox.error()"]
    Server -->|"Valid"| DB["Process & Store"]
    Server -->|"Invalid"| Error3["Error response<br/>shown in MessageBox"]

    style Input fill:#3498db,color:#fff
    style Client fill:#f39c12,color:#fff
    style Controller fill:#e67e22,color:#fff
    style Server fill:#27ae60,color:#fff
    style DB fill:#2c3e50,color:#fff
    style Error1 fill:#e74c3c,color:#fff
    style Error2 fill:#e74c3c,color:#fff
    style Error3 fill:#e74c3c,color:#fff
```

> **Critical Rule**: Client-side validation is for **user experience** (fast feedback). Server-side
> validation is for **security** (never skip it). An attacker can bypass all client-side checks.

---

## Authentication Patterns

Authentication verifies **who** the user is. UI5 applications typically delegate authentication to the server or identity provider.

### Common Authentication Methods

```mermaid
graph TB
    subgraph Auth["Authentication Methods"]
        Basic["🔑 Basic Auth<br/>Username + Password<br/>Base64 encoded<br/>Simple but insecure"]
        OAuth["🎫 OAuth 2.0<br/>Token-based<br/>Delegated auth<br/>Modern standard"]
        SAML["📜 SAML 2.0<br/>XML-based SSO<br/>Enterprise standard<br/>SAP IDP"]
        Cert["🔒 X.509 Certificates<br/>Client certificates<br/>Mutual TLS<br/>Very secure"]
    end

    Basic -->|"Used with"| Dev["Development<br/>& Simple setups"]
    OAuth -->|"Used with"| BTP["SAP BTP<br/>Cloud apps"]
    SAML -->|"Used with"| OnPrem["SAP On-Premise<br/>Fiori Launchpad"]
    Cert -->|"Used with"| B2B["B2B Integration<br/>System-to-system"]

    style Basic fill:#95a5a6,color:#fff
    style OAuth fill:#3498db,color:#fff
    style SAML fill:#9b59b6,color:#fff
    style Cert fill:#27ae60,color:#fff
```

### OAuth 2.0 Flow (Most Common for Cloud)

```mermaid
sequenceDiagram
    participant User
    participant UI5 as UI5 Application
    participant IDP as Identity Provider<br/>(SAP IAS / Azure AD)
    participant API as Backend API

    User->>UI5: Open application
    UI5->>IDP: Redirect to login page
    IDP->>User: Show login form
    User->>IDP: Enter credentials
    IDP->>IDP: Validate credentials
    IDP->>UI5: Redirect with authorization code
    UI5->>IDP: Exchange code for access token
    IDP-->>UI5: Access token + refresh token
    UI5->>API: API request + Bearer token
    API->>API: Validate token
    API-->>UI5: Protected data

    Note over UI5,API: Token included in every request
```

### Handling Authentication in UI5

```javascript
// Check if user is authenticated
sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.sap.shop.controller.App", {
        onInit: function () {
            // On SAP BTP, authentication is typically handled by the app router
            // The UI5 app receives the user info from the session

            // Check for user info endpoint
            jQuery.ajax({
                url: "/api/userinfo",
                method: "GET",
                success: function (oUserInfo) {
                    // User is authenticated
                    this.getView().getModel("user").setData(oUserInfo);
                }.bind(this),
                error: function (oError) {
                    if (oError.status === 401) {
                        // Not authenticated — redirect to login
                        window.location.href = "/login";
                    }
                }
            });
        }
    });
});
```

---

## Authorization: Role-Based Visibility

Authorization controls **what** an authenticated user can do. In UI5, this typically means showing/hiding UI elements based on user roles.

```javascript
// In Component.js — load user roles
init: function () {
    var oUserModel = new JSONModel({
        name: "",
        roles: [],
        isAdmin: false,
        canEdit: false,
        canDelete: false
    });
    this.setModel(oUserModel, "user");

    // Fetch user roles from backend
    jQuery.ajax({
        url: "/api/user/roles",
        success: function (oData) {
            oUserModel.setData({
                name: oData.name,
                roles: oData.roles,
                isAdmin: oData.roles.indexOf("ADMIN") > -1,
                canEdit: oData.roles.indexOf("EDITOR") > -1,
                canDelete: oData.roles.indexOf("ADMIN") > -1
            });
        }
    });
}
```

```xml
<!-- Show/hide UI elements based on roles -->
<Button
    text="Delete Product"
    icon="sap-icon://delete"
    type="Reject"
    press="onDeleteProduct"
    visible="{user>/canDelete}" />

<Button
    text="Edit Product"
    icon="sap-icon://edit"
    press="onEditProduct"
    visible="{user>/canEdit}" />

<!-- Admin-only section -->
<Panel
    headerText="Administration"
    visible="{user>/isAdmin}">
    <List items="{/AuditLog}">
        <StandardListItem title="{action}" description="{timestamp}" />
    </List>
</Panel>
```

> **Critical Warning**: Client-side role checks are for **UX only** (hiding buttons). Always enforce
> authorization on the **server**. Users can modify client-side code to reveal hidden buttons.

---

## HTTPS and Secure Communication

### Always Use HTTPS

```mermaid
graph LR
    subgraph HTTP["❌ HTTP (Insecure)"]
        H1["Browser"] -->|"Plain text<br/>Password: abc123"| H2["Server"]
        H3["🕵️ Attacker"] -->|"Can read<br/>everything!"| H1
    end

    subgraph HTTPS["✅ HTTPS (Secure)"]
        S1["Browser"] -->|"Encrypted<br/>a8f3k2...x9m1"| S2["Server"]
        S3["🕵️ Attacker"] -->|"Can't read<br/>encrypted data"| S1
    end

    style HTTP fill:#e74c3c,color:#fff
    style HTTPS fill:#27ae60,color:#fff
```

### Secure Communication Checklist

```javascript
// ✅ GOOD: Use HTTPS URLs
var oModel = new ODataModel("https://api.example.com/odata/v2/");

// ❌ BAD: HTTP URLs expose data in transit
var oModel = new ODataModel("http://api.example.com/odata/v2/");

// ✅ GOOD: Use relative URLs (inherits page protocol)
var oModel = new ODataModel("/api/odata/v2/");

// ✅ GOOD: Set secure flag on cookies (server-side)
// Set-Cookie: session=abc123; Secure; HttpOnly; SameSite=Strict
```

---

## Sensitive Data Handling

### Rules for Handling Sensitive Data in UI5

```javascript
// ❌ NEVER store sensitive data in client-side models
var oBadModel = new JSONModel({
    creditCardNumber: "4111-1111-1111-1111",  // Never!
    password: "secret123",                      // Never!
    socialSecurityNumber: "123-45-6789"         // Never!
});

// ❌ NEVER log sensitive data to console
console.log("User password:", sPassword);  // Never!
console.log("Payment details:", oPayment); // Never!

// ❌ NEVER put sensitive data in URLs
// /api/users?password=secret123  ← Appears in browser history, server logs

// ✅ GOOD: Mask sensitive data in the UI
// Show only last 4 digits of card: **** **** **** 1234
formatCreditCard: function (sCardNumber) {
    if (!sCardNumber) return "";
    return "**** **** **** " + sCardNumber.slice(-4);
}

// ✅ GOOD: Send sensitive data only via POST body over HTTPS
jQuery.ajax({
    url: "/api/payment",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        cardNumber: sCardNumber,
        cvv: sCvv
    })
});

// ✅ GOOD: Clear sensitive data when no longer needed
oPaymentModel.setData({});
```

### Where Sensitive Data Leaks

```mermaid
graph TD
    subgraph Leaks["Common Data Leak Points"]
        URL["URLs & Query Params<br/>Browser history,<br/>server logs, referrer"]
        Console["Console Logs<br/>DevTools accessible<br/>to anyone"]
        Storage["localStorage / sessionStorage<br/>Accessible via JS,<br/>persists across sessions"]
        Models["Client-Side Models<br/>Inspectable in<br/>UI5 Diagnostics"]
        Network["Unencrypted HTTP<br/>Man-in-the-middle<br/>attacks"]
    end

    URL --> Fix1["Use POST body<br/>for sensitive data"]
    Console --> Fix2["Remove debug logs<br/>before production"]
    Storage --> Fix3["Never store secrets<br/>in browser storage"]
    Models --> Fix4["Clear data when<br/>navigating away"]
    Network --> Fix5["Always use HTTPS"]

    style Leaks fill:#e74c3c,color:#fff
    style Fix1 fill:#27ae60,color:#fff
    style Fix2 fill:#27ae60,color:#fff
    style Fix3 fill:#27ae60,color:#fff
    style Fix4 fill:#27ae60,color:#fff
    style Fix5 fill:#27ae60,color:#fff
```

---

## SAP Secure Coding Guidelines

### The Top 10 Rules

| # | Rule | Why |
|---|------|-----|
| 1 | **Never trust user input** | Attackers control all client-side data |
| 2 | **Use UI5 controls for output** | Auto-escaping prevents XSS |
| 3 | **Never use `innerHTML` or `eval()`** | Direct injection vectors |
| 4 | **Always validate on the server** | Client validation is bypassable |
| 5 | **Use HTTPS everywhere** | Prevents eavesdropping |
| 6 | **Implement CSP headers** | Blocks unauthorized scripts |
| 7 | **Use ODataModel for CSRF** | Automatic token handling |
| 8 | **Don't store secrets client-side** | Browser storage is not secure |
| 9 | **Log carefully** | Never log passwords, tokens, PII |
| 10 | **Keep dependencies updated** | Patch known vulnerabilities |

### Security Review Checklist

Before deploying, verify:

- [ ] All user input is validated server-side
- [ ] No `innerHTML`, `jQuery.html()`, or `eval()` with user data
- [ ] CSP headers are configured
- [ ] CSRF tokens are used for state-changing requests
- [ ] HTTPS is enforced
- [ ] No sensitive data in URLs, logs, or client storage
- [ ] Role-based access is enforced server-side
- [ ] Authentication tokens have expiry and refresh logic
- [ ] Third-party libraries are up to date
- [ ] UI5 Support Assistant shows no security warnings

---

## Summary

```mermaid
graph TB
    subgraph Security["UI5 Security Toolkit"]
        XSS["🛡️ XSS Prevention<br/>UI5 auto-escaping<br/>+ encoding functions"]
        CSP_["📋 CSP<br/>Browser policy<br/>blocks rogue scripts"]
        CSRF_["🔑 CSRF Tokens<br/>ODataModel handles<br/>automatically"]
        Val["🧹 Input Validation<br/>Types + Constraints<br/>+ server validation"]
        Auth_["🔐 Authentication<br/>OAuth / SAML<br/>delegated to IDP"]
        Authz["🛡️ Authorization<br/>Role-based visibility<br/>+ server enforcement"]
    end

    XSS --> Secure["Secure<br/>Application"]
    CSP_ --> Secure
    CSRF_ --> Secure
    Val --> Secure
    Auth_ --> Secure
    Authz --> Secure

    style XSS fill:#e74c3c,color:#fff
    style CSP_ fill:#3498db,color:#fff
    style CSRF_ fill:#9b59b6,color:#fff
    style Val fill:#1abc9c,color:#fff
    style Auth_ fill:#e67e22,color:#fff
    style Authz fill:#27ae60,color:#fff
    style Secure fill:#2c3e50,color:#fff
```

### Key Takeaways

| Concept | Remember |
|---------|----------|
| **XSS** | UI5 controls auto-escape. Never use `innerHTML` or `eval()`. Use `encodeXML()` when needed. |
| **CSP** | Set `Content-Security-Policy` headers. Allow only trusted sources. |
| **CSRF** | ODataModel handles it automatically. For custom AJAX, fetch and send the token. |
| **Validation** | Use UI5 types + constraints for UX. Always validate on server for security. |
| **Authentication** | Delegate to identity provider (OAuth/SAML). Don't build your own. |
| **Authorization** | Hide UI for UX, enforce on server for security. |
| **HTTPS** | Always. No exceptions. |
| **Sensitive Data** | Never in URLs, logs, localStorage, or client models. |

---

**Next Module**: [Module 15: Performance Optimization →](./15-performance.md)
