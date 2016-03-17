describe('clean classes tests', function() {


  it('allows classes', function() {
    
    var result = $.htmlClean(
    '<div id="Utter" class="bird" frog="chicken">retains old attributes allowed</div>',
    {
      allowedAttributes: [["id"]],
      allowedClasses: [["bird"]]
    });

    expect(result)
  .toBe('<div id="Utter" class="bird">retains old attributes allowed</div>');

  })

});