describe('The class Stream', function () {
  'use strict';

  var origin = window.location.origin,
      storiesPath = 'spec/stories',
      referenceIndexSource = 'story1\nstory2',
      referenceIndex = {
        paths: ["story1", "story2"].map(function (storyName) {
          return storiesPath + '/' + storyName;
        })
      },
      referenceStories = [
        {
          title: 'Story 1',
          excerpt: 'A short excerpt.',
          body: 'An extended text.',
          author: 'Salva',
          date: new Date(2013, 0, 1)
        },
        {
          title: 'Story 2',
          excerpt: 'A short excerpt.',
          body: 'An extended text.',
          author: 'Bea',
          date: new Date(2013, 0, 2)
        }
      ];

  it('represents a list of stories stored in an URL',
    function () {
      expect(AutoBlog.Stream).toBeDefined();
    }
  );

  it('uses a file called index to know which stories are in the stream',
    function () {
      var index;

      runs(function () {
        var stream = new AutoBlog.Stream(storiesPath);
        stream.loadIndex().then(function (result) {
          index = result;
        });
      });

      waitsFor(function () {
        return index !== undefined;
      }, 'loadIndex() to finish.', 1000);

      runs(function () {
        expect(index).toEqual(referenceIndex);
      });
    }
  );

  it('process the index to obtain the paths for published files',
    function () {
      var stream = new AutoBlog.Stream(storiesPath);
      var processedIndex = stream.parseIndex(referenceIndexSource);
      expect(processedIndex).toEqual(jasmine.any(AutoBlog.Index))
      expect(processedIndex).toEqual(referenceIndex);
    }
  );

  it('loads stories asynchronously',
    function () {
      var stories, stream;

      runs(function () {
        stream = new AutoBlog.Stream(storiesPath);
        stream.loadStories(referenceIndex.paths).then(function (result) {
          stories = result;
        });
      });

      waitsFor(function () {
        return stories !== undefined;
      }, 'loadStories(referenceIndex.paths) to finish.', 1000);

      runs(function () {
        expect(stream.stories).toEqual(referenceStories);
      });
    }
  );

  it('loads a complete set of stories based on the information in the index',
    function () {
      var stories, stream;

      runs(function () {
        stream = new AutoBlog.Stream(storiesPath);
        stream.load().then(function (result) {
          stories = result;
        });
      });

      waitsFor(function () {
        return stories !== undefined;
      }, 'stream.load() to finish.', 1000);

      runs(function () {
        expect(stream.stories).toEqual(referenceStories);
      });
    }
  );
});
