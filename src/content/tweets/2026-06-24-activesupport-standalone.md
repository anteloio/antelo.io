You don't need all of Rails for its syntactic sugar.

```ruby
require "active_support/all"

2.weeks.ago             # => yes, you can do this!
"hello_world".camelize  # => "HelloWorld"
[1, 2, 3].second        # => 2
```

Just require ActiveSupport ✨
