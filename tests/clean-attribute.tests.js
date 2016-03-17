describe('clean attributes tests', function() {

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

  it('removes attributes', function() {

    var result = $.htmlClean(
      '<p align="center">hello<p>'
      );

    expect(result)
      .toBe('<p>hello</p>');
  });

  it('quotes attributes', function() {

    var result = $.htmlClean(
      '<table><tbody><tr><td colspan=2>check colspan</td></tr></tbody></table>'
      );

    expect(result)
      .toBe('<table><tbody><tr><td colspan=\'2\'>check colspan</td></tr></tbody></table>');
  });

});