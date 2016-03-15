describe('main tests', function() {

  it('cleans &nbsp;', function() {

    var result = $.htmlClean(
      '<p>contains&nbsp;<a>in</a>&nbsp;text</p>');

    expect(result)
      .toBe('<p>contains <a>in</a> text</p>');
  });

  it('allow attributes', function() {

    var result = $.htmlClean(
      '<div data-image="hello">hiya</div>',
      {
        allowedAttributes: [["data-image"]]
      });

    expect(result)
      .toBe('<div data-image="hello">hiya</div>');
  });

  it('allow attributes - removes not allowed', function() {

    var result = $.htmlClean(
      '<div id="Utter" frog="chicken">allows new attribute</div>',
      {
        allowedAttributes: [["id"]]
      });

    expect(result)
      .toBe('<div id="Utter">allows new attribute</div>');
  });

  it('allow attributes - on specific tag', function() {

    var result = $.htmlClean(
      '<div id="Utter" frog="chicken"><span id="Sau">allows new attribute on specific tag</span></div>',
      {
        allowedAttributes: [
          ["id", ["span"]]
        ]
      });

    expect(result)
      .toBe('<div><span id="Sau">allows new attribute on specific tag</span></div>');
  });
});