---
title: "Using ActiveSupport in plain Ruby scripts"
description: "How to use ActiveSupport's convenience methods in plain Ruby, without pulling in all of Rails."
publishedAt: 2023-06-26
---

## Ruby and Rails are not the same thing

People often get confused between Rails and Ruby, and it's understandable why. Rails is a web application framework built using the Ruby language, so they go hand in hand. Ruby is the programming language, known for its simplicity and readability, while Rails is a framework that makes web development easier mainly by encouraging [convention over configuration](https://rubyonrails.org/doctrine#convention-over-configuration).

One reason for the confusion is that Rails developers often use ActiveSupport, a Ruby library that comes bundled with Rails. It provides helpful methods for things like date manipulation and string inflections. These methods are useful when working on Rails projects, but they're not available by default in pure Ruby. So sometimes developers try to use these Rails-specific methods in regular Ruby scripts and get stuck.

What some don't realize is that you can use them both ways.

## Using ActiveSupport

While ActiveSupport methods are primarily designed to enhance Ruby within the Rails framework, there are cases where you might find them useful even when writing pure Ruby scripts. ActiveSupport provides a collection of handy methods that can simplify your code and make it more expressive.

One advantage of ActiveSupport methods is that they often serve as syntactic sugar, offering a more readable and elegant way to accomplish common tasks. For example, the `index_with` method allows you to create a hash using an array, where each element becomes a key and the block specifies the corresponding value. This one-liner can replace multiple lines of code, making your intentions clearer and reducing the potential for errors.

Here's an example of using `index_with`:

```ruby
require 'active_support/all'

fruits = ['apple', 'banana', 'orange']
indexed_fruits = fruits.index_with { |fruit| fruit.length }

puts indexed_fruits
# Output: {"apple"=>5, "banana"=>6, "orange"=>6}
```

Another useful ActiveSupport method is `Array.wrap`. It ensures that a value is always wrapped in an array, even if it's already an array or nil. This method is particularly helpful when dealing with optional or multiple values. It saves you from writing conditional statements to handle different cases and provides a consistent way to work with arrays.

Here's an example using `Array.wrap`:

```ruby
require 'active_support/all'

def process_items(items)
  items = Array.wrap(items)

  items.each do |item|
    puts "Processing: #{item}"
  end
end

process_items('apple')
# Output: Processing: apple

process_items(['banana', 'orange'])
# Output:
# Processing: banana
# Processing: orange

process_items(nil)
# No output (since there are no items)
```

In this example, `Array.wrap` ensures that the `items` argument is always treated as an array, regardless of whether it's a single value or an array itself. This simplifies your code and avoids the need for conditional checks.

By leveraging ActiveSupport methods like `index_with` and `Array.wrap`, even in pure Ruby scripts, you can enhance code readability, reduce verbosity, and handle common scenarios more comfortably.

## Use ActiveSupport with plain Ruby scripts

To import and use ActiveSupport methods in your Ruby scripts, you have a couple of options. You can either import specific methods individually or import all the Active Support methods at once.

If you only need a few specific methods from ActiveSupport, you can import them individually by requiring the corresponding file. Each ActiveSupport method has its own file, so you can selectively import the ones you need. For example:

```ruby
require 'active_support/core_ext/array/wrap'
require 'active_support/core_ext/hash/keys'
```

In this case, you would only import the `wrap` method from the `Array` class and the `keys` method from the `Hash` class. This approach keeps your code concise by only bringing in the specific methods you require.

On the other hand, if you want to import all the ActiveSupport methods at once, you can use the `active_support/all` file. This file imports the core extensions and adds all the methods provided by ActiveSupport to their respective Ruby classes. Here's an example:

```ruby
require "active_support/all"
```

By requiring `active_support/all`, you gain access to the full range of ActiveSupport methods for arrays, hashes, strings, dates, times, and more. This approach provides convenience and flexibility, as you have access to the entire ActiveSupport feature set in a single import statement.

To learn more about the Active Support core extensions and the methods available for each Ruby class, you can refer to [the official Rails Guides documentation on Active Support core extensions](https://guides.rubyonrails.org/active_support_core_extensions.html).

These guides provide detailed information about each extension category and the corresponding methods, helping you understand and leverage the power of ActiveSupport in your Ruby scripts.

You're not locked into loading all of Rails to use its most useful parts. `require 'active_support/all'` is a one-liner that pays for itself.
