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

  function getStory(url) {
    return new Promise(function (resolver) {
      var source = getURL(url).then(
        function _onSuccess(source) {
          resolver.fulfill([source, url]);
        },
        function _onError(reason) {
          resolver.reject(reason);
        }
      );
    });
  }

  var Story = AutoBlog.Story = function (source, fileName) {
    var model = Story.parseSource(source);
    to(this)
      .addGet('fileName', function () { return fileName; })
      .addGet('title', function () { return model.story.title; })
      .addGet('excerpt', function () { return model.story.excerpt; })
      .addGet('body', function () { return model.story.body; })
      .addGet('author', function () { return model.meta.author; })
      .addGet('date', function () { return model.meta.date; })
    ;
  };

  Story.getStoryNameFromURL = function (url) {
    var parser = document.createElement('A');
    parser.href = url;
    var path = parser.pathname;
    var lastSlash = path.lastIndexOf('/');
    return path.substring(lastSlash + 1);
  }

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
        body = (titleAndBody[2] || '').substring(1);
    var excerptAndBody = body.split(/^\+{3,}\n/m),
        body = excerptAndBody[excerptAndBody.length === 2 ? 1 : 0] ||
               undefined;
    var excerpt = excerptAndBody.length === 2 ?
                  excerptAndBody[0] : undefined;

    if (body) {
      body = removeTrailingBreaks(body);
      body = replaceScapedSequences(body);
    }
    if (excerpt) {
      excerpt = removeTrailingBreaks(excerpt);
      excerpt = replaceScapedSequences(excerpt);
    }

    return {
      title: title,
      excerpt: excerpt,
      body: body
    };

    function removeTrailingBreaks(string) {
      return string.replace(/(\n)+$/g, '');
    }

    function replaceScapedSequences(string) {
      string = string.replace(/^\\\+\+\+/mg, '+++');
      string = string.replace(/^\\---/mg, '---');
      string = string.replace(/^\\\\/mg, '\\');
      return string;
    }
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

  var HTMLEmitter = AutoBlog.HTMLEmitter = function (story, template, render) {
    to(this)
      .addGet('story', function () { return story; })
      .addGet('template', function () { return template; })
      .addGet('render', function () { return render; })
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
    this.makeSection(root, 'container');
  };

  HTMLEmitter.prototype.makeTitle = function (root) {
    this.makeSection(root, 'title', this.story.title);
  };

  HTMLEmitter.prototype.makeExcerpt = function (root) {
    this.makeRenderedSection(root, 'excerpt', this.story.excerpt);
  };

  HTMLEmitter.prototype.makeBody = function (root) {
    this.makeRenderedSection(root, 'body', this.story.body);
  };

  HTMLEmitter.prototype.makeAuthor = function (root) {
    this.makeSection(root, 'author', this.story.author);
  };

  HTMLEmitter.prototype.makeDate = function (root) {
    var dateText = this.story.date ? [
      this.story.date.getFullYear(),
      this.story.date.getMonth() + 1,
      this.story.date.getDate()
    ].join('/') : undefined;

    this.makeSection(root, 'date', dateText);
  };

  HTMLEmitter.prototype.makeSection = function (root, section, value) {
    var sectionElement = root.querySelector('[data-' + section + ']');
    if (section === null) { return; }
    if (value !== undefined && this.story[section] !== undefined) {
      sectionElement.innerHTML = value;
    }
    delete sectionElement.dataset[section];
  };

  HTMLEmitter.prototype.makeRenderedSection = function (root, section, value) {
    if (this.render) { value = this.render.render(value, section); }
    return this.makeSection(root, section, value);
  };

  HTMLEmitter.prototype.toHTML = function () {
    var dom = this.toDOM();
    var tmp = document.createElement('DIV');
    tmp.appendChild(dom);
    return tmp.innerHTML;
  };

  var Plugins = AutoBlog.Plugins = Object.create(null);

  var XRender = Plugins.XRender = function (storyPath) {
    var extension, renderInstance, renderClass,
        lastPoint = storyPath.lastIndexOf('.');
    extension = storyPath.substring(lastPoint + 1);
    renderClass = XRender._selectRender(extension) || NoopRender;
    renderInstance = new renderClass(storyPath);
    to(this)
      .addGet('extension', function () { return extension; })
      .addGet('renderInstance', function () { return renderInstance; })
    ;
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
    console.error('No render installed for .' + extension);
    return render;
  }

  XRender.addRender = function (render) {
    var extension = render.extension;
    if (!XRender._renderClasssDefinedFor(extension)) {
      XRender.Hooks[extension] = [];
    }
    if (XRender.Hooks[extension].indexOf(render) === -1) {
      XRender.Hooks[extension].push(render);
    }
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

  XRender._renderClasssDefinedFor = function (extension) {
    return (extension in XRender.Hooks) &&
           Array.isArray(XRender.Hooks[extension]);
  };

  XRender.autodiscoverRenders = function () {
    for (var globalName in window) {
      var renderCandidate = window[globalName];
      if (isRender(renderCandidate)) {
        XRender.addRender(renderCandidate)
      }
    }

    function isRender(renderCandidate) {
      return (typeof renderCandidate === 'function') &&
             ('extension' in renderCandidate);
    }
  };

  XRender.prototype.getRenderClass = function () {
    return this.renderInstance.constructor;
  };

  XRender.prototype.render = function (text, section) {
    return this.renderInstance.render(text, section);
  };

  XRender.Hooks = Object.create(null);

  var MDRender = Plugins.MDRender = function () {
    var converter = new window.Showdown.converter();
    to(this)
      .addGet('converter', function () { return converter; })
    ;
  };

  MDRender.extension = 'md';

  to(MDRender)
    .addGet('enabled', function () {
      return window.Showdown && window.Showdown.converter;
    })
  ;

  MDRender.prototype.render = function (text) {
    return this.converter.makeHtml(text);
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

  var NoopRender = Plugins.NoopRender = function () {};

  NoopRender.prototype.render = function (text) {
    return text;
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
    var indexPath = this.path + '/index?uid=' + Date.now();
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
      return getStory(url + '?uid=' + Date.now());
    });
    return Promise.every.apply(this, promises)
      .then(parseStories)
      .then(storeStories);

    function parseStories(storySources) {
      var stories = storySources.map(function (sourceAndURL) {
        return new Story(
          sourceAndURL[0],
          Story.getStoryNameFromURL(sourceAndURL[1])
        );
      });
      return stories;
    }

    function storeStories(stories) {
      return self.stories = stories;
    }
  };

  var Index = AutoBlog.Index = function (stream, indexSource) {
    var rawIndex = Index.parseSource(indexSource);
    var paths = rawIndex.map(function (storyName) {
      return stream.path + '/' + storyName;
    });
    to(this)
      .addGet('stream', function () { return stream; })
      .addGet('paths', function () { return paths; })
    ;
  };
  Index.parseSource = function (indexSource) {
    var stories = indexSource.split('\n');
    stories = stories.map(function (item) {
      return item.trim();
    });
    stories = stories.filter(function (item) {
      return item !== '';
    })
    return stories;
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

  var _AutoBlog = AutoBlog.AutoBlog = function (root) {
    to(this)
      .addGet('root', function () { return root; })
      .addGet('storyTemplate', function () { return defaultStoryTemplate; })
    ;
  };

  _AutoBlog.getDefaultStream = function () {
    return 'stories';
  };

  _AutoBlog.prototype.getStreamPlaceholders = function () {
    var placeholderElements = this.root.querySelectorAll('[data-stream]'),
        placeholder, streamName;
    this.placeholders = [];
    for (var i = 0, l = placeholderElements.length; i < l; i++) {
      placeholder = placeholderElements[i];
      streamName = placeholder.dataset.stream || _AutoBlog.getDefaultStream();
      this.placeholders.push({
        placeholder: placeholder,
        stream: new Stream(streamName)
      });
    }
    return this.placeholders;
  };

  _AutoBlog.prototype.fillPlaceholders = function (placeholders) {
    placeholders = placeholders || this.placeholders;
    var self = this;
    var promises = [];
    placeholders.forEach(function (placeholder) {
      promises.push(self.fillPlaceholder(placeholder));
    });
    return Promise.every.apply(this, promises);
  };

  _AutoBlog.prototype.fillPlaceholder = function (placeholder) {
    var self = this,
        stream = placeholder.stream;
    return stream.load().then(renderStories);

    function renderStories(stories) {
      var emitter,
          render,
          htmlBuffer = '',
          storyTemplate = self.storyTemplate,
          root = placeholder.placeholder;

      stories.forEach(function (story) {
        render = new XRender(story.fileName); // TODO: Make this configurable
        emitter = new HTMLEmitter(story, storyTemplate, render);
        htmlBuffer += emitter.toHTML();
        htmlBuffer += '\n';
      });
      root.innerHTML = htmlBuffer;
      return root;
    }
  }

  function discoverBlog() {
    var autoblog = global.autoblog = new _AutoBlog(document.body);
    autoblog.getStreamPlaceholders();
    autoblog.fillPlaceholders();
  }

  XRender.autodiscoverRenders();
  document.addEventListener('DOMContentLoaded', discoverBlog);
}(this));
