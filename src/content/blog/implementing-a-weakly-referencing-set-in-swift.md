---
title: "Implementing a weakly referencing set in Swift"
pubDate: 2017-12-22
description: "Building a thread-safe WeakSet in Swift: weak references with Set semantics, generics, and conformance to Sequence."
---

By default all collection types in Swift, or Objective C for that matter, reference their objects (in case they are objects, not structs) in a strong manner so the objects won’t get deallocated unless the collection itself is deallocated. For most use cases this is just fine, since you don’t want objects to disappear out of the blue after they are added to the collection. However, for some use cases a strong reference may not be what you want.

One very common example would be to implement the observer pattern where the observable should not retain its observers, since typically a reference cycle could potentially be created then.

Compare this with the delegate pattern in iOS where the delegate property is always defined as a weak reference instead of a strong reference. Think of the observer pattern as the delegate pattern with multiple delegates instead of just one.

While there are some collection types in NSFoundation that allow you to configure them for weak references (such as NSPointerArray, NSHashTable, NSMapTable), they are a bit cumbersome to use and not very “Swifty” in nature. To show it doesn’t necessarily have to be very hard to implement such a collection type yourself in Swift, we will try to do just that in this example.

We are going to implement a class called “WeakSet” which has the following properties:

- It stores references to objects in a weak manner
- It has Set semantics in that it doesn’t allow duplicate references to be stored, is unordered and allows O(1) lookup and removal
- It defines the type of elements it contains in a generic manner
- It implement the Sequence protocol so it allows iterating over the elements
- It will be initializable with the contents of another sequence or assignable from an array litteral
- It will define a method to compress the set, by removing any references which may have nilled out (objects deallocated from memory)
- It is thread-safe

We’ll address all of these points in the next sections. Let’s start with the first point. All code shown is written using Swift version 4.

### Weak references

To weakly reference objects our set will store an intermediate object called a WeakReference instead of storing the objects directly. We define this class as follows:

```swift
/**
 Wrapper around an object reference to prevent it being strongly retained.
 */
public final class WeakReference<T>: NSObject {

    /**
    Target object, which may be nil if deallocated.
    */
    public var target: T? {
        return _targetObj as? T
    }

    /**
    Internal weak reference.
    */
    private weak var _targetObj: AnyObject?

    /**
    Internal storage of memory address.
    */
    private let _memoryAddress: Int

    public init(_ target: T) {
        self._memoryAddress = unsafeBitCast(target as AnyObject, to: Int.self)
        self._targetObj = target as AnyObject
        super.init()
    }

    public override var hash: Int {
        return _memoryAddress
    }

    public override func isEqual(_ object: Any?) -> Bool {
        if let ref = object as? WeakReference {
            return self._memoryAddress == ref._memoryAddress
        }
        return false
    }
}
```

Now there are a few subtleties in this code already.

First you’ll notice that we extend from NSObject here. This is not so relevant for the weak reference itself, but is relevant for the thread-safety point which will come up later. Let’s ignore that for now. What is relevant is that, because it’s an NSObject, we have to override the hash and isEqual methods of NSObject, instead of directly implementing the Swift Equatable and Hashable protocols. We do want this object to be Equatable and Hashable, since we want to use set sementics (no duplicate entries can exist in the collection).

The second thing you’ll notice is that we keep track of the underlying memory address of the object as an integer and use this integer as value for both the hash and equals implementation. Why don’t we just use the reference identitity (‘===’) operator for the equals implementation and the _targetObj.hashValue for the hash? The reason for this is rather subtle but has to do with the fact that objects should be allowed to remove themselves from the set during their deinit method (that is during deallocation). At this point in time the weak reference will already have nilled out so the WeakReference could not be identified uniquely in the set anymore. Also we violate the set contract at that point because suddenly multiple WeakReference objects could exist which are identical (all references containing a nil target would be equal).

The last thing to note is that this is an immutable object and therefore thread-safe itself.

### Defining a generic Set

We’ll define a class containing the basic set operations add, remove, contains and a count property. For the add, remove and contains we’ll provide a variant which takes a WeakReference as argument, but also a variant which directly takes the underlying object as argument.

