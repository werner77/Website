---
title: "Building Appie"
description: "Starting at Ahold on the Albert Heijn app, and what a supermarket actually asks of a phone in someone's hand in aisle four."
pubDate: 2013-07-01
---

As of this month I'm working at Ahold as lead iOS developer on Appie, the Albert
Heijn app. After five years of freelancing across a dozen companies — airlines,
greeting cards, GPS tracking, a startup of my own — this is the longest look I've
had at a single product, and I expect to learn more from that than from another
five short engagements.

The brief sounds simple until you look at it. One universal application for both
iPhone and iPad, talking to a web shop, scanning barcodes, searching recipes,
browsing the week's offers, helping somebody pick a wine, and keeping a shopping
list that behaves sensibly when you reorder it in a shop. Each of those is a
small product. Together they have to feel like one app, and they have to work
while you're standing in aisle four with a basket in your other hand.

That last constraint is the interesting one. A supermarket app is not used at a
desk. It is used one-handed, in a hurry, on a connection that comes and goes as
you walk past the freezers. Most of the hard decisions follow from that rather
than from anything on the feature list. What do you cache, and for how long. What
can you do without a network at all. What happens to a list edited in two places.
How much do you let a slow response block the screen. None of this shows up in a
demo and all of it shows up on a Saturday morning.

The work is not only on the device. There's a mobile services back-end to build
as well, in Java with Spring, which suits me — I spent the first six years of my
career on Java server work, and I've never really believed in the idea that an
iOS developer should stop at the network boundary. The app is as good as the
answers it gets. If you can shape the responses, you can stop solving problems on
the client that should never have reached it.

Technically, the timing is good. iOS 7 was shown off last month and lands in
September, and it is the largest visual change the platform has had. Everything
is going to need revisiting. There is a version of that which is purely
depressing — a season of re-doing work that was already finished — and a version
that is useful, where a forced pass over the whole interface is an excuse to
remove the things that accumulated and never got cleaned up. I intend to treat it
as the second.

I'm also bringing BMCommons along, the open-source iOS library I've been building
since the Behind Media days. A lot of what it does — the REST engine, the view
controller base classes, the utilities you end up writing on every project — maps
onto what this app needs. Keeping it open means it has to stay general, and
having to stay general tends to make a library better rather than worse.

The team runs Scrum and I'm leading the development side of it. I've worked in
small distributed teams for years, where process is mostly an agreement between
three people who already trust each other. A larger team in a large company is a
different problem. I'd rather find that out by doing it than keep taking the
jobs I already know how to do.
