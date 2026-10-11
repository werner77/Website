---
title: "Writing software that holds people's money"
description: "Starting on the ING Bankieren app, and what changes when the thing in someone's pocket is their bank."
pubDate: 2017-10-02
---

After four years at Ahold I've moved on, and since this month I'm working on the
ING Bankieren app. Supermarket to bank is a shorter step than it sounds — both
are apps that millions of people open without thinking, several times a week,
and judge instantly. What changes is the cost of being wrong.

In retail, a bad release means a bad week. Somebody can't find the offers, the
shopping list syncs badly, you ship a fix and it's forgotten. In banking the
same mistake is a different category of event. The app is the branch now. If it
is down, or slow, or shows somebody a balance that isn't theirs, that is not a
bug report — it's a news story, a regulator's letter, and a real person at a
till who can't pay.

That changes how the work feels more than what it consists of. The code is
recognisably the same craft: networking, state, caching, view controllers,
the same arguments about architecture. But the tolerance around it narrows.
Everything is reviewed. Everything is logged. Releases are deliberate rather than
frequent, and the question is never only "does it work" but "can we show that it
works, and can we show it later to somebody who wasn't here."

I've found I don't mind that at all, and I half expected to. There's a view in
our industry that process is what happens to engineering when it gets old — that
velocity is the only real virtue and the rest is bureaucracy dressed up as care.
I've never found that convincing. Most of the discipline that looks like red tape
from the outside is a rule written after somebody lost something. You are allowed
to argue that a specific rule is wrong. The argument that there should be no
rules is just an argument for making the mistakes again, in order.

The other reason this is good timing is Swift. I held off longer than most. For
years the language moved under you faster than a production codebase could follow,
and migrating a large app to a moving target is a bad trade no matter how much
nicer the syntax is. Swift 4 shipped last month, source stability is in sight, and
the calculation has changed. I've been writing quite a lot of it over the past
year and I have opinions now — some of them enthusiastic, several of them not,
and most of them not what you read in the conference talks. I'll write those up
separately.

What I keep coming back to is how little of this job is really about the
language. The hard parts are the same as they were when I was writing J2EE
services in 2003: what happens when the network lies to you, what you do with
state you can't trust, how you fail in a way that doesn't make things worse. The
syntax changes every few years. That part never has.
