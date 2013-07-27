describe('The class AutoBlog', function () {
  'use strict';

  var dom, mainStream, haikuStream;
  beforeEach(function () {
    var body = document.createElement('BODY');
    mainStream = document.createElement('SECTION');
    mainStream.dataset.stream = 'spec/stories';
    haikuStream = document.createElement('SECTION');
    haikuStream.dataset.stream = 'spec/haikus';
    body.appendChild(mainStream);
    body.appendChild(haikuStream);
    dom = document.createDocumentFragment();
    dom.appendChild(body);
  });

  it('is an utility class to build a blog based on AutoBlog.Stream instances',
    function () {
      expect(AutoBlog.AutoBlog).toBeDefined();
    }
  );

  it('discovers the stream placeholders based on the data-stream attribute',
    function () {
      var root = dom.firstChild;
      var autoblog = new AutoBlog.AutoBlog(root);
      var streams = autoblog.getStreamPlaceholders();
      expect(streams[0].placeholder).toBe(mainStream);
      expect(streams[0].stream.path).toBe(mainStream.dataset.stream);
      expect(streams[1].placeholder).toBe(haikuStream);
      expect(streams[1].stream.path).toBe(haikuStream.dataset.stream);
    }
  );

  it('fills a stream placeholder with the stories from the stream',
    function () {
      var root = dom.firstChild,
          autoblog = new AutoBlog.AutoBlog(root),
          Stream = AutoBlog.Stream,
          finished = false;

      runs(function () {
        var streamPlaceholder = {
          placeholder: mainStream,
          stream: new Stream('spec/stories')
        };
        autoblog.fillPlaceholder(streamPlaceholder).then(function (result) {
          finished = true;
        });
      });

      waitsFor(function () {
        return finished;
      }, 'fillPlaceholder(streamPlaceholder) to finish', 1000);

      runs(function () {
        expect(mainStream.childElementCount).toBe(3);
      })
    }
  );

  describe('Errors while filling placeholders', function() {
    var RealHTMLEmitter = AutoBlog.HTMLEmitter,
        FailingHTMLEmitter;

    beforeEach(function () {
      FailingHTMLEmitter = function fake() {
        !fake.count && (fake.count = 0);
        fake.count++;
        if (fake.count === 2) {
          throw new Error('Testing forced error in call number 2');
        }
        RealHTMLEmitter.apply(this, arguments);
      };
      FailingHTMLEmitter.prototype = RealHTMLEmitter.prototype;
    });

    afterEach(function () {
      AutoBlog.HTMLEmitter = RealHTMLEmitter;
    });

    it('make filling to ignore (but log) broken stories',
      function () {
        var root = dom.firstChild,
            autoblog = new AutoBlog.AutoBlog(root),
            Stream = AutoBlog.Stream,
            finished = false;

        AutoBlog.HTMLEmitter = FailingHTMLEmitter;

        runs(function () {
          var streamPlaceholder = {
            placeholder: mainStream,
            stream: new Stream('spec/stories')
          };
          autoblog.fillPlaceholder(streamPlaceholder).then(function (result) {
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 'fillPlaceholder(streamPlaceholder) to finish', 1000);

        runs(function () {
          expect(mainStream.childElementCount).toBe(2);
        });
      }
    );

  });

});
