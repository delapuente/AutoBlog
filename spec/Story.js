describe('The class Story', function () {
  'use strict';

  var storyComponents = {
    storyFileName: 'story.md',
    storyTitle: 'The title',
    storyExcerpt: 'An excerpt...',
    storyBody: '...for a longer text.',
    storyAuthor: 'Salva',
    storyDate: new Date(2013, 0, 1),
    '---': '---',
    '+++': '+++'
  };

  function makeSource() {
    var tokenList = [], tokenKey, tokenValue;
    for (var i = 0, l = arguments.length; i < l; i++) {
      tokenKey = arguments[i];
      tokenValue = makeTokenValue(tokenKey);
      tokenList.push(tokenValue);
    }
    return tokenList.join('\n');
  }

  function makeTokenValue(tokenKey) {
    var tokenValue = storyComponents[tokenKey];
    switch (tokenKey) {
      case 'storyAuthor':
        return makeAuthor(tokenValue);
      case 'storyDate':
        return makeDate(tokenValue);
      default:
        return tokenValue
    }
  }

  function makeAuthor(author) {
    return 'by ' + author;
  }

  function makeDate(date) {
    return 'on ' + [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    ].join('-');
  }

  it('representats of a blog post.',
    function () {
      expect(AutoBlog.Story).toBeDefined();
    }
  );

  it('builds Story instances by parsing a micro-format in the constructor',
    function () {
      var story, source = makeSource(
        'storyTitle',
        'storyExcerpt',
        '+++',
        'storyBody',
        '---',
        'storyAuthor',
        'storyDate'
      );
      function parse() {
        story = new AutoBlog.Story(source, storyComponents.storyFileName);
      }
      expect(parse).not.toThrow();
      expect(story.fileName).toBe(storyComponents.storyFileName);
      expect(story.title).toBe(storyComponents.storyTitle);
      expect(story.excerpt).toBe(storyComponents.storyExcerpt);
      expect(story.body).toBe(storyComponents.storyBody);
      expect(story.author).toBe(storyComponents.storyAuthor);
      expect(story.date).toEqual(storyComponents.storyDate);
    }
  );

  it('supports only title and body',
    function () {
      var story, source = makeSource(
        'storyTitle',
        'storyBody'
      );
      function parse() {
        story = new AutoBlog.Story(source);
      }
      expect(parse).not.toThrow();
      expect(story.title).toBe(storyComponents.storyTitle);
      expect(story.body).toBe(storyComponents.storyBody);
      expect(story.excerpt).toBeUndefined();
      expect(story.author).toBeUndefined();
      expect(story.date).toBeUndefined();
    }
  );

  it('supports only title',
    function () {
      var story, source = makeSource('storyTitle');
      function parse() {
        story = new AutoBlog.Story(source);
      }
      expect(parse).not.toThrow();
      expect(story.title).toBe(storyComponents.storyTitle);
      expect(story.body).toBeUndefined();
      expect(story.excerpt).toBeUndefined();
      expect(story.author).toBeUndefined();
      expect(story.date).toBeUndefined();
    }
  );

  describe('The utility class MicroformatPreprocessor', function () {
    var rtrim = AutoBlog.Story.MicroformatPreprocessor.removeTrailingBreaks;
    var escape = AutoBlog.Story.MicroformatPreprocessor.replaceScapedSequences;

    it('removes trailing breaklines', function () {
      expect(rtrim('foo\n\nbar\n\n')).toBe('foo\n\nbar');
    });

    it('support escaped sequences for +++ and ---', function () {
      expect(escape('\\+++\n')).toBe('+++\n');
      expect(escape('\\---\n')).toBe('---\n');
    });

    it('support escaped sequences for \\+++ and \\---', function () {
      expect(escape('\\\\+++\n')).toBe('\\+++\n');
      expect(escape('\\\\---\n')).toBe('\\---\n');
    });

    it('does not escape when there is no trailing breakline', function () {
      expect(escape('\\+++')).toBe('\\+++');
      expect(escape('\\---')).toBe('\\---');
    });

    it('does not escape when sequences are not at the beginning of the line',
    function () {
      expect(escape('foo \\+++\n')).toBe('foo \\+++\n');
      expect(escape('foo \\---\n')).toBe('foo \\---\n');
    });

    it('does not escape when sequences are not exactly the same as used in ' +
       'the microformat',
    function () {
      expect(escape('\\++++\n')).toBe('\\++++\n');
      expect(escape('\\----\n')).toBe('\\----\n');
    });

    it('does not escape slashes not preceeding +++ or ---',
    function () {
      expect(escape('\\noob\n')).toBe('\\noob\n');
    });
  });
});
