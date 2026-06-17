---
title: "Pagination with React Query"
description: "Implementing 'load more' pagination with React Query's useInfiniteQuery against a Ruby on Rails back-end."
publishedAt: 2023-11-01
---

If you prefer the video format, I've also published a [YouTube video](https://www.youtube.com/watch?v=ulxlWUjb7Iw) where I implement pagination using React Query with a Ruby on Rails back-end. To save you time, the React Query part starts on minute 4.

## Requirements

I'm assuming you already have an endpoint that is capable of the following:

- returning a list of elements
- handling the `page` parameter

In practice, your endpoint is supposed to respond to, for instance, `/api/articles?page=1`, and it should return a list of the first page of articles. Needless to say, it should do the same for page 2, and so on.

## Implementation

There's one single component you'll need to add to your user interface, and it is a "load more" button, allowing users to load the next page.

You could also opt for an "infinite scrolling" approach, but I'll keep that for another article. If you're interested, leave a comment on the YouTube video above.

Anyway, all it takes is a Button component, capable of fetching the next page:

```jsx
{hasNextPage && (
  <Button onClick={fetchNextPage} fullSized>
    Show more
  </Button>
)}
```

The fetchNextPage function comes directly from our React Query hook:

```js
const { data, fetchNextPage, hasNextPage } = useNotificationsIndex()
```

Which directly exposes useInfiniteQuery:

```js
const INDEX_KEY = ['user', 'notifications', 'index']

export const useNotificationsIndex = () =>
  useInfiniteQuery(
    INDEX_KEY,
    ({ pageParam = 1 }) =>
      axios
        .get(`/user/notifications.json?page=${pageParam}`)
        .then((response) => response.data),
    { getNextPageParam }
  )
```

We'll finally need to provide a function that allows React Query to determine what is the next page parameter. Of course, this will usually be the current page plus one, but we also need to figure out when we're on the last page. For that, I like to use the following trick:

```js
const PER_PAGE = 20

const getNextPageParam = (lastPage, allPages) =>
  lastPage.length === PER_PAGE ? allPages.length + 1 : undefined
```

To illustrate, imagine we have 46 elements in our list. The endpoint will return 20 elements for page 1, 20 elements for page 2, then finally only 6 elements for page 3. So I assume that, when the last page had anything different from 20 elements, then there is no other page to load.

To tell React Query that you don't need it to load the next page, you just need to make getNextPageParam return undefined. That's what I do above.

## Rendering data

Finally, to render your elements, there's one important difference between useInfiniteQuery when compared to useQuery. And it is that useInfiniteQuery will return a paginated list of elements, inside its data, while useQuery would directly return the data from the endpoint.

To illustrate, with useQuery, we were able to directly use the data:

```js
const { data: notifications } = useQuery(...)

return notifications.map((notification) => ...)
```

With useInfiniteQuery, however, the results are paginated, so we can flatten them out first so that we can then use the notifications variable, just like we were used to doing with useQuery:

```js
const { data } = useInfiniteQuery(...)
const notifications = data?.pages.flat()

return notifications.map((notification) => ...)
```

## Conclusion

As usual, React Query is such a pleasure to use. The implementation of pagination is straightforward, and you can find the example above directly on [this GitHub commit](https://github.com/cherrypush/cherrypush.com/commit/4bc95f29e5a3d3565a74861b0dbbb63f33861007).

Also, note that we could opt to use the same approach of "infinite scrolling". For that, we'd need to watch for a DOM element that is placed at the bottom of the list and use it to trigger the fetchNextPage function.
