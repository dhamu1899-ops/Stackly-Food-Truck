# Stackly — Food Truck Website

A fully responsive, static food-truck website themed on the *Taqueria* template
(yellow `#FFDD00` + white + dark ink), rebuilt from scratch in plain **HTML / CSS / JS** —
no build step, no dependencies.

## Pages

| Page | File | Notes |
|------|------|-------|
| Home | `index.html` | Hero slider, features, menu preview, stats band, Meet The Crew, dark testimonials, gallery, newsletter |
| Menu | `menu.html` | Tabbed menu (tacos / burritos / quesadillas / drinks), How We Cook It, catering promo |
| Truck Locator | `locator.html` | Map embed, stop list, Book The Truck steps, FAQ |
| News | `news.html` | Blog grid + sidebar widgets, Upcoming Events, `#StacklySalem` strip |
| Shop | `shop.html` | Product grid with filters / sort, mini-product sidebar, Why Order strip, free-delivery promo |
| Contact | `contact.html` | Map, contact form, info cards, FAQ, `#StacklySalem` strip |
| Cart | `cart.html` | Live cart (localStorage), totals, checkout |
| Login | `login.html` | Split layout — photo left / form right, X close → home, forgot password, social sign-in |
| Sign up | `signup.html` | Same split layout, customer registration with role selection |
| Dashboard | `dashboard.html` | Customer area — left sidebar + content panels |
| Admin | `admin.html` | Admin area — left sidebar (Overview / Orders / Users / Truck / Site Info) + content panels |
| 404 | `404.html` | Page-not-found |

On screens ≤ 900px the login/signup photo is hidden and only the form is shown.

## Header / footer

All **site pages** (Home → Cart) share one header row:

- **Left:** logo + brand name (yellow logo on a dark chip)
- **Center:** nav (Home · Menu · Truck Locator · News · Shop · Contact)
- **Right:** **Login** button + **cart icon** with live badge — the cart icon links to `cart.html`

`login`, `signup`, `dashboard`, `admin` and `404` ship **without** the site header/footer
so users focus on the task. The auth pages have an **X close button** (top-right) that
navigates back home; dashboard and admin use their own sidebar nav.

## Motion

- Smooth scrolling (`scroll-behavior: smooth`) plus JS-driven smooth anchor scrolling
- Every section animates in on scroll (fade-up, staggered delays) via IntersectionObserver,
  with a scroll-based safety net; `prefers-reduced-motion` disables all of it
- Hero content rises in; auth cards slide in; buttons hover-lift
- On touch devices the **Add to cart** button stays visible (no hover state)

## Dashboard (customer)

Left sidebar + right content, switched client-side:

- **Overview** — stats, recent orders, quick links
- **My Orders** — full order history table
- **Favourites** — saved products (add straight to cart)
- **Saved Addresses** — saved addresses + add form
- **Account Settings** — profile edit + change password
- **Log Out** — clears the session

## Auth (role-based, localStorage)

Storage keys: `stackly_users`, `stackly_session`, `stackly_cart`.

- Roles: **customer (`user`)** and **admin (`admin`)**
- Login / signup include a **role pill** selector — credentials are checked against the chosen role
- Guards: `data-guard="user"` (dashboard) and `data-guard="admin"` (admin panel).
  Logged-out visitors bounce to `login.html`; the wrong role is bounced to their own dashboard.
- `data-logout` clears the session and returns to the **home page**
- Login also offers **Forgot password?** (expands the reset form inline — it never navigates)
  and **social sign-in** buttons that open each provider's own login page
  (Google → accounts.google.com, Facebook → facebook.com/login, X → x.com login)
- The admin panel lists every registered customer

### Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@stackly.com` | `admin123` |
| Customer | sign up at `signup.html` | choose your own |

## Shop → Cart

Clicking **Add to cart** on any product (shop page or dashboard favourites) stores the item in
localStorage and updates the header badge. `cart.html` renders the live cart with quantity
editors, remove buttons, subtotal, free delivery and a total.

## Images (WebP)

All 24 photos live in `assets/img/photos/` as **`.webp`** (converted from the
original JPGs, ~23% smaller — 11.6 MB → 8.9 MB). Every HTML/CSS reference uses
`.webp`, and the cart renderer upgrades any stale `.jpg` path in localStorage
automatically. SVGs (logo, drip) stay vector.

## Business details (Salem)

- **Address:** No. 12, Fort Main Road, Salem – 636001, Tamil Nadu
- **Reservations:** +91 427 234 5678 · **Catering:** +91 427 234 5679
- **Email:** hello@stackly.com
- Prices in ₹ (INR)

## Run locally

```bash
node server.js        # then open http://localhost:8080
```

Any static file server works too — there is no build step.

The dev server sends `Cache-Control: no-store` (every run serves fresh files) and
falls back to the styled `404.html` for missing paths. HTML references
`css/style.css?v=2`, `js/main.js?v=2`, `js/auth.js?v=2` and `logo.svg?v=2`
for cache-busting, so an old cached copy can never break the pages.
If port 8080 is taken, the server prints instructions instead of crashing.

## Accessibility

All 12 pages score **1.0 / 1.0 / 1.0** (Accessibility / Best Practices / SEO) in Lighthouse,
with proper heading order, labelled inputs, 24px+ touch targets and AA colour contrast.
