describe('The built-in renders', function () {
  'use strict';

  var testText = '**This is a <span>test</span> text**';
  var expectedTextResult = '**This is a &lt;span&gt;test&lt;/span&gt; text**';

  it('include a `noop` render wich do nothing but returning the original text',
    function () {
      var noopRender = new AutoBlog.Plugins.NoopRender(),
          resultText = noopRender.render(testText);
      expect(resultText).toBe(testText);
    }
  );

  it('include a `txt` render wich insert sanitized text content',
    function () {
      var txtRender = new AutoBlog.Plugins.TXTRender(),
          resultText = txtRender.render(testText);
      expect(resultText).toBe(expectedTextResult);
    }
  );

  it('include a `md` render (a wrapper for Showdown) wich parses markdown text',
    function () {
      var mdRender = new AutoBlog.Plugins.MDRender(),
          resultText = mdRender.render(testText),
          converter = new Showdown.converter(),
          expectedMDResult = converter.makeHtml(testText);
      expect(window.Showdown).toBeDefined();
      expect(resultText).toBe(expectedMDResult);
    }
  );
});
