---
title: "Real world Swift experience from an iOS developer"
pubDate: 2017-12-21
description: "What it is actually like to move from Objective-C to Swift as an experienced iOS developer, including the parts Apple does not mention."
---

![](/images/swift-logo-iphone6-hero-300x225.jpg)

This post is about the experience I have as an experienced iOS developer moving from Objective C to Swift and the story Apple (and some other overly-enthusiastic iOS developers) don’t tell you.

I started programming back in 1998 and have experience in a wide scale of languages, most dominantly being C, C++, Java, Objective C and recently Swift. I started programming for iOS in July 2008, about the same time when the first version of the App Store went live. Since then I participated in a wide range of projects as a freelance developer at smaller and bigger companies, wrote my own open source framework in the process (known as BMCommons, you can find it on GitHub) and also did my own startup. Most of this time I staid away from Swift, because it was too much in flux and the companies I was working for at the time didn’t consider it wise or necessary to jump on the Swift train just yet.

Last year I did make the move and acquired quite some experience already, diving into the corners of the language.

Let me first get things straight: I do like the outline of the language, the syntax it uses, the type safety features, type inference, protocol oriented design and a lot of other things like so many people have pointed out already. However, the devil in a real world scenario is in the details, and that is exactly what I’m trying to elaborate on here. Let me summarise some points which in my view make it a less than ideal language to program in at the moment. (Which may change in the near future).

### Lack of proper IDE support

Some iOS developers think Xcode is the best IDE that exists in the world. Maybe that’s because they lack any form of criticism or that they just have never programmed with IDEs from JetBrains before. However, I’m not one of them 🙂 Having years of experience with AppCode which at this time works very well with Objective C code and gives just an incredible range of refactoring options, Swift support unfortunately is lagging behind. Refactoring in Xcode is basically a synonym for renaming (in the 10% of cases where it doesn’t show an infinite spinner or just crashes the IDE all together, it will probably rename only half of the usages).

I’m not touching on the multitude of other bugs that Xcode contains, which makes you even wonder if Apple is using that IDE themselves or that they just use vi as editor.

Having a good IDE is just about as great a factor in productivity as having a nice programming language, a good mechanic is nothing without having the proper tools to work with.

### Instability of the language

Take a look at StackOverflow for questions on Swift and you’ll agree you have to dig your way through the multitude of answers split out by the specific version of swift. Sometimes a single answer will have 4 or 5 different versions because in every major (or sometimes even minor) version of the language they decided to change the syntax.

Recently (from version 3 to 4) apple restructured the whole protocol structure for integers and just removed some protocols (e.g. BitwiseOperations) which “nobody would use anyway”, except that a project I was working on used it and caused a major rewrite of part of the code. See: https://github.com/apple/swift-evolution/blob/master/proposals/0104-improved-integers.md

### Lack of multi-threading support in the language

In the year 2017, where a typical CPU has 4 to 8 cores it’s just mind blowing that a programming language would not have native support for multi-threaded programming. You have to dig your way using lower level C APIs to get multi-threading working. Things like the synchronized keyword, atomic properties, thread-safe copy on write for structs, volatile variables, thread-safe lazy instance properties: all missing, which is in my mind unacceptable for a language which claims to be production-ready.

### Bugs in the compiler

If you haven’t had a compiler segmentation fault, you probably haven’t tried anything serious with the language yet. Look at the Swift bug tracker for a multitude of issues: https://bugs.swift.org (just search on ‘Segmentation fault’ and open issues). Also perfectly valid code just somehow doesn’t compile or fails to run without having a EXC_BAD_ACCESS (https://stackoverflow.com/questions/47901032/swift-exc-bad-access-with-default-implementation-defined-in-protocol-extension). Debugging this stuff easily costs you a day of productivity.

### Compiler and runtime performance with dynamic frameworks

Compilation of Swift code is just very, very slow compared to Objective C. Being in bigger projects you easily lose an hour of your day waiting for the compiler to be ready. Another thing which is really incomprehensible is that loading dynamic Swift frameworks at runtime is very slow, which causes Apple to recommend you to not exceed loading about 6 dynamic frameworks. This is very bad from a practical point of view, because to avoid tight coupling between components within a big project it’s good practice to separate parts into their own frameworks. Also, living in an open-source world with CocoaPods and Carthage it is not easy to stay within the performance limits set by the dynamic framework loader.

### Swift/Objective C interoperability

