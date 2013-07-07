(function(global, undefined){

  'use strict';

  var AutoBlog = global.AutoBlog = Object.create(null);

  function to(obj) {
    return {
      'addGet': function(name, impl) {
        Object.defineProperty(obj, name, { get: impl });
        return this;
      }
    }
  }

  function getURL(url) {
    return new Promise(function (resolver) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function (evt) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolver.fulfill(xhr.responseText);
          } else {
            resolver.reject(xhr.status);
          }
        }
      };
      xhr.send();
    });
  }

  var Story = AutoBlog.Story = function (source) {
    var model = Story.parseSource(source);
    to(this)
      .addGet('title', function () { return model.story.title; })
      .addGet('excerpt', function () { return model.story.excerpt; })
      .addGet('body', function () { return model.story.body; })
      .addGet('author', function () { return model.meta.author; })
      .addGet('date', function () { return model.meta.date; })
    ;
  };

  Story.parseSource = function (source) {
    var storyAndMeta = source.split(/^-{3,}\n/m),
        storySource = storyAndMeta[0],
        metaSource = storyAndMeta[1] || '';

    var storyModel = Story.parseStory(storySource),
        metaModel = Story.parseMeta(metaSource);

    return {
      story: storyModel,
      meta: metaModel
    };
  };

  Story.parseStory = function (source) {
    var titleAndBody = source.match(/(.+)(\n(?:.|\s)+)?/m),
        title = titleAndBody[1].trim(),
        body = titleAndBody[2] || '';

    var excerptAndBody = body.split(/^\+{3,}\n/m),
        body = excerptAndBody[excerptAndBody.length === 2 ? 1 : 0].trim() ||
               undefined;
    var excerpt = excerptAndBody.length === 2 ?
                  excerptAndBody[0].trim() : undefined;

    return {
      title: title,
      excerpt: excerpt,
      body: body
    };
  };

  Story.parseMeta = function (source) {
    var authorMatch = source.match(/by\s+(.+)/mi),
        dateMatch = source.match(/on\s+(.+)/mi),
        dateComponents, date;

    if (dateMatch && dateMatch.length === 2) {
      dateComponents = dateMatch[1].split('-');
      if (dateComponents.length === 3) {
        date = new Date(
          parseInt(dateComponents[0], 10),
          parseInt(dateComponents[1], 10) - 1,
          parseInt(dateComponents[2], 10)
        );
      }
    }
    return {
      author: authorMatch && authorMatch[1].trim() || undefined,
      date: date
    }
  };

  var HTMLEmitter = AutoBlog.HTMLEmitter = function (story, template) {
    to(this)
      .addGet('story', function () { return story; })
      .addGet('template', function () { return template; })
    ;
  };

  HTMLEmitter.getFragmentFromString = function (source) {
    var wrapper = document.createElement('DIV'),
        fragment = document.createDocumentFragment(),
        children;

    wrapper.innerHTML = source;
    children = [].slice.call(wrapper.children, 0);
    for (var i = 0, l = children.length; i < l; i++) {
      fragment.appendChild(children[i]);
    }
    return fragment;
  };

  HTMLEmitter.prototype.toDOM = function () {
    var wrapped = true,
        root = document.createElement('DIV');

    root.innerHTML = this.template;
    this.makeContainer(root);
    this.makeTitle(root);
    this.makeExcerpt(root);
    this.makeBody(root);
    this.makeAuthor(root);
    this.makeDate(root);

    return HTMLEmitter.getFragmentFromString(root.innerHTML);
  };

  HTMLEmitter.prototype.makeContainer = function (root) {
    var container = root.querySelector('[data-container]');
    if (container === null) { return; }

    delete container.dataset.container;
  }

  HTMLEmitter.prototype.makeTitle = function (root) {
    var title = root.querySelector('[data-title]');
    if (title === null) { return; }

    if (this.story.title !== undefined) {
      title.innerHTML = this.story.title;
    }
    delete title.dataset.title;
  }

  HTMLEmitter.prototype.makeExcerpt = function (root) {
    var excerpt = root.querySelector('[data-excerpt]');
    if (excerpt === null) { return; }

    if (this.story.excerpt !== undefined) {
      excerpt.innerHTML = this.story.excerpt;
    }
    delete excerpt.dataset.excerpt;
  }

  HTMLEmitter.prototype.makeBody = function (root) {
    var body = root.querySelector('[data-body]');
    if (body === null) { return; }

    if (this.story.body !== undefined) {
      body.innerHTML = this.story.body;
    }
    delete body.dataset.body;
  }

  HTMLEmitter.prototype.makeAuthor = function (root) {
    var author = root.querySelector('[data-author]');
    if (author === null) { return; }

    if (this.story.author !== undefined) {
      author.innerHTML = this.story.author;
    }
    delete author.dataset.author;
  }

  HTMLEmitter.prototype.makeDate = function (root) {
    var date = root.querySelector('[data-date]');
    if (date === null) { return; }

    if (this.story.date !== undefined) {
      date.innerHTML = [
        this.story.date.getFullYear(),
        this.story.date.getMonth() + 1,
        this.story.date.getDate()
      ].join('/');
    }
    delete date.dataset.date;
  }

  HTMLEmitter.prototype.toHTML = function () {
    var dom = this.toDOM();
    var tmp = document.createElement('DIV');
    tmp.appendChild(dom);
    return tmp.innerHTML;
  };

  var Stream = AutoBlog.Stream = function (path) {
    this.stories = [];
    this.index = null;
    to(this)
      .addGet('path', function () { return path; })
    ;
  };

  Stream.prototype.load = function () {
    var self = this;
    if (this.index === null) {
      return this.loadIndex().then(loadStories);
    }
    return loadStories();

    function loadStories() {
      return self.loadStories(self.index.paths);
    }
  };

  Stream.prototype.loadIndex = function () {
    var self = this;
    var indexPath = this.path + '/index.json#' + Date.now();
    return getURL(indexPath).then(parseIndex).then(storeIndex);

    function parseIndex(indexSource) {
      return self.parseIndex(indexSource);
    }

    function storeIndex(index) {
      return self.index = index;
    }
  };

  Stream.prototype.parseIndex = function (indexSource) {
    return new Index(this, indexSource);
  };

  Stream.prototype.loadStories = function (storyPaths) {
    var self = this;
    var promises = storyPaths.map(function (url) {
      return getURL(url + '#' + Date.now());
    });
    return Promise.every.apply(this, promises)
      .then(parseStories)
      .then(storeStories);

    function parseStories(storySources) {
      var stories = storySources.map(function (source) {
        return new Story(source);
      });
      return stories;
    }

    function storeStories(stories) {
      return self.stories = stories;
    }
  };

  var Index = AutoBlog.Index = function (stream, indexSource) {
    var rawIndex = JSON.parse(indexSource);
    var paths = rawIndex.map(function (storyName) {
      return stream.path + '/' + storyName;
    });
    to(this)
      .addGet('stream', function () { return stream; })
      .addGet('paths', function () { return paths; })
    ;
  };

  var Plugins = AutoBlog.Plugins = Object.create(null);
  var XRender = Plugins.XRender = function (storyPath) {
    var lastPoint = storyPath.lastIndexOf('.');
    this._extension = storyPath.substring(lastPoint+1);
    this._renderClass = XRender._selectRender(this._extension);
  }
  XRender._selectRender = function (extension) {
    var render, hooks = XRender.Hooks;
    if (extension in hooks && Array.isArray(hooks[extension])) {
      var i = 0, renders = hooks[extension];
      while (render = renders[i++]) {
        if (render.enabled) {
          return render;
        }
      }
    }
    return render;
  }
  XRender._renderClasssDefinedFor = function (extension) {
    return (extension in XRender.Hooks) &&
           Array.isArray(XRender.Hooks[extension]);
  }
  XRender.addRender = function (render) {
    var extension = render.extension;
    if (!XRender._renderClasssDefinedFor(extension)) {
      XRender.Hooks[extension] = [];
    }
    XRender.Hooks[extension].push(render);
  };
  XRender.removeRender = function (render) {
    var renderPosition, extension = render.extension;
    if (XRender._renderClasssDefinedFor(extension)) {
      var renders = XRender.Hooks[extension];
      renderPosition = renders.lastIndexOf(render);
      while (renderPosition > -1) {
        renders.splice(renderPosition, 1);
        renderPosition = renders.lastIndexOf(render);
      }
    }
  };
  XRender.prototype.getRender = function () {
    return this._renderClass;
  };
  XRender.prototype.render = function (text, section) {
    var renderInstance = new this._renderClass();
    return renderInstance.render(text, section)
  }
  to(XRender.prototype)
    .addGet('extension', function () { return this._extension; });

  XRender.Hooks = Object.create(null);
  XRender.Hooks.md = [];
  XRender.Hooks.html = [];

  var MDRender = Plugins.MDRender = function () {
    this._converter = new Showdown.converter();
  };
  MDRender.extension = 'md';
  to(MDRender)
    .addGet('enabled', function () {
      return Showdown && Showdown.converter;
    });

  MDRender.prototype.render = function (text) {
    return this._converter.makeHTML(text);
  };
  XRender.addRender(MDRender);

  var TXTRender = Plugins.TXTRender = function () {
    this._helperToEscape = document.createElement('DIV');
  };
  TXTRender.extension = 'txt';
  TXTRender.enabled = true;

  TXTRender.prototype.render = function (text) {
    this._helperToEscape.textContent = text;
    return this._helperToEscape.innerHTML;
  };
  XRender.addRender(TXTRender);

  var HTMLRender = Plugins.HTMLRender = function () {

  };
  var defaultStoryTemplate =
  '<article data-container>\n' +
    '<header><h1 data-title></h1></header>\n' +
    '<section data-excerpt></section>\n' +
    '<section data-body></section>\n' +
    '<aside>\n' +
      '<p data-author></p>\n' +
      '<time pubdate data-date></time>\n' +
    '</aside>\n' +
  '</article>';

  var AutoBlog = AutoBlog.AutoBlog = function (root) {
    to(this)
      .addGet('root', function () { return root; })
      .addGet('storyTemplate', function () { return defaultStoryTemplate; })
    ;
  };

  AutoBlog.getDefaultStream = function () {
    return 'stories';
  };

  AutoBlog.prototype.getStreamPlaceholders = function () {
    var placeholderElements = this.root.querySelectorAll('[data-stream]'),
        placeholder, streamName;
    this.placeholders = [];
    for (var i = 0, l = placeholderElements.length; i < l; i++) {
      placeholder = placeholderElements[i];
      streamName = placeholder.dataset.stream || AutoBlog.getDefaultStream();
      this.placeholders.push({
        placeholder: placeholder,
        stream: new Stream(streamName)
      });
    }
    return this.placeholders;
  };

  AutoBlog.prototype.fillPlaceholders = function (placeholders) {
    placeholders = placeholders || this.placeholders;
    var self = this;
    var promises = [];
    placeholders.forEach(function (placeholder) {
      promises.push(self.fillPlaceholder(placeholder));
    });
    return Promise.every.apply(this, promises);
  };

  AutoBlog.prototype.fillPlaceholder = function (placeholder) {
    var self = this,
        stream = placeholder.stream;
    return stream.load().then(renderStories);

    function renderStories(stories) {
      var emitter,
          htmlBuffer = '',
          storyTemplate = self.storyTemplate,
          root = placeholder.placeholder;

      stories.forEach(function (story) {
        emitter = new HTMLEmitter(story, storyTemplate);
        htmlBuffer += emitter.toHTML();
        htmlBuffer += '\n';
      });
      root.innerHTML = htmlBuffer;
      return root;
    }
  }

  function discoverBlog() {
    var autoblog = global.autoblog = new AutoBlog(document.body);
    autoblog.getStreamPlaceholders();
    autoblog.fillPlaceholders();
  }

  document.addEventListener('DOMContentLoaded', discoverBlog);
}(this));
