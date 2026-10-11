---
title: "Back to pattern recognition"
description: "Joining Beatgrid to work on passive audio content recognition, eighteen years after writing a thesis on more or less the same problem."
pubDate: 2020-03-16
---

My first commit at Beatgrid went in today, which is an odd day to start anywhere.
The country shut down over the weekend, so a job that was going to begin with a
desk and a handshake has begun with neither. Everybody is working out at the same
time what the next few months look like, and nobody knows.

So: a strange beginning, but a good problem.

Beatgrid measures whether advertising is actually seen and heard. Not modelled,
not inferred from a panel's diary — measured, from a phone in somebody's pocket,
with their explicit and repeated consent. The device listens for audio it can
recognise, matches it against known advertising, and reports that an exposure
happened. Do that across enough people and across TV, streaming, online and
outdoor, and you can answer a question the industry has been approximating for
fifty years: did the same person see this campaign in two places, or did we count
them twice?

The technical problem underneath is audio content recognition, and this is where
it stops being a career move and becomes slightly funny.

In 2001 I wrote a thesis at Delft in the Pattern Recognition and Image Processing
group, on implementing robot soccer player skills using vision-based motion. The
robots had to work out what was in front of them from a noisy camera feed, fast
enough to act on it, with very little computer to do it on. That was the whole
problem: extract a reliable signal from a messy real-world input, under hard
constraints, in real time.

Eighteen years later I'm being asked to do exactly that again, with a microphone
instead of a camera. The maths rhymes — transforms, statistics, peak finding,
matching against a reference — and the constraints are, if anything, tighter.
A camera on a robot has a power cable. A phone has a battery, an operating system
that is actively hostile to anything running in the background, an owner who will
uninstall you without hesitation if either of those suffers, and a privacy
obligation that is not negotiable and shouldn't be.

I took a long detour to get back here. Java back-ends, video codecs at a startup,
ten years of iOS, a banking app. None of it was wasted — this job needs the
signal processing *and* the mobile platform knowledge *and* the server side, and
there aren't many problems where all three are load-bearing at once. But I didn't
plan the route. It only looks deliberate from this end, which I suspect is true
of most careers that are described as deliberate.

What I'm looking forward to is the breadth. Small company, real problem, and the
whole stack is in scope: the signal processing in C++, the clients on both mobile
platforms, the back-end, and the infrastructure under it. After twelve years of
being brought in to do one well-defined part of somebody else's system, owning
all of it is the appeal.

Starting from a spare room in Arnhem, apparently. We'll see how that goes.
