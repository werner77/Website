---
title: "Implementing the observer pattern in Swift"
pubDate: 2017-12-23
description: "Communicating between classes without tight coupling, and a sound solution to the multiple-delegate problem in Swift."
---

A common problem in iOS or Mac applications is how to properly communicate information between classes (or protocols) without allowing tight coupling. In this post we will discuss the options being available and pose a solution for the multiple delegate problem in a way which is architecturally sound.

### Delegation

For communication between two single classes, Apple suggests using the [delegate](https://developer.apple.com/library/content/documentation/General/Conceptual/DevPedia-CocoaCore/Delegation.html) pattern, which solves the problem neatly in that it:

- Designates one of the two classes as owner of the relationship, thereby preventing strong retain cycles to be created. The owner is by definition the receiver of information and the owned class the sender.
- Loosely couples the two classes by defining an intermediate delegate protocol, which the owning class implements.
- Allows the information sending class to be used by different owning classes, as long as they implement the delegate protocol.

So far, so good. But what now if we want to implement a multiple delegate pattern, in which there is no single owner but (potentially) a whole range of listeners that are interested in the information the sender has to send?

NSFoundation at first glance seems to offer a solution for this, which is NSNotificationCenter. From an architectural point of view however, NSNotificationCenter is not such a good idea for anything other than pure system events (e.g. keyboard appearance, application activation/deactivation, etc). There are a couple of reasons for this:

- NSNotificationCenter is not type-safe. It allows sending key-value pairs with basically nothing but a (hopefully) unique string defining the event being broadcast.
- It allows coupling of everything with everything, not caring about the ownership of the relation (two classes can send notifications to each other, basically tightly coupling them).
- There is no compile-time safety, so it’s easy to break the contract while refactoring and it is not apparent which classes depend on which, which may be problematic if you want to separate out modules from a growing code base.

For these reasons, in my mind it is not a wise idea to use NSNotificationCenter for anything other than purely global notifications.

### The observer pattern

The observer pattern is basically a fancy name for implementing a solution for the multiple delegate problem posed above. Basically it says that an object, called the observable, sends events to observers, being objects that registered themselves as being interested in those events. In this relationship the observable doesn’t need to know which concrete observers there will be up front. In general it only defines the events it can broadcast and let the observers choose if they want to do something with them or not. Like in the single delegate pattern the observable should never strongly reference its observers.

There are examples of the observer pattern in iOS, such as:

- Key-value observation, for observation of property changes on NSObjects
- The UIControl event notification mechanism, where observers can register themselves for certain (user interaction related) events on a UIControl, such as TouchUp, ValueChanged, etc.

Key value observation, while having some virtues in a (file-)private context, is generally not a very good idea to use for public events. KVO doesn’t allow you to define the public events or your class or protocol explicitly. Instead, basically any property may be observed, which may get messy if you want to refactor later on. Also, by nature it is again not a type-safe solution, but revolves around KeyPaths (which are strings) and Dictionaries which contain the old/new values as generic (Any) objects.

The mechanism used by UIControl revolves around target/selectors which is basically an Objective C pattern (dynamic dispatch).

Below I will pose a solution for the observer pattern in a more “Swifty” way which offers type-safety and compile time checks, is protocol oriented and will also avoid writing boiler plate code for concrete implementations. All code is written using Swift version 4.0

### Observable protocol

We begin by defining the protocol that a class should implement to enable observations, which means it will allow observers to register and deregister themselves and has a generic notification method to send events to the registered observers:

```swift
/**
Protocol describing an object which may be observed by associated observers.

The observable weakly references its observers.
*/
public protocol Observable: class {

    /**
    Type of observer: which will be a protocol defining the notifications that may be sent.
    */
    associatedtype Observer

    /**
    Array containing the currently alive observers (not yet deallocated).
    */
    var observers: [Observer] { get }

    /**
    Adds an observer.
    */
    func addObserver(_ observer: Observer) -> ObserverToken

    /**
    Removes an observer.
    */
    func removeObserver(_ observer: Observer)

    /**
    Notifies all observers with the specified closure.
    */
    func notifyObservers(_ closure: (Observer) -> Void)
}
```

As you’ll note, this protocol defines an associated type, called the Observer. This type will be assigned by concrete observables to be the delegate protocol that the observer classes needs to implement and which defines the notifications the observable may send. Swift allows you to use a protocol as associated type for another protocol as long as you don’t impose any restrictions on this protocol. Hopefully this will change in the future, but for now we have to live with it. For our purpose here it suffices, however. The Observable protocol is defined as a class protocol, since it only makes sense for types that have reference semantics.

We defined the addObserver method to return a so-called ObserverToken, which is a struct that allows the observer to deregister itself without having to keep track of the observable. The implementation of this ObserverToken is very basic:

```swift
/**
Token which uniquely defines a registered observation and may subsequently be used to remove the observation.
*/
public struct ObserverToken: CustomStringConvertible {

    private let removalBlock: () -> Void
    private let identifier = UUID()

    fileprivate init(removalBlock: @escaping () -> Void) {
        self.removalBlock = removalBlock
    }

    /**
    Deregisters (removes) the observer from the observable
    */
    public func deregister() {
        removalBlock()
    }

    public var description: String {
        return "ObserverToken(\(self.identifier))"
    }
}
```

We included a UUID for each ObserverToken so it can be printed out and tracked uniquely. It defines a deregister() method to undo the registration as performed by the addObserver(_) method.

Now the nice part starts. Because Swift allows us to provide a default implementation for a protocol, we can provide meaningful default implementations, so that concrete implementations of Observable don’t have to do this themselves (and in the process, avoiding to write boiler plate code). In Objective-C this would only be possible by either sub-classing or using C macro’s, both of which are not really nice solutions. We define our default Observable implementation as follows:

```swift
public extension Observable {

    private var observerSet: WeakSet<Observer> {
        //TODO
    }

    public var observers: [Observer] {
        return observerSet.allObjects
    }

    public func addObserver(_ observer: Observer) -> ObserverToken {
        observerSet.add(observer)

        //Explicitly use a weak reference to the observer, because the observer itself may be nil already if called
        //during deallocation
        let ref = WeakReference(observer)
        let result = ObserverToken(removalBlock: { [weak self] in self?.removeObserver(ref) })

        return result
    }

    public func removeObserver(_ observer: Observer) {
        observerSet.remove(observer)
    }

    public func notifyObservers(_ closure: (Observer) -> Void) {
        for observer in observers {
            closure(observer)
        }
    }

    private func removeObserver(_ reference: WeakReference<Observer>) {
        observerSet.remove(reference)
    }
}
```

Note that we make use here of the WeakReference and WeakSet defined in [a previous post](https://www.behindmedia.com/2017/12/22/implementing-a-weakly-referencing-set-in-swift/). It is important to use a collection type which weakly references its constituents to avoid retain cycles as we mentioned above.

The addObserver(_) method constructs an ObserverToken and specifies its removal block. It is important to use a WeakReference (which keeps track of the memory address) for removal, because if the ObserverToken.deregister() method is called from the deinit method of the observer, an ordinary weak reference to the observer will already be nil at that point in time. Again see the [previous post](https://www.behindmedia.com/2017/12/22/implementing-a-weakly-referencing-set-in-swift/) for elaboration on this subject.

Finally, we defined a private computed property named observerSet, which will return the WeakSet to use as storage implementation for the observers. While we could have defined this property public in the protocol, this would expose the underlying storage which is not desirable from an encapsulation point of view. We have to perform some trickery to get this working however, relying on Objective C associated objects. If this is not your cup of tea, then by all means define this property public and implement it in an ordinary Swift way (a concrete implementation would just define a public stored property of type WeakSet). But, like I said, you are exposing the underlying storage for the observers then, so it can be directly manipulated from the outside (observers could directly be added/removed to/from this set, bypassing the addObserver/removeObserver methods), which is architecturally not a sound approach.

### Implementing the WeakSet storage with associated values

Objective C allows you, with a low level API, to associate objects with other objects so their life-cycle is bound together (the associated value gets released as soon as the containing object gets released). Using associated values it was possible in Objective C to define stored properties in categories by means of extension. As I found out this approach works equally well for Swift, while not even requiring the Swift class to extend from NSObject or being annotated with @objc (which is pretty surprising actually).

Let’s define a global Swift function as follows:

```swift
import ObjectiveC

public func associatedValue<T>(for object: Any, key: UnsafeRawPointer, defaultValue: @autoclosure () -> T) -> T {
    return synchronized(object) {
        if let nonNilValue = objc_getAssociatedObject(object, key) {
            guard let typeSafeValue = nonNilValue as? T else {
                fatalError("Unexpected: different kind of value already exists for key '\(key)': \(nonNilValue)")
            }
            return typeSafeValue
        } else {
            let newValue = defaultValue()
            objc_setAssociatedObject(object, key, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            assert(objc_getAssociatedObject(object, key) != nil, "Associated values are not supported for object: \(object)")
            assert(objc_getAssociatedObject(object, key) is T, "Associated value could not be cast back to specified type: \(String(describing: T.self))")
            return newValue
        }
    }
}
```

This function is made synchronized to let the get/set operation be atomic and contains some extra assertions to ensure it works properly as defined, just for safety. Again take a look at [this previous post](https://www.behindmedia.com/2017/12/22/implementing-a-weakly-referencing-set-in-swift/) for a definition of the synchronized function (which basically mimics @synchronized in Objective C). Note that it uses an autoclosure for the default value, so that value is only instantiated if it does not already exist.

Now, using this helper function we can implement the private observerSet property of our Observable extension.

```swift
private var observerSetKey = "com.behindmedia.common.core.Observable.observerSet"

public extension Observable {

    private var observerSet: WeakSet<Observer> {
        return associatedValue(for: self, key: &observerSetKey, defaultValue: WeakSet<Observer>())
    }

    //... rest of the code
}
```

Note that we use a global constant as key for the associated value (unfortunately protocols with associated types don’t allow the use of static vars in an extension). It needs to be a static constant, since the key used by objc_setAssociatedObject should be a constant memory address (UnsafeRawPointer).

With the above addition, everything is now in place to implement a concrete type-safe “Swifty” observer pattern. Let’s do this with an example now.

### Concrete example: LoginService

Let’s assume our app contains a login mechanism, which allows a user to login with a username/password combination. Multiple parts of the app may be interested in this login event, because it may trigger UI changes, initialization of certain settings and what not.

For this purpose we define a LoginService protocol and a LoginServiceListener protocol as follows:

```swift
public protocol LoginServiceListener {
    func loginService<S: LoginService>(_ service: S, didFinishWithSuccess success: Bool)
}

public protocol LoginService: Observable where Observer == LoginServiceListener {
    func login(username: String, password: String)
}
```

The LoginService protocol extends from the Observable protocol and defines the type alias Observer to be equal to LoginServiceListener. Because the Observable protocol has a default implementation for all of its methods, we don’t have to write any implementation for Observable ourselves and thereby we avoid writing any boiler plate code.

Now let’s define concrete implementations for both of these protocols:

```swift
public class LoginServiceListenerImpl: LoginServiceListener, CustomStringConvertible {
    public let name: String

    public init(name: String) {
        self.name = name
    }

    public func loginService<S: LoginService>(_ service: S, didFinishWithSuccess success: Bool) {
        print("\(self) received login result: \(success)")
    }

    public var description: String {
        return "Listener(\(self.name))"
    }
}

public class LoginServiceImpl: LoginService {
    public typealias Observer = LoginServiceListener

    public func login(username: String, password: String) {
        //Mock login implementation
        let success = username == "werner" && password == "altewischer"

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.broadcastLoginResult(success: success)
        }
    }

    private func broadcastLoginResult(success: Bool) {
        notifyObservers {
            $0.loginService(self, didFinishWithSuccess:success)
        }
    }
}
```

We mocked the LoginService implementation so only the username/password combination of “werner”/”altewischer” will trigger a successful login, which will be triggered asynchronously after 1 second to simulate an asynchronous call.

Note that we automatically get access to the “notifyObservers” method, which takes a closure and lets us notify all registered observers.

The definition of the typealias should technically not be necessary (since the where clause in the LoginService protocol already binds it), but as of the time of writing is due to [this bug in Swift 4](https://stackoverflow.com/questions/47882861/swift-protocol-conformance-with-associated-type-using-same-type-constraint).

Now we can use this implementation for a simple test (e.g. in Playground) as follows:

```swift
let loginService = LoginServiceImpl()

//Use an autorelease pool te define a memory boundary
autoreleasepool {
    let listener1: LoginServiceListener = LoginServiceListenerImpl(name: "listener 1")
    let listener2: LoginServiceListener = LoginServiceListenerImpl(name: "listener 2")

    //Register the two listeners
    let token1 = loginService.addObserver(listener1)
    let token2 = loginService.addObserver(listener2)

    //Shows 2 observers
    print("observers: \(loginService.observers)")

    //Perform the asynchronous login
    loginService.login(username: "werner", password: "altewischer")

    //Wait for the result
    let startDate = Date()
    repeat {
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.1))
    } while(Date().timeIntervalSince(startDate) < 2.0)

    //Deregister listener 1
    token1.deregister()

    //Will now show 1 observer
    print("observers: \(loginService.observers)")
}

//Even though observer 2 did not deregister, because of the weak set, it will not be present anymore
//It is good practice though for an observer to deregister itself
print("observers: \(loginService.observers)")
```

This test shows that:

- The listeners can be defined as protocol types
- They are successfully registered as observers (as printed out)
- They both receive the login notification asynchronously
- Listener 1 is deregistered manually
- Listener 2 is deregistered automatically, because it got deallocated

One caveat is that we cannot define the loginService constant to be of type LoginService, i.e.:

```swift
let loginService: LoginService = LoginServiceImpl()
```

since this will trigger the infamous error:

protocol 'LoginService' can only be used as a generic constraint because it has Self or associated type requirements

This is one of the most annoying Swift features I bump into all the time, and hopefully eventually will be fixed, since it obstructs pure protocol oriented programming. It may be fixed with type erasure to some extent, but that makes things worse because it involves writing a lot of boiler plate code.

### Summary

We showed that using a combination of Swift protocol features, such as associated types and default implementations, and the addition of associated objects we were able to implement the Observer pattern in a protocol oriented manner without having to duplicate boiler plate code by concrete implementations. Also we showed that we could avoid retain cycles using weak set semantics. As a bonus the whole implementation is thread-safe as well (because the [WeakSet implementation used](https://www.behindmedia.com/2017/12/22/implementing-a-weakly-referencing-set-in-swift/) is thread-safe).

By implementing the observer pattern in this manner we can avoid using NSNotificationCenter or KVO observation which have drawbacks from an architectural point of view as noted.
