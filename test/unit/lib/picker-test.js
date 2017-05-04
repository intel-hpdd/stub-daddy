var picker = require('../../../lib/picker');
var obj = require('@mfl/obj');

describe('picker', function () {
  var user, userPicker;
  beforeEach(function () {
    user = {
      user: 'will',
      age: 34,
      state: 'FL'
    };

    userPicker = picker(['user', 'state']);
  });

  it('should return a function', function () {
    expect(userPicker).toEqual(jasmine.any(Function));
  });

  it('should return a new object consisting only of the keys specified', function () {
    var pickFromObj = obj.pickBy(userPicker);
    expect(pickFromObj(user)).toEqual({user: 'will', state: 'FL'});
  });
});
