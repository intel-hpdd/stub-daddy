import picker from '../../../lib/picker';
import * as obj from '@mfl/obj';

import { describe, beforeEach, it, jasmine, expect } from '../../jasmine.js';

describe('picker', function() {
  let user, userPicker;
  beforeEach(function() {
    user = {
      user: 'will',
      age: 34,
      state: 'FL'
    };

    userPicker = picker(['user', 'state']);
  });

  it('should return a function', function() {
    expect(userPicker).toEqual(jasmine.any(Function));
  });

  it('should return a new object consisting only of the keys specified', function() {
    const picked = obj.pickBy(userPicker, user);
    expect(picked).toEqual({ user: 'will', state: 'FL' });
  });
});