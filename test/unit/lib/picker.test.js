import picker from '../../../lib/picker';
import * as obj from '@iml/obj';

import { describe, beforeEach, it, jasmine, expect } from '../../jasmine.js';

describe('picker', () => {
  let user, userPicker;
  beforeEach(() => {
    user = {
      user: 'will',
      age: 34,
      state: 'FL'
    };

    userPicker = picker(['user', 'state']);
  });

  it('should return a function', () => {
    expect(userPicker).toEqual(jasmine.any(Function));
  });

  it('should return a new object consisting only of the keys specified', () => {
    const picked = obj.pickBy(userPicker, user);
    expect(picked).toEqual({ user: 'will', state: 'FL' });
  });
});