```swift
public final class WeakSet<T> {

    fileprivate var _contents = NSMutableSet()

    /**
     Returns the number of references currently in the set.

     Includes potential nil references, so this number >= allObjects.count
     */
    public var count: Int {
        return _contents.count
    }

    public init() {

    }

    /**
     Adds the specified object to the set.
     */
    public func add(_ object: T) {
        add(WeakReference(object))
    }

    /**
    Adds the object to which the specified reference points to the set.
    */
    public func add(_ reference: WeakReference<T>) {
        //Remove the existing ref first, this is delecate,
        //because a lingering reference might exist with the same memory address but nil target.
        _contents.remove(reference)
        _contents.add(reference)
    }

    /**
     Removes the specified object from the set.
     */
    public func remove(_ object: T) {
        remove(WeakReference(object))
    }

    /**
     Removes the object to which the specified reference points from this set.
     */
    public func remove(_ reference: WeakReference<T>) {
        _contents.remove(reference)
    }

    /**
     Whether or not this set contains the specified object.
     */
    public func contains(_ object: T) -> Bool {
        let ref = WeakReference(object)
        return contains(ref) && ref.target != nil
    }

    /**
     Whether or not this set contains the specified reference.
     */
    public func contains(_ reference: WeakReference<T>) -> Bool {
        return _contents.contains(reference)
    }
}
```

Now, again, there are some points to note.

First you’ll note that the set is defined as a generic class so that the type of object it contains is configurable.

Furthermore we use a NSMutableSet as storage implementation. The reason for this is that we want to have control over the thread safety of this set and that is not guaranteed with the copy on write behaviour of Swift structs (the ordinary Swift Set is implemented as a struct). Again we’ll ignore the thread-safety for now, but this is also the reason that the WeakReference had to be a class instead of a struct and extend from NSObject (because NSMutableSet requires that).

One other thing to note is that the add method first removes any existing reference which may be equal to the reference supplied. The existing reference may be a left over from a previously deallocated object which may accidentally had the same memory address as the new reference we want to store. The likelyhood of this happening is very low, but still we have to code defensively against this case.

Finally the contains method (version which takes an object) checks if the target reference is non-nil, because if the ref would already be nil (e.g. during  or after deallocation of the object) it would not show up in the objects that this set contains.

### Conforming to the Sequence protocol

To be able to iterate over the set using the for…in syntax, we have to conform to the Sequence protocol. Doing so is fairly straightforward:

```swift
extension WeakSet: Sequence {
    public typealias Iterator = WeakSetIterator<T>

    public func makeIterator() -> Iterator {
        return WeakSetIterator(_contents.makeIterator())
    }
}

public final class WeakSetIterator<T>: IteratorProtocol {

    private var iterator: NSFastEnumerationIterator

    fileprivate init(_ iterator: NSFastEnumerationIterator) {
        self.iterator = iterator
    }

    public func next() -> T? {
        while let obj = iterator.next() {
            if let ref = obj as? WeakReference<T>, let target = ref.target {
                return target
            }
        }
        return nil
    }
}
```

Note that we basically wrap the iterator returned from the underlying NSSet. What we add is the check for nil target (deallocation of target) using the WeakReference which is stored in the set. The next() method continues looping through the weak references until it finds one with a non-nil target and returns it.

Now we may also define a property to retrieve all non-nil objects from the set as an ordinary Swift array:

```swift
/**
 Returns all non-nil references as an ordinary array.
 */
public var allObjects: [T] {
    //The map function operates on any sequence
    //Because of the way we defined our iterator, only non-nil objects will be returned.
    return self.map {
        return $0
    }
}
```

Note that because of the way the iterator works (only returning non-nil objects from its next() method), this will automatically filter out all nil objects from the set.

We now also can define a new initializer to be able to initialize our set with the contents from another sequence:

```swift
public init<S: Sequence>(_ sequence: S) where S.Iterator.T == T {
    for element in sequence {
        _contents.add(WeakReference(element))
    }
}
```

And as a bonus we can now conform to the protocol ExpressibleByArrayLiteral to initialize our set with an array litteral:

```swift
public final class WeakSet<T>: ExpressibleByArrayLiteral {

    public convenience required init(arrayLiteral elements: T...) {
        self.init(elements)
    }

    //... rest of the implementation of the class
}
```

### Implement set compression

