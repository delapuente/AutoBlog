Introducing AutoBlog

AutoBlog is a little JavaScript utility to build static blogs with minimum
server support.

[Explore the source of this page to see it in action!](https://github.com/lodr/AutoBlog/blob/gh-pages/index.html)

With AutoBlog you maintain folders called streams in the server and write
your stories in plain text inside a stream. Each stream must have an
`index` file with a list of published stories.

By using Showdown, you can use Markdown to **format your story**.

This is only a proof of concept of AutoBlog and several features are coming
soon.
+++
## AutoBlog setup

[Clone or download the repository](https://github.com/lodr/AutoBlog) inside
your project (there is not a minified standalone version yet but stay tunned,
this is only an alpha).

The minimal setup includes only three steps:

### 1. Set-up folders
In your static server, create a folder called `stories`. Inside, create a file
named `index`. Start to write your stories and save them inside this folder.
The name is unimportant but add the `.html` extension if you want to use HTML in
the body.

### 2. Write stories
A story has the following format:

```
Title of the story
The body is optional, follows the title after a break line.
\+++
If you break the body by using the former three plus symbols (+++), you create
an excerpt and a body. The excerpt is all before the three pluses. The body is
the rest. You can spceify the author and the publication date after three
dashes using `by` and `on` special words.
\---
by Here the author
on 2013-07-08
```

Save your stories inside the `stories` folder with some name such as
`my-first-story.html`. Then edit the `index` file and add the name as a line
to indicate you want to publish the story:

```
my-first-story.html
```

As you write new stories, add them to the top of `index` to publish them. Only
stories inside `index` are published and they are in the same order than they
appear inside `index`:

```
my-third-story-is-sticky.html
my-first-story.html
my-second-story.html
```

### 3. Code your blog
Now you have the proper folder structure and some stories, it's time to
generate the blog. To do it, add the following scripts to your `index.html`:

```
<script src="lib/polyfills/Promise.js"></script>
<script src="src/autoblog.js"></script>
```

(Supposing you have cloned or download a zipped version of the repository).

Finally add the `data-stream` attribute to the HTML element you want to contain
the stories.

```
<section class="stories" data-stream></section>
```

### FAQ

#### How can I use Markdown in the excerpt and the body?
You can add Markdown support by using Showdown, just add the following script
tag before `autoblog.js`:

```
<script src="lib/showdown.js"></script>
```

And remember ending your story files with the `.md` extension.

#### How can I use --- and +++ without interfering with body or meta separators?
You can use:

```
\+++
and
\---
```

by using their scaped versions:

```
\\+++
and
\\---
```

#### Can I name my folder with other name rather than `stories`?
Yes, you can but then use the attribute `data-stream="yourFolderName"` instead
of the `data-stream` only version.

#### Can I have several streams instead of only one?
Of course, only add the `data-stream` attribute to the proper containers. For
instance:

```
<section data-stream></section>
<section data-stream="haikus"></section>
```

#### Can I customize the story template?
Yes. Inside your `stream` element, add another element with the attribute
`data-template` and it becomes your story template. Inside the template element
use the following _placeholder attributes_ on child elements to show the
proper content:

 * `data-title`: to show the title
 * `data-excerpt`: to show the excerpt
 * `data-body`: to show the body
 * `data-author`: to show the author
 * `data-date`: to show the date

Some things worthing to remember:

 * Any content can be omitted
 * The original template element is lost as the content of the `data-stream`
 element is **completely replaced** by the stories of the stream.
 * The _placeholder attributes_ are removed so avoid using them in CSS or JS
 * If you want support excerpt and body and you want to hide excerpt when it
 is empty mark the element for the excerpt with a class and use CSS pseudo-class
 `:empty`:<br/>
 ```
 .excerpt:empty {
   visibility: hidden;
 }
 ```

---
by Salva
on 2013-6-23
