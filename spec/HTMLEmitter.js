describe('The class HTMLEmitter', function () {
  'use strict';

  var story = {
    title: 'The title',
    excerpt: 'A short excerpt.',
    body: 'An extended text.',
    author: 'Salva',
    date: new Date(2013, 0, 1)
  };

  var template =
  '<div data-container>\n'+
    '<h1 data-title></h1>\n' +
    '<div data-excerpt></div>\n' +
    '<div data-body></div>\n' +
    '<p data-author></p>\n' +
    '<p data-date></p>\n' +
  '</div>';

  function expectDOMToMatchTemplate(dom) {
    expect(dom.childNodes.length).toBe(1);
    var container = dom.firstChild;
    expect(container.children.item(0).tagName).toBe('H1');
    expect(container.children.item(0).textContent).toBe(story.title);
    expect(container.children.item(1).tagName).toBe('DIV');
    expect(container.children.item(1).textContent).toBe(story.excerpt);
    expect(container.children.item(2).tagName).toBe('DIV');
    expect(container.children.item(2).textContent).toBe(story.body);
    expect(container.children.item(3).tagName).toBe('P');
    expect(container.children.item(3).textContent).toBe(story.author);
    expect(container.children.item(4).tagName).toBe('P');
  }

  it('is an utility class to convert a Story into a DOM tree or HTML',
    function () {
      expect(AutoBlog.HTMLEmitter).toBeDefined();
    }
  );

  it('has an utility to make a fragment from a string',
    function () {
      var source = '<div>Test</div>',
          fragment = AutoBlog.HTMLEmitter.getFragmentFromString(source),
          out = document.createElement('DIV');
      out.appendChild(fragment);
      expect(out.innerHTML).toBe(source);
    }
  );

  it('emmits a document fragment with the DOM tree for the template',
    function () {
      var emitter = new AutoBlog.HTMLEmitter(story, template),
          dom = emitter.toDOM();
      expectDOMToMatchTemplate(dom);
    }
  );

  it('emmits a HTML string representation',
    function () {
      var emitter = new AutoBlog.HTMLEmitter(story, template);
      var html = emitter.toHTML();
      var fragment = AutoBlog.HTMLEmitter.getFragmentFromString(html);
      expectDOMToMatchTemplate(fragment);
    }
  );

});
