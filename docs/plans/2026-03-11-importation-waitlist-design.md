# Importation Waitlist Feature — Design Document

**Date:** 2026-03-11
**Status:** Approved

## Overview

Add an importation section to Leeztruestyles.com that connects Kenyan retailers with Chinese suppliers. Phase 1 is a waitlist — retailers sign up, admins review and approve applications, retailers can check their status.

## Goals

- Capture interested Kenyan retailers with minimal friction (anonymous, no account required)
- Identify which goods categories are most in demand to inform which suppliers to onboard first
- Give admin visibility and control over who gets connected to suppliers
- Keep the build scoped and simple for a new program

---

## 1. Database

New Supabase table: `import_waitlist`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `full_name` | text | Retailer's full name |
| `email` | text | Contact + status lookup |
| `phone` | text | WhatsApp/call contact |
| `business_name` | text | Retailer's shop or business name |
| `goods_category` | text | Dropdown: Clothing, Footwear, Accessories, Home Goods, Electronics, Other |
| `monthly_order_value` | text | Dropdown: Under KES 50k, KES 50k–100k, KES 100k–500k, Over KES 500k |
| `status` | text | `pending` \| `approved` \| `rejected` (default: `pending`) |
| `admin_note` | text | Optional note from admin |
| `created_at` | timestamptz | Auto |

**RLS:** Public insert (anonymous submissions). Admin-only select/update via service role.

---

## 2. Home Page Section

**Placement:** Between "Featured Products" and "Customer Reviews" sections.

**Visual style:**
- Deep navy-to-indigo gradient background (distinct from existing sections)
- Decorative blurred circles (matching Hero and Flash Sale technique)
- White text
- Two-column desktop layout; stacked on mobile

**Left column:**
- `EARLY ACCESS` badge pill
- Headline: "Source Directly from China"
- Sub-copy: "Are you a Kenyan retailer? Get connected with verified Chinese suppliers. Join our waitlist and be among the first to access direct importation at competitive prices."
- "Join the Waitlist" CTA button

**Right column:**
- SVG illustration: Kenya 🇰🇪 and China 🇨🇳 flags connected by a dotted trade route arc with a shipping box icon in the centre
- Pure CSS/SVG — no external image dependencies

**Modal (on CTA click):**
- 6-field form: Full Name, Email, Phone, Business Name, Goods Category (dropdown), Monthly Order Value (dropdown)
- Submit button: "Join Waitlist"
- On success: confirmation message with their email and a link to `/importation/status`
- On error: inline field validation messages

---

## 3. Admin Dashboard Page

**Route:** `/dashboard/importation`
**Nav label:** "Importation" with a 🌏 icon
**Access:** Admin role only (same `canAccessAdmin` check as existing pages)

**Summary cards (3):**
- Total Applications
- Pending Review
- Approved

**Applications table columns:**
- Business Name + Full Name
- Contact (Email + Phone)
- Goods Category (badge/pill)
- Monthly Order Value
- Date Applied
- Status (colour-coded pill: grey=Pending, green=Approved, red=Rejected)
- Actions (Approve / Reject buttons)

**Approve / Reject flow:**
- Clicking Approve or Reject opens an inline confirmation panel
- Optional Admin Note text field
- Saves status + note to database
- Status pill updates immediately

**Filters:**
- By status: All / Pending / Approved / Rejected
- By goods category dropdown

**No automated email notifications** — admin contacts retailers manually via phone/email from the table.

---

## 4. Retailer Status Check Page

**Route:** `/importation/status`
**Access:** Public, no authentication required

**Flow:**
1. Retailer enters their email address
2. Lookup against `import_waitlist` by email
3. Display status card:

| Status | Message |
|---|---|
| Pending | "Your application is under review. We'll be in touch soon." |
| Approved | "Congratulations! Your application has been approved. Expect a call from our team." + admin note |
| Rejected | "Thank you for your interest. Unfortunately we can't onboard you at this time." + admin note |
| Not found | "No application found with this email. Please check and try again." |

**Link to this page** is shown in the waitlist modal success message.

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/importation/waitlist` | Submit a new waitlist application |
| GET | `/api/importation/status?email=` | Check application status by email |
| PATCH | `/api/importation/waitlist/[id]` | Admin: update status + note |

---

## Out of Scope (Phase 1)

- Automated email notifications
- Supplier-side portal
- Retailer accounts or login
- Matching algorithm between retailers and suppliers
- Payment or commission flows