The underlying set count may not be equal to the total count of non-nil objects it contains. There may be lingering references still in the set from objects which may have been deallocated. To remove those nil references we’ll define a ‘compress’ method. We’ll add the following code to our WeakSet class:

```swift
 /**
 Method to remove all nil references from the set.

 Returns true if references were removed, false otherwise.
 */
public func compress() -> Bool {
    var removedElement = false
    for element in _contents.copy() as! NSSet {
        if let ref = element as? WeakReference<T>, ref.target != nil {
            //Keep
        } else {
            //Remove
            _contents.remove(element)
            removedElement = true
        }
    }
    return removedElement
}
```

Note that we’ll copy the set before iterating over it, because otherwise NSMutableSet will throw an exception because you’re not allowed to modify the set while iterating over it. The inverse approach could also be taken, in that only the elements that should be kept are stored in a new set and finally that new set replaces the original _contents set. Because it is expected that there are less nil references in the set than non-nil references the shown approach will likely be faster (both add and remove should have O(1) time complexity).

### Adding thread-safety

Since the end goal is to use this set as potential storage for observers for the observer pattern, in general we would like the set to be thread safe so observers from different threads are free to register/deregister themselves. Since Swift itself does not yet define native methods to ensure thread safety we’ll first define a synchronized method which takes a closure and uses underlying C-functions to accomplish locking:

```swift
import Foundation

/**
 Swift equivalence of @synchronized.
 */
@discardableResult
public func synchronized<T>(_ object: Any, block: () throws -> T) rethrows -> T {
    objc_sync_enter(object)
    defer {
        objc_sync_exit(object)
    }
    return try block()
}
```

Note that generics help us out here since we want this method to take a closure which returns any kind of value which may subsequently be returned from the synchronized function itself. Also we add the ‘rethrows’ keyword to allow the closure to throw an error if so desired.

Next we need to add thread-safety using this synchronized method to our WeakSet. For most functions within our class this is very easy: we define an internal mutex object and wrap the method body while synchronizing on this mutex. To take the ‘add’ method as an example:

```swift
private let _mutex = NSObject()

public func add(_ reference: WeakReference<T>) {
    return synchronized(_mutex) {
        //Remove the existing ref first, this is delicate, because a lingering reference might exist
        //for which the reference is nil, but it is still in the set nonetheless
        _contents.remove(reference)
        _contents.add(reference)
    }
}
```

We basically do the same for all the methods we defined above within the WeakSet.

Now a special case is the iterator. To make iteration on the set thread-safe we want every iterator to function on it’s own copy of the set, while this copy operation itself should be performed in a thread-safe manner.

For this purpose, we modify our ‘makeIterator’ function as follows:

```swift
public func makeIterator() -> Iterator {
    //Should be synchronized because of the copy
    return synchronized(_mutex) {
        let copy = _contents.copy() as! NSSet
        return WeakSetIterator(copy.makeIterator())
    }
}
```

Now every iterator (created when calling for…in on our set) is operating on it’s own copy of the underlying storage so is not affected by potential changes to this storage from operations in other threads. Mind that this makes clear why we used NSMutableSet as implementation instead of just a Swift Set, because for NSSet we can define the exact point in time that the copy takes place to perform it in a protected (synchronized) context. The value and copy-on-write semantics of a Swift Set imply that we [cannot guarantee thread-safety](https://forums.developer.apple.com/thread/53488) in the same manner.

### Summary

We saw that it is not that hard to implement a custom Sequence type which weakly references the objects it contains.

However, there are some subtleties one has to be aware of, especially when dealing with thread-safety and the internals of weak references (them already being nil when called from the deinit method of an object which is in the process of being deallocated).

One thing that hasn’t been touched upon is that constraining the element type (T) will have some compile-time implications because of the way generics work in Swift in combinations with protocols. Ideally T would have been constrained to AnyObject, because references only make sense for object, not structs, but this will have consequences when providing a protocol (even a class protocol) instead of a concrete type as T, see: [https://stackoverflow.com/questions/33112559/protocol-doesnt-conform-to-itself](https://stackoverflow.com/questions/33112559/protocol-doesnt-conform-to-itself).

Please feel free to give feedback about improvements or simplification of the above and let me know if it was useful for you. In a subsequent post I will implement the observer pattern using this WeakSet as underlying storage.
