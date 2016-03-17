describe('clean tags tests', function() {

  it('removes tag but leaves content', function() {

    var result = $.htmlClean(
      '<p><font>hello</font><p>'
    );

    expect(result)
      .toBe('<p>hello</p>');
  });

  it('[defaults] removes tag but leaves content', function() {

    $.htmlClean.defaults.allowedTags = ['p', 'em'];
    var result = $.htmlClean(
      '<p>testing <i>allowedTags</i> <strong>option</strong> <em>(white list)</em></p>'
      );
    $.htmlClean.defaults.allowedTags = [];

    expect(result)
      .toBe('<p>testing <em>allowedTags</em> option <em>(white list)</em></p>');
  });

  it('[defaults] removes tag after obsolete replace b=>strong', function() {

    $.htmlClean.defaults.removeTags = ['strong'];
    var result = $.htmlClean(
      '<p>testing <i>removeTags</i> <b>option</b> <em>(black list)</em></p>'
    );
    $.htmlClean.defaults.removeTags = [];

    expect(result)
      .toBe('<p>testing <em>removeTags</em> option <em>(black list)</em></p>');
  });

  it('[defaults] removes tag and content after obsolete replace b=>strong', function() {

    $.htmlClean.defaults.removeTagsAndContent = ['strong'];
    var result = $.htmlClean(
      '<p>testing <i>removeTags</i> <b>option</b> <em>(black list)</em></p>');
    $.htmlClean.defaults.removeTagsAndContent = [];

    expect(result)
      .toBe('<p>testing <em>removeTags</em>  <em>(black list)</em></p>');
  });

});