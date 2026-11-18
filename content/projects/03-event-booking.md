---
title: Event Booking & Contracting — Client Website
slug: event-booking
track: software
featured: true
order: 6
year: 2026
status: active
role: Designer and developer (client project)
period: 2026
type: Client website · Booking and contract workflow
summary: A website for a small event-décor business that takes a client from "plan my event" to a signed agreement and a $250 deposit without a phone call. Two booking paths, a quote sized to guests and venue, a generated agreement with a tokenized signing link, and an owner view to track every booking.
stack: [HTML, CSS, JavaScript, Netlify, custom domain, PDF generation, transactional email]
demo: /apps/event-booking/
demo_embed: true
demo_note: A test booking from start to signed agreement. The business name, services and prices are placeholders; nothing is sent or charged. Switch to Owner view at the end.
---

!!! note "About the demo"
    This is a live site for a real business, so the demo uses a fictional name, placeholder
    services and sample pricing. The flow, the agreement and the $250 deposit step work the
    way the real site does. Shared with the owner's permission.

## Goal

A booking for an event business always needs the same things: the date, the guest
count, the venue, the style, a price, a signature and a deposit. The goal was a site
that collects all of it in one pass, so a client can go from first visit to a held
date on their own, and the owner gets every booking as a complete record.

## Approach

The site takes the questions the owner always asks and turns them into the
booking flow:

1. **Pick a path**: full planning and décor, or décor rental only.
2. **The event**: type, date, time, guest count and venue type.
3. **The details**: answer a few guided questions, or describe the event in your
   own words. Rental pieces show their price at booking.
4. **The quote**: sized to guest count, venue and hours.
5. **The agreement**: generated with a reference number (EVS-2027-003, for
   example) and emailed as a PDF with a **Review & sign** link.
6. **The deposit**: $250 holds the date once the agreement is signed.

The client gets a branded confirmation email when the request comes in, and the
agreement email once it's finalized. The owner signs in to a separate area to manage
bookings.

## The decisions that mattered

**Two ways to describe the event.** Some clients want a form; others want to write
a paragraph. Both produce the same booking record.

**The agreement carries the details.** The client receives the actual agreement
with the event details filled in, as a PDF for their records and a link to sign.
One document, one link, one signature.

**Signing links carry a token, not an account.** Clients don't make passwords for
a one-time booking. The link in the email identifies their agreement.

**A small, fixed deposit.** A flat $250 is easy to explain, holds the date, and
doesn't need a pricing conversation before the client commits.

## What I'd do differently

- The domain sends mail but needed a separate inbox set up for replies. Mail
  should be configured in both directions before launch, not after the first
  bounced reply.
- Quotes are estimates the owner confirms. A clearer "estimate vs final" state on
  the agreement would set expectations earlier.

## Next

- Reminder emails before the balance is due
- A calendar view in the owner area so double-bookings are visible at a glance
