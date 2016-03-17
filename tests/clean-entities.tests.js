describe('clean entities tests', function() {

  it('cleans &nbsp;', function() {

    var result = $.htmlClean(
      '<p>contains&nbsp;<a>in</a>&nbsp;text</p>');

    expect(result)
      .toBe('<p>contains <a>in</a> text</p>');
  });

});