The claim of devising a language which is easier to learn and to work with quickly fades when you are exposing the interoperability between two fundamentally different languages. While it is a good thing that Swift code can use Objective C since it has a superset of its features, allowing also the inverse in my mind is a very bad decision and complicates matters greatly. This could have worked if both languages would follow the same dynamic model using messages and runtime dispatch, but since Swift uses an entirely different (static) dispatch model the interoperability is sometimes hard to understand and to reason with, even from the point of view of an experienced Objective C developer.

Decorating a Swift protocol with the @objc attribute sometimes allows code to compile which otherwise wouldn’t. Also enums behave differently when they are decorated with @objc, key-paths only work for properties which are decorated with @objc, etc. In my point of view both languages should have compiled to the same underlying model which would make things a lot less complicated, just like Java and Kotlin.

Now the complexity basically went from understanding Objective C to understanding Objective C, Swift, Swift to Objective C and Objective C to Swift.

### Swift generics

Swift claims to be a protocol oriented language, which coming from the Java world, I like a lot. In general it is way superior to code against interfaces instead of concrete implementations so the real implementations can be swapped for something different in the future and you separate your public contract from the concrete implementation(s).

Being type-safe you generally want your interfaces (protocols) to support generic constructs. Swift implements this with “Generic protocols” or “Protocols with associated types”. However, if you start to use these you quickly run into the jungle of compiler errors which point out to you that Swift is not such a protocol-oriented language after all. That a concept like “Type erasure” is even a valid pattern in Swift, which by the way makes you write immensely cumbersome boilerplate code, points out that something is still really wrong here. Also covariance support is still missing in Swift generics which makes it hard to support some type-safe constructs and obliges you to go back to “Any” in one way or the other. In Java these kinds of issues just don’t exist (interfaces are on the same level as classes from a generic perspective).

### Swift access control

Swift basically assumes you have two types of developers:

Developers which contribute to a particular module and should be able to access everything within it (internal access)

Developers which are not contributing that particular module and should only be able to access public and open methods

However, taking into account that for performance reasons only limited numbers of dynamic frameworks can actually be used, one quickly ends up having multiple teams contributing to the same module. The only way to hide implementations from other contributors to the same module seems to be to aggregate related functionality into one big file and make use of the fileprivate or private access modifier. This is most of the time an anti-pattern since it results in files which are way to big and contain too many lines of code.

Swift badly needs namespaces and namespace level accessibility to accommodate for this problem.

Also there is no way, other than documentation or throwing fatalErrors to ensure correct inheritance implementations, since there is no support for the protected access modifier or abstract methods/classes. While the tendency in Swift is that they discourage inheritance over composition and protocols with default implementation, there are a big number of real-world scenarios where inheritance is very relevant. (Inheritance is used a lot in UIKit and basically the only way to accomplish things there). Also there are some issues with default protocol implementations which make them less than ideal for all use cases: https://team.goodeggs.com/overriding-swift-protocol-extension-default-implementations-d005a4428bda

### Lack of custom attributes, AOP support, dependency injection

This is more nice to have, but considering Swift is a new language one would expect that modern features which solve common architectural problems exist. Having used the Spring framework a lot in the Java world, it feels really frustrating that no good solutions exist based on native language features for things like:

Custom attributes to support meta information about a class/method or properties, similar to Java annotations. There is a large number of use cases which could benefit from this (e.g. JSON to object mapping, Core data implementation without having to subclass NSManagedObject, etc)

Aspect oriented programming support for cross-cutting concerns like logging and in particular analytics, which happen in any production iOS application. Now most developers resort to having a base class for this kind of functionality (e.g. BaseViewController).

Dependency injection support built in to avoid using singletons throughout the code, making code more testable and easier to decouple.

### Summary

While a lot of things in the Swift language are there to be liked, working with Swift in a real-world enterprise scenario is just not so perfect yet.

While many of the current drawbacks will probably be fixed in future versions, it is something to be aware of for companies migrating their current Objective C codebase to Swift. The claim that working with Swift is simpler and faster than Objective C may well be true for simple apps with no former code base.

However, as soon as the code base gets more advanced, interoperability comes into play and projects tend to grow with larger teams or an expanding number of modules, some reservations need to be in place.

I do however remain positive and continue to put effort into Swift and to report every bug I encounter with Apple as I feel this is the way forward and eventually the language and supporting tools will get there.